import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { InstagramPreview, ProfilePreview } from './components/InstagramPreview'
import { Inspector } from './components/Inspector'
import { Library } from './components/Library'
import { Stage } from './components/Stage'
import { StripEditor } from './components/StripEditor'
import { renderSlices } from './lib/export'
import { bridge, saveProject, saveSlices } from './lib/files'
import { migrateLegacyAutosave, readProfile, readTemplate, writePost, writeProfile, writeTemplate } from './lib/library'
import { useStore } from './store'
import { createDefaultPost, createProfile, postFromTemplate } from './template'
import type { Post } from './types'

export default function App() {
  const post = useStore((s) => s.post)
  const load = useStore((s) => s.load)
  const exportRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  /** null until the old single-post autosave has been moved into the library. 'person' / 'profile' are the editor. */
  const [view, setView] = useState<'library' | 'person' | 'profile' | null>(null)
  /** The post as last written to (or read from) storage — anything else is unsaved. */
  const saved = useRef<Post | null>(null)
  /** The account profile photo design, once made. */
  const [profile, setProfile] = useState<Post | null>(null)

  const flash = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }, [])

  useEffect(() => {
    migrateLegacyAutosave()
      .catch((e) => flash(`Couldn't move the previous autosave into the library: ${(e as Error).message}`))
      .finally(() => setView('library'))
    readProfile()
      .then(setProfile)
      .catch((e) => flash(`Couldn't read the account profile: ${(e as Error).message}`))
  }, [flash])

  const persist = useCallback(
    async (p: Post, kind: 'person' | 'profile') => {
      saved.current = p
      try {
        if (kind === 'profile') {
          await writeProfile(p)
          setProfile(p)
        } else await writePost(p)
      } catch (e) {
        flash(`Autosave failed: ${(e as Error).message}`)
      }
    },
    [flash],
  )

  // Autosave edits (debounced) to wherever the open post lives. Skips the post exactly as it was opened.
  useEffect(() => {
    if ((view !== 'person' && view !== 'profile') || post === saved.current) return
    const t = setTimeout(() => persist(post, view), 500)
    return () => clearTimeout(t)
  }, [post, view, persist])

  const openPost = (p: Post, kind: 'person' | 'profile' = 'person') => {
    load(p)
    saved.current = useStore.getState().post
    setView(kind)
  }

  const openProfile = async () => {
    if (profile) return openPost(profile, 'profile')
    const p = createProfile()
    await persist(p, 'profile')
    openPost(p, 'profile')
  }

  const newPost = async () => {
    let template: Post | null = null
    try {
      template = await readTemplate()
    } catch (e) {
      flash(`Couldn't read your template, using the default: ${(e as Error).message}`)
    }
    const base = template ? postFromTemplate(template) : createDefaultPost()
    const p = profile ? { ...base, account: profile.account } : base
    await persist(p, 'person')
    openPost(p)
  }

  const saveTemplate = async () => {
    if (!confirm('Start every new person from this layout? Photos, name, consent and status are left out.')) return
    try {
      await writeTemplate(post)
      flash('Saved as template — new people start from this layout')
    } catch (e) {
      flash(`Couldn't save template: ${(e as Error).message}`)
    }
  }

  const backToLibrary = async () => {
    if ((view === 'person' || view === 'profile') && post !== saved.current) await persist(post, view)
    setView('library')
  }

  const doExport = async () => {
    if (!exportRef.current) return
    if (view === 'person' && !post.consent.given && !confirm(`${post.person} isn't marked as having agreed to be posted. Export anyway?`)) return
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
        {view === 'person' || view === 'profile' ? (
          <>
            <button className={btn} style={{ WebkitAppRegion: 'no-drag' } as CSSProperties} onClick={backToLibrary}>← All people</button>
            <span className="ml-1 text-sm font-semibold">{view === 'profile' ? `Profile photo · ${post.account}` : post.person}</span>
            {view === 'person' && (
              <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${post.consent.given ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {post.consent.given ? 'Consent ✓' : 'No consent yet'}
              </span>
            )}
            <div className="ml-auto flex gap-2" style={{ WebkitAppRegion: 'no-drag' } as CSSProperties}>
              {view === 'person' && (
                <>
                  <button className={btn} onClick={saveTemplate}>Save as template</button>
                  <button className={btn} onClick={async () => { const p = await saveProject(post); if (p) flash(`Saved → ${p}`) }}>Save as file…</button>
                </>
              )}
              <button className="rounded-md bg-zinc-900 px-3 py-1 text-xs font-semibold text-white hover:bg-zinc-700 disabled:opacity-50" disabled={busy} onClick={doExport}>
                {busy ? 'Exporting…' : view === 'profile' ? 'Export PNG' : `Export ${post.slideCount} PNGs`}
              </button>
            </div>
          </>
        ) : (
          <span className="text-sm font-semibold">Then &amp; Now Studio</span>
        )}
      </header>

      {view === 'library' && <Library onOpen={openPost} onNew={newPost} onOpenProfile={openProfile} profile={profile} flash={flash} />}

      {(view === 'person' || view === 'profile') && (
        <>
          <div className="flex min-h-0 flex-1">
            <Inspector profile={view === 'profile'} />
            <main className="min-w-0 flex-1">
              <StripEditor />
            </main>
            {view === 'profile' ? <ProfilePreview /> : <InstagramPreview avatar={profile} />}
          </div>

          {/* Native-size, chrome-free copy of the strip used for export */}
          <div aria-hidden style={{ position: 'fixed', left: -100000, top: 0, pointerEvents: 'none' }}>
            <Stage ref={exportRef} post={post} />
          </div>
        </>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white shadow-lg">{toast}</div>
      )}
    </div>
  )
}
