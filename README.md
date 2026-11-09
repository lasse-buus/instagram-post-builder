# Then & Now Studio

Desktop editor for seamless Instagram carousel posts: an old photo with a 2007 polaroid, a few story slides, and a 2027 photo at the end.

## Run

```bash
npm install
npm run dev          # opens the Electron app with hot reload
BROWSER_ONLY=1 npm run dev   # same editor in the browser, no Electron
npm run dist         # build a macOS .dmg into release/
```

## How it works

- **One strip, sliced on export.** A post is a single canvas `slides × 1080` px wide. Elements are placed on the strip, so anything can cross a seam. Export renders the strip once and cuts it into `name-01.png`, `name-02.png`, …
- **3:4 (1080×1440) by default**, the only size the profile grid shows uncropped. Upload with Instagram's "Original" option. Switch to 4:5 per post if it will be published through the API or boosted; the editor then shades what the 3:4 grid crops.
- **Background photo + colour overlay.** Slides 1 and 4 show the polaroid's photo behind the frame, tinted. Overlay colour, strength, blend mode (multiply = duotone) and black & white live on the background image; picking a slide colour also recolours that slide's overlay.
- **Consent.** Each post records whether the person agreed. Export warns if not.
- **Autosave** to IndexedDB; **Save / Open** as `.carousel.json` (images embedded).

## Editor

Drag to move, corner handle to resize (Shift keeps ratio), Alt disables snapping to seams / centres / safe zones. Drop photos straight onto a polaroid. ⌫ deletes, ⌘D duplicates, arrows nudge.

## Structure

```
electron/main.ts        window + file dialogs (export folder, save/open)
electron/preload.ts     window.studio bridge
src/types.ts            Post / element model, sizes, palette
src/template.ts         default then → story → now post
src/store.ts            zustand state
src/components/Stage.tsx            renders the strip (editor, preview and export share it)
src/components/StripEditor.tsx      drag, resize, snapping, seam and safe-zone guides
src/components/Inspector.tsx        left panel
src/components/InstagramPreview.tsx feed mock with swipe
src/lib/export.ts       html-to-image → slices
src/lib/files.ts        save / open / export, browser fallbacks
```

## Next ideas

Undo/redo, profile-grid preview, saved themes, multiple posts in a library, caption drafting, Reels export.
