import { useEffect, useState } from 'react'
import { bridge, openProject } from '../lib/files'
import { deletePost, deleteTemplate, listPosts, readPost, readTemplate, writePost } from '../lib/library'
import type { Post, PostSummary } from '../types'

const STATUS_STYLE: Record<Post['status'], string> = {
  draft: 'bg-zinc-100 text-zinc-600',
  ready: 'bg-sky-100 text-sky-700',
  posted: 'bg-emerald-100 text-emerald-700',
}

const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—')

function Thumb({ src, label }: { src?: string; label: string }) {
  return (
    <div className="relative flex-1 overflow-hidden bg-zinc-200">
      {src && <img src={src} alt="" className="h-full w-full object-cover" />}
      <span className="absolute bottom-1.5 left-1.5 rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-700">{label}</span>
    </div>
  )
}

/** Overview of every person in the library. Opening, creating and importing hand a post to the editor. */
export function Library({ onOpen, onNew, flash }: { onOpen: (post: Post) => void; onNew: () => void; flash: (msg: string) => void }) {
  const [people, setPeople] = useState<PostSummary[] | null>(null)

  const refresh = () =>
    listPosts()
      .then(setPeople)
      .catch((e) => {
        setPeople([])
        flash(`Couldn't read the library: ${(e as Error).message}`)
      })
  const [hasTemplate, setHasTemplate] = useState(false)
  useEffect(() => {
    refresh()
    readTemplate()
      .then((t) => setHasTemplate(!!t))
      .catch(() => {})
  }, [])

  const resetTemplate = async () => {
    if (!confirm('Remove your template? New people will start from the built-in default layout again.')) return
    try {
      await deleteTemplate()
      setHasTemplate(false)
    } catch (e) {
      flash(`Couldn't remove template: ${(e as Error).message}`)
    }
  }

  const open = async (id: string) => {
    try {
      onOpen(await readPost(id))
    } catch (e) {
      flash(`Couldn't open: ${(e as Error).message}`)
    }
  }

  const remove = async (p: PostSummary) => {
    const where = bridge() ? 'It moves to the Trash.' : 'This cannot be undone.'
    if (!confirm(`Delete ${p.person}? ${where}`)) return
    try {
      await deletePost(p.id)
      await refresh()
    } catch (e) {
      flash(`Couldn't delete: ${(e as Error).message}`)
    }
  }

  const importFile = async () => {
    try {
      const post = await openProject()
      if (!post) return
      const existing = people?.find((p) => p.id === post.id)
      if (existing && !confirm(`This file is ${existing.person}, who is already in your library. Replace that version?`)) return
      await writePost(post)
      onOpen(post)
    } catch (e) {
      flash((e as Error).message)
    }
  }

  const count = (s: Post['status']) => people?.filter((p) => p.status === s).length ?? 0
  const btn = 'rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50'

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-zinc-50">
      <div className="mx-auto max-w-6xl px-8 py-8">
        <div className="mb-6 flex flex-wrap items-end gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">People</h1>
            {people && people.length > 0 && (
              <p className="mt-1 text-sm text-zinc-500">
                {people.length} {people.length === 1 ? 'person' : 'people'} · {count('draft')} draft · {count('ready')} ready · {count('posted')} posted
              </p>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="mr-2 text-xs text-zinc-500">
              {hasTemplate ? (
                <>
                  New people use your template ·{' '}
                  <button className="underline hover:text-zinc-800" onClick={resetTemplate}>Use default</button>
                </>
              ) : (
                'New people use the default layout — open one and “Save as template” to change it'
              )}
            </span>
            <button className={btn} onClick={importFile}>Import file…</button>
            <button className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700" onClick={onNew}>New person</button>
          </div>
        </div>

        {people === null ? (
          <p className="text-sm text-zinc-400">Loading…</p>
        ) : people.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 px-6 py-16 text-center">
            <p className="text-sm text-zinc-600">No people yet.</p>
            <button className="mt-4 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700" onClick={onNew}>Create the first one</button>
          </div>
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
            {people.map((p) => (
              <li key={p.id} className="group relative">
                <button
                  onClick={() => open(p.id)}
                  className="block w-full overflow-hidden rounded-xl border border-zinc-200 bg-white text-left shadow-sm transition hover:border-zinc-400 hover:shadow-md focus-visible:outline-2 focus-visible:outline-zinc-900"
                >
                  <div className="flex aspect-[2/1] gap-px">
                    <Thumb src={p.then} label="Then" />
                    <Thumb src={p.now} label="Now" />
                  </div>
                  <div className="space-y-2 px-3 py-3">
                    <div className="truncate text-sm font-semibold">{p.person}</div>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className={`rounded-full px-2 py-0.5 font-semibold capitalize ${STATUS_STYLE[p.status]}`}>{p.status}</span>
                      <span className={`rounded-full px-2 py-0.5 font-semibold ${p.consent ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {p.consent ? 'Consent ✓' : 'No consent'}
                      </span>
                      <span className="ml-auto text-zinc-400">{fmtDate(p.updatedAt)}</span>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => remove(p)}
                  aria-label={`Delete ${p.person}`}
                  className="absolute right-2 top-2 rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-medium text-red-600 opacity-0 shadow-sm transition group-hover:opacity-100 focus-visible:opacity-100"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
