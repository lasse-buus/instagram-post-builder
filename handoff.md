# Handoff — Then & Now Studio

_Last updated: 2026-11-09_

## What this is

A macOS desktop app (Electron) for making **seamless Instagram carousel posts** for an old-school "20 years later" account. Each post is about one former classmate:

1. **Slide 1 — Then:** their 2007 photo in a polaroid frame, labelled "2007".
2. **Middle slides — Story:** text about who they were and what they do now.
3. **Last slide — Now:** a current photo in the same frame, labelled "2027".

"Seamless carousel" means the slides are one continuous image: elements can cross the edge between two slides, so swiping feels like scrolling one long picture.

## Status

Working MVP, scaffolded in one session.

| Verified | How |
|---|---|
| Typecheck + Vite build (renderer and Electron main/preload) | `tsc --noEmit`, `vite build` |
| Editor, photo upload, preview swipe, PNG export | Headless Chrome run of the browser build with two real photos; 4 slices exported at 1080×1440 and lined up across seams |
| `npm install` + `npm run dev` on the Mac | Done by Lasse after handoff of files |

**Not yet verified:** the Electron-only paths — native export folder dialog, Save/Open dialogs, `hiddenInset` title bar spacing, `npm run dist` (.dmg build). These are written but were only exercised through their browser fallbacks.

There is no git repo yet.

## Run

```bash
npm install
npm run dev                  # Electron app with hot reload
BROWSER_ONLY=1 npm run dev   # same editor in a normal browser (handy for devtools / headless tests)
npm run typecheck
npm run dist                 # macOS .dmg via electron-builder → release/
```

## Key decisions (and why)

