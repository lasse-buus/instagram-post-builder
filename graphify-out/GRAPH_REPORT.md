# Graph Report - instagram-post-builder  (2026-11-09)

## Corpus Check
- 18 files · ~8,478 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 1, .css 1)

## Summary
- 165 nodes · 364 edges · 15 communities (12 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- types.ts
- App.tsx
- compilerOptions
- Inspector.tsx
- devDependencies
- dependencies
- Handoff — Then & Now Studio
- vite.config.ts
- package.json
- build
- Then & Now Studio
- main.ts
- scripts
- electron
- @types/react-dom@^19.1.5

## God Nodes (most connected - your core abstractions)
1. `useStore` - 16 edges
2. `slideHeight()` - 14 edges
3. `App()` - 13 edges
4. `compilerOptions` - 13 edges
5. `ElementInspector()` - 12 edges
6. `Stage` - 11 edges
7. `createDefaultPost()` - 10 edges
8. `Post` - 10 edges
9. `Inspector()` - 9 edges
10. `Handoff — Then & Now Studio` - 9 edges

## Surprising Connections (you probably didn't know these)
- `Data model essentials` --references--> `normalize()`  [INFERRED]
  handoff.md → src/store.ts
- `Data model essentials` --references--> `text()`  [INFERRED]
  handoff.md → src/template.ts
- `Data model essentials` --references--> `Crop`  [INFERRED]
  handoff.md → src/types.ts
- `Data model essentials` --references--> `Post`  [INFERRED]
  handoff.md → src/types.ts
- `Data model essentials` --references--> `polaroidLayout()`  [INFERRED]
  handoff.md → src/types.ts

## Import Cycles
- None detected.

## Communities (15 total, 3 thin omitted)

### Community 0 - "types.ts"
Cohesion: 0.16
Nodes (26): Data model essentials, Props, normalize(), State, backgroundFromPolaroid(), circle(), createDefaultPost(), newElement() (+18 more)

### Community 1 - "App.tsx"
Cohesion: 0.18
Nodes (22): react, App(), Icon(), InstagramPreview(), DragMode, ElementContent(), FONTS, Photo() (+14 more)

### Community 2 - "compilerOptions"
Cohesion: 0.13
Nodes (14): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noUnusedLocals, noUnusedParameters (+6 more)

### Community 3 - "Inspector.tsx"
Cohesion: 0.43
Nodes (13): CropControls(), ElementInspector(), Field(), Inspector(), Num(), PostInspector(), Range(), Section() (+5 more)

### Community 4 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, electron-builder@^26.0.12, tailwindcss@^4.1.8, @types/node@^22.20.5, @types/react@^19.1.6, typescript@^5.8.3, electron-builder, tailwindcss (+3 more)

### Community 5 - "dependencies"
Cohesion: 0.20
Nodes (10): dependencies, html-to-image@^1.11.13, idb-keyval@^6.2.1, react@^19.1.0, react-dom@^19.1.0, zustand@^5.0.5, html-to-image, idb-keyval (+2 more)

### Community 6 - "Handoff — Then & Now Studio"
Cohesion: 0.22
Nodes (8): Code map, Gotchas, Handoff — Then & Now Studio, Key decisions (and why), Next steps (suggested order), Run, Status, What this is

### Community 7 - "vite.config.ts"
Cohesion: 0.22
Nodes (8): @tailwindcss/vite@^4.1.8, vite@^6.3.5, vite-plugin-electron@^0.29.0, @vitejs/plugin-react@^4.5.0, @tailwindcss/vite, vite, vite-plugin-electron, @vitejs/plugin-react

### Community 8 - "package.json"
Cohesion: 0.25
Nodes (7): description, main, name, private, productName, type, version

### Community 9 - "build"
Cohesion: 0.29
Nodes (7): build, appId, files, mac, productName, category, target

### Community 10 - "Then & Now Studio"
Cohesion: 0.29
Nodes (6): Editor, How it works, Next ideas, Run, Structure, Then & Now Studio

### Community 12 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, dist, typecheck

## Knowledge Gaps
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `App.tsx` to `package.json`, `Inspector.tsx`, `dependencies`?**
  _High betweenness centrality (0.237) - this node is a cross-community bridge._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Why does `Data model essentials` connect `types.ts` to `Handoff — Then & Now Studio`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Why does `Handoff — Then & Now Studio` connect `Handoff — Then & Now Studio` to `types.ts`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._