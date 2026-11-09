import type { Post, PostSummary } from '../types'

interface StudioBridge {
  isElectron: true
  exportSlices: (files: { name: string; data: ArrayBuffer }[], suggested: string) => Promise<string | null>
  saveProject: (json: string, suggested: string) => Promise<string | null>
  openProject: () => Promise<string | null>
  libraryList: () => Promise<PostSummary[]>
  libraryRead: (id: string) => Promise<string>
  libraryWrite: (id: string, json: string) => Promise<void>
  libraryDelete: (id: string) => Promise<void>
  templateRead: () => Promise<string | null>
  templateWrite: (json: string) => Promise<void>
  templateDelete: () => Promise<void>
}

export function parsePost(json: string): Post {
  const post = JSON.parse(json) as Post
  if (post.version !== 1 || !Array.isArray(post.elements)) throw new Error('Not a carousel post file')
  return post
}

declare global {
  interface Window {
    studio?: StudioBridge
  }
}

export const bridge = () => window.studio

export const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-') || 'post'

/** Reads an image file and downscales it so posts stay light (max 2400 px long side). */
export async function readImage(file: File, maxSide = 2400): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight))
    const c = document.createElement('canvas')
    c.width = Math.round(img.naturalWidth * scale)
    c.height = Math.round(img.naturalHeight * scale)
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
    return c.toDataURL('image/jpeg', 0.92)
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function pickFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.onchange = () => resolve(input.files?.[0] ?? null)
    input.click()
  })
}

function download(blob: Blob, name: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}

export async function saveProject(post: Post) {
  const json = JSON.stringify(post)
  const name = slug(post.person)
  const b = bridge()
  if (b) return b.saveProject(json, name)
  download(new Blob([json], { type: 'application/json' }), `${name}.carousel.json`)
  return `${name}.carousel.json`
}

export async function openProject(): Promise<Post | null> {
  const b = bridge()
  let json: string | null
  if (b) json = await b.openProject()
  else {
    const f = await pickFile('.json,application/json')
    json = f ? await f.text() : null
  }
  return json ? parsePost(json) : null
}

export async function saveSlices(blobs: Blob[], post: Post) {
  const base = slug(post.person)
  const files = blobs.map((b, i) => ({ blob: b, name: `${base}-${String(i + 1).padStart(2, '0')}.png` }))
  const b = bridge()
  if (b) {
    return b.exportSlices(
      await Promise.all(files.map(async (f) => ({ name: f.name, data: await f.blob.arrayBuffer() }))),
      base,
    )
  }
  for (const f of files) download(f.blob, f.name)
  return 'Downloads'
}