- **One strip, sliced on export.** A post is a single canvas `slideCount × 1080` px wide. Elements store coordinates on the strip, not per slide. Export renders the whole strip once with `html-to-image`, then cuts it into 1080-wide PNGs. Rendering once is what guarantees things line up across seams.
- **One renderer for everything.** `Stage.tsx` draws the strip at native pixel size. The editor shows it CSS-scaled, the Instagram preview shows it scaled + translated, and export uses a hidden unscaled copy (in `App.tsx`, positioned off-screen) with no selection chrome. Don't fork rendering logic between these.
- **Default aspect 3:4 (1080×1440).** It's the only size the Instagram profile grid shows uncropped; uploaded via Instagram's "Original" option. 4:5 (1080×1350) is a per-post toggle — needed if posts are ever published via the Meta API or boosted as ads (both reject 3:4). In 4:5 mode the editor shades what the 3:4 grid crops on slide 1.
- **Electron over Tauri.** Export depends on Chromium rendering HTML → canvas reliably (fonts, filters, `mix-blend-mode`). Tauri on macOS uses WebKit, where this is flakier.
- **Background photo + colour overlay** (Lasse's call, after first trying plain colours): slides 1 and last have an `image` element linked to the polaroid (`linkedTo`), so uploading the polaroid photo fills the background too. The overlay is `tint` on that element: colour, strength, blend mode (`multiply` = duotone, the default), optional grayscale. Visual reference was a bold flat-colour poster style (yellow, teal, coral, pink, purple). Per-slide background colours also exist and **setting a slide's colour recolours that slide's overlay**.
- **Consent is part of the data model.** Real classmates and their childhood photos, in Norway (GDPR). Each post has `consent { given, date, note }`; export asks for confirmation if it's not given. Keep this.

## Code map

```
electron/main.ts        BrowserWindow + IPC: export-slices, save-project, open-project (native dialogs)
electron/preload.ts     exposes window.studio (contextIsolation on, sandbox off — preload is built as CommonJS .cjs (a CJS bundle named .mjs fails to load and silently disables window.studio))
src/types.ts            Post / element types, slide sizes, polaroid geometry, PALETTE, slideBg()
src/template.ts         createDefaultPost(), newElement(), backgroundFromPolaroid(), circle()
src/store.ts            zustand store: all mutations (updateEl, setImage, setSlideBg, setSlideCount, …)
src/App.tsx             top bar, layout, autosave (IndexedDB), export flow, hidden export stage
src/components/Stage.tsx            renders the strip; element rendering per type
src/components/StripEditor.tsx      drag / resize / snapping, keyboard shortcuts, seam + safe-zone guides
src/components/Library.tsx          people overview (start screen): account card, open / new / import / delete
src/components/Inspector.tsx        left panel: add elements, post settings, per-element controls
src/components/InstagramPreview.tsx feed mock with swipe, dots, caption + account fields
src/lib/export.ts       renderSlices(): strip → PNG blobs
src/lib/library.ts      people library: list/read/write/delete posts; Electron → people/*.json via IPC, browser → IndexedDB
src/lib/files.ts        save/open/export through window.studio, with browser download fallbacks; readImage() downscales to 2400px
```

## Data model essentials

- `Post`: `version: 1`, `person`, `account`, `aspect`, `slideCount` (2–20), `background` (fallback), `slideBackgrounds[]`, `elements[]` (array order = z-order), `caption`, `consent`, `status` (draft/ready/posted).
- Element types: `polaroid` (height derived from width via `polaroidLayout()` — never set `h` directly), `image` (crop, blur, opacity, `linkedTo`, `tint`), `text`, `rect` (also used for circles: `radius = w/2` with `w === h`).
- `Crop` is a focal point in % plus zoom (1 = cover).
- Images are stored as data URLs inside the post (JPEG, downscaled on import). `.carousel.json` files are self-contained.
- `store.load()` runs `normalize()` to fill `slideBackgrounds` for older files. **If you change the schema, extend `normalize()` or bump `version`.**

## Gotchas

- Background images must come **first** in `elements` or they cover lines/shapes that cross into that slide (this bit the timeline once). `addPhotoBackground()` prepends for this reason.
- Selection chrome sizes are divided by the editor scale (`px = 1/scale` in `Stage`) so they stay a constant on-screen size.
- Autosave writes the whole post into the library on every change (debounced 500 ms, plus a flush on "← All people"). Files live in `people/<post id>.json` in the project folder during development (git-ignored — real classmates' photos) and in the app's user-data folder when packaged. Deleting moves the file to the Trash. **Person template:** "Save as template" writes `person-template.json` beside `people/` (photos, name, consent, status stripped by `templateFrom()`); "New person" starts from it, else `createDefaultPost()`. **Account profile photo:** a 1:1, one-slide `Post` (`createProfile()`) edited in the same editor (view `profile`), autosaved to `account.json` beside `people/` (git-ignored — may hold a photo); shown via `Avatar` in the library and the feed preview. Both single files go through the `doc-read/write/delete` IPC with a name allow-list. Text elements support `effect` (`cutout` | `tiles`) and `arc`, rendered per letter in `Letters` (Stage.tsx). The old single-post IndexedDB autosave (`then-now:current`) is migrated into the library on launch.
- `setSlideCount()` drops elements whose `x` starts beyond the new strip width — no undo exists yet, so this is destructive.
- Empty photo slots show "Drop the photo here" only in the editor (`interactive`); in the preview and export they are plain grey.

## Next steps (suggested order)

1. **Undo/redo** — most needed. `zundo` temporal middleware on the zustand store is the cheap route; throttle history during drags.
2. **Git init + first commit** (Lasse prefers his GitHub noreply email on public commits).
3. Verify the Electron-only paths listed above, then `npm run dist`.
4. **Post library follow-up** — overview exists; images are still embedded data URLs in each JSON (listing decodes them for thumbnails). Move to one folder per post with image files if the library gets slow.
5. Saved themes (fonts, palettes, default overlay), profile-grid preview (3 columns), caption helpers/hashtags.
6. Later: Reels/video export of the same story; optional publishing via the Instagram Graph API (requires Business/Creator account linked to a Facebook Page, and 4:5 posts).
