# Graph Report - instagram-post-builder  (2026-11-09)

## Corpus Check
- 20 files · ~10,781 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 2, .css 1)

## Summary
- 190 nodes · 461 edges · 10 communities
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `837602b1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- template.ts
- compilerOptions
- Inspector.tsx
- package.json
- Handoff — Then & Now Studio
- build
- Then & Now Studio
- main.ts
- types.ts
- App.tsx

## God Nodes (most connected - your core abstractions)
1. `App()` - 18 edges
2. `bridge()` - 16 edges
3. `useStore` - 16 edges
4. `slideHeight()` - 16 edges
5. `Library()` - 13 edges
6. `compilerOptions` - 13 edges
7. `ElementInspector()` - 12 edges
8. `createDefaultPost()` - 12 edges
9. `Post` - 12 edges
10. `Inspector()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `Gotchas` --references--> `createDefaultPost()`  [INFERRED]
  handoff.md → src/template.ts
- `Gotchas` --references--> `templateFrom()`  [INFERRED]
  handoff.md → src/template.ts
- `Data model essentials` --references--> `normalize()`  [INFERRED]
  handoff.md → src/store.ts
- `Data model essentials` --references--> `text()`  [INFERRED]
  handoff.md → src/template.ts
- `Data model essentials` --references--> `Crop`  [INFERRED]
  handoff.md → src/types.ts

## Import Cycles
- None detected.

## Communities (10 total, 0 thin omitted)

### Community 0 - "template.ts"
Cohesion: 0.15
Nodes (33): Data model essentials, html-to-image@^1.11.13, html-to-image, Inspector(), Icon(), InstagramPreview(), DragMode, ElementContent() (+25 more)

### Community 2 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noUnusedLocals, noUnusedParameters (+6 more)

### Community 3 - "Inspector.tsx"
Cohesion: 0.45
Nodes (11): CropControls(), ElementInspector(), Field(), Num(), PostInspector(), Range(), Section(), SlideBackgrounds() (+3 more)

### Community 4 - "package.json"
Cohesion: 0.06
Nodes (44): dependencies, idb-keyval@^6.2.1, react@^19.1.0, react-dom@^19.1.0, zustand@^5.0.5, description, devDependencies, electron@^36.3.2 (+36 more)

### Community 6 - "Handoff — Then & Now Studio"
Cohesion: 0.22
Nodes (8): Code map, Gotchas, Handoff — Then & Now Studio, Key decisions (and why), Next steps (suggested order), Run, Status, What this is

### Community 9 - "build"
Cohesion: 0.29
Nodes (7): build, appId, files, mac, productName, category, target

### Community 10 - "Then & Now Studio"
Cohesion: 0.29
Nodes (6): Editor, How it works, Next ideas, Run, Structure, Then & Now Studio

### Community 11 - "main.ts"
Cohesion: 0.24
Nodes (4): __dirname, libraryDir(), postFile(), templateFile()

### Community 13 - "types.ts"
Cohesion: 0.23
Nodes (11): Aspect, Base, Bubble, ElType, ImageEl, PALETTE, PolaroidEl, RectEl (+3 more)

### Community 14 - "App.tsx"
Cohesion: 0.19
Nodes (26): App(), fmtDate(), Library(), STATUS_STYLE, Thumb(), renderSlices(), bridge(), download() (+18 more)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `package.json` to `template.ts`, `Inspector.tsx`, `App.tsx`?**
  _High betweenness centrality (0.197) - this node is a cross-community bridge._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Why does `Handoff — Then & Now Studio` connect `Handoff — Then & Now Studio` to `template.ts`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05920444033302498 - nodes in this community are weakly interconnected._
- **Why does `Data model essentials` connect `template.ts` to `Handoff — Then & Now Studio`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._