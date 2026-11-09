import { del, get, keys, set } from 'idb-keyval'
import { templateFrom } from '../template'
import { type Post, type PostSummary, summarize } from '../types'
import { bridge, parsePost } from './files'

/**
 * The people library: every post the user has made, autosaved.
 * Electron stores one JSON file per post on disk (see electron/main.ts);
 * the browser-only build falls back to IndexedDB.
 */

const PREFIX = 'then-now:post:'
/** Where the app autosaved its single post before the library existed. */
const LEGACY_KEY = 'then-now:current'

export async function listPosts(): Promise<PostSummary[]> {
  const b = bridge()
  let all: PostSummary[]
  if (b) all = await b.libraryList()
  else {
    const ids = (await keys()).filter((k): k is string => typeof k === 'string' && k.startsWith(PREFIX))
    const posts = await Promise.all(ids.map((k) => get<Post>(k)))
    all = posts.filter((p): p is Post => !!p).map(summarize)
  }
  return all.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
}

export async function readPost(id: string): Promise<Post> {
  const b = bridge()
  if (b) return parsePost(await b.libraryRead(id))
  const p = await get<Post>(PREFIX + id)
  if (!p) throw new Error('Post not found')
  return p
}

export async function writePost(post: Post): Promise<void> {
  const p = { ...post, updatedAt: new Date().toISOString() }
  const b = bridge()
  if (b) await b.libraryWrite(p.id, JSON.stringify(p))
  else await set(PREFIX + p.id, p)
}

export async function deletePost(id: string): Promise<void> {
  const b = bridge()
  if (b) await b.libraryDelete(id)
  else await del(PREFIX + id)
}

const TEMPLATE_KEY = 'then-now:template'

/** The user's saved person template, or null when new people use the built-in default. */
export async function readTemplate(): Promise<Post | null> {
  const b = bridge()
  if (!b) return (await get<Post>(TEMPLATE_KEY)) ?? null
  const json = await b.templateRead()
  return json ? parsePost(json) : null
}

export async function writeTemplate(post: Post): Promise<void> {
  const t = templateFrom(post)
  const b = bridge()
  if (b) await b.templateWrite(JSON.stringify(t))
  else await set(TEMPLATE_KEY, t)
}

export async function deleteTemplate(): Promise<void> {
  const b = bridge()
  if (b) await b.templateDelete()
  else await del(TEMPLATE_KEY)
}

/** Moves the pre-library autosave into the library once, so no work is lost on upgrade. */
export async function migrateLegacyAutosave(): Promise<void> {
  const legacy = await get<Post>(LEGACY_KEY)
  if (!legacy) return
  if (legacy.version === 1) await writePost(legacy)
  await del(LEGACY_KEY)
}
