import { get, set } from 'idb-keyval'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { InstagramPreview } from './components/InstagramPreview'
import { Inspector } from './components/Inspector'
import { Stage } from './components/Stage'
import { StripEditor } from './components/StripEditor'
import { renderSlices } from './lib/export'
import { bridge, openProject, saveProject, saveSlices } from './lib/files'
import { useStore } from './store'
import { createDefaultPost } from './template'
import type { Post } from './types'

const AUTOSAVE_KEY = 'then-now:current'

export default function App() {
  const post = useStore((s) => s.post)
  const load = useStore((s) => s.load)
  const exportRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const restored = useRef(false)

  const flash = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  // Restore the last open post, then autosave changes (IndexedDB handles large images).
  useEffect(() => {
    get<Post>(AUTOSAVE_KEY)
      .then((p) => p && p.version === 1 && load(p))
      .catch(() => {})
      .finally(() => (restored.current = true))
  }, [load])
  useEffect(() => {
    if (!restored.current) return
    const t = setTimeout(() => set(AUTOSAVE_KEY, post).catch(() => {}), 500)
    return () => clearTimeout(t)
  }, [post])

  const doExport = async () => {
    if (!exportRef.current) return
    if (!post.consent.given && !confirm(`${post.person} isn't marked as having agreed to be posted. Export anyway?`)) return
    setBusy(true)
    try {
      const blobs = await renderSlices(exportRef.current, post)
      const where = await saveSlices(blobs, post)
      if (where) flash(`Exported ${blobs.length} slides → ${where}`)
    } catch (e) {
      flash(`Export failed: ${(e as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  const btn = 'rounded-md border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50'

  return (
    <div className="flex h-screen flex-col bg-white text-zinc-900">
      <header
        className="flex h-12 shrink-0 items-center gap-2 border-b border-zinc-200 bg-zinc-50 pr-3"
        style={{ paddingLeft: bridge() ? 84 : 16, WebkitAppRegion: 'drag' } as CSSProperties}
      >
        <span className="text-sm font-semibold">Then &amp; Now Studio</span>
        <span className="text-sm text-zinc-400">/ {post.person}</span>
        <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${post.consent.given ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
          {post.consent.given ? 'Consent ✓' : 'No consent yet'}
        </span>
        <div className="ml-auto flex gap-2" style={{ WebkitAppRegion: 'no-drag' } as CSSProperties}>
          <button className={btn} onClick={() => confirm('Start a new post? Unsaved changes to this one will be lost.') && load(createDefaultPost(post.aspect))}>New</button>
          <button
            className={btn}
            onClick={async () => {
              try {
                const p = await openProject()
                if (p) load(p)
              } catch (e) {
                flash((e as Error).message)
              }
            }}
          >
            Open…
          </button>
          <button className={btn} onClick={async () => { const p = await saveProject(post); if (p) flash(`Saved → ${p}`) }}>Save…</button>
          <button className="rounded-md bg-zinc-900 px-3 py-1 text-xs font-semibold text-white hover:bg-zinc-700 disabled:opacity-50" disabled={busy} onClick={doExport}>
            {busy ? 'Exporting…' : `Export ${post.slideCount} PNGs`}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <Inspector />
        <main className="min-w-0 flex-1">
          <StripEditor />
        </main>
        <InstagramPreview />
      </div>

      {/* Native-size, chrome-free copy of the strip used for export */}
      <div aria-hidden style={{ position: 'fixed', left: -100000, top: 0, pointerEvents: 'none' }}>
        <Stage ref={exportRef} post={post} />
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white shadow-lg">{toast}</div>
      )}
    </div>
  )
}
