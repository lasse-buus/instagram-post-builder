import { create } from 'zustand'
import { backgroundFromPolaroid, createDefaultPost, uid } from './template'
import { type El, type Post, SLIDE_W } from './types'

interface State {
  post: Post
  selectedId: string | null
  select: (id: string | null) => void
  setPost: (patch: Partial<Post>) => void
  load: (post: Post) => void
  updateEl: (id: string, patch: Partial<El>) => void
  /** Sets a polaroid/image photo and mirrors it to linked background images. */
  setImage: (id: string, dataUrl: string) => void
  addEl: (el: El) => void
  removeEl: (id: string) => void
  duplicateEl: (id: string) => void
  reorderEl: (id: string, dir: 'up' | 'down') => void
  setSlideCount: (n: number) => void
  setSlideBg: (i: number | 'all', color: string) => void
  /** Adds the polaroid's photo as a blurred full-slide background (behind everything). */
  addPhotoBackground: (polaroidId: string) => void
}

/** Older files may lack per-slide colours — fill them from the fallback. */
const normalize = (p: Post): Post => ({
  ...p,
  slideBackgrounds: Array.from({ length: p.slideCount }, (_, i) => p.slideBackgrounds?.[i] ?? p.background),
})

export const useStore = create<State>((set, get) => ({
  post: createDefaultPost(),
  selectedId: null,

  select: (id) => set({ selectedId: id }),
  setPost: (patch) => set((s) => ({ post: { ...s.post, ...patch } })),
  load: (post) => set({ post: normalize(post), selectedId: null }),

  updateEl: (id, patch) =>
    set((s) => ({
      post: { ...s.post, elements: s.post.elements.map((e) => (e.id === id ? ({ ...e, ...patch } as El) : e)) },
    })),

  setImage: (id, dataUrl) =>
    set((s) => ({
      post: {
        ...s.post,
        elements: s.post.elements.map((e) =>
          (e.id === id || (e.type === 'image' && e.linkedTo === id)) && (e.type === 'polaroid' || e.type === 'image')
            ? { ...e, image: dataUrl }
            : e,
        ),
      },
    })),

  addEl: (el) => set((s) => ({ post: { ...s.post, elements: [...s.post.elements, el] }, selectedId: el.id })),

  removeEl: (id) =>
    set((s) => ({
      post: { ...s.post, elements: s.post.elements.filter((e) => e.id !== id) },
      selectedId: s.selectedId === id ? null : s.selectedId,
    })),

  duplicateEl: (id) => {
    const el = get().post.elements.find((e) => e.id === id)
    if (!el) return
    get().addEl({ ...el, id: uid(), x: el.x + 40, y: el.y + 40 } as El)
  },

  reorderEl: (id, dir) =>
    set((s) => {
      const els = [...s.post.elements]
      const i = els.findIndex((e) => e.id === id)
      const j = dir === 'up' ? i + 1 : i - 1
      if (i < 0 || j < 0 || j >= els.length) return s
      ;[els[i], els[j]] = [els[j], els[i]]
      return { post: { ...s.post, elements: els } }
    }),

  setSlideCount: (n) =>
    set((s) => {
      const slideCount = Math.max(2, Math.min(20, n))
      // Keep elements that still start inside the strip.
      const elements = s.post.elements.filter((e) => e.x < slideCount * SLIDE_W)
      const slideBackgrounds = Array.from({ length: slideCount }, (_, i) => s.post.slideBackgrounds[i] ?? s.post.slideBackgrounds.at(-1) ?? s.post.background)
      return { post: { ...s.post, slideCount, elements, slideBackgrounds } }
    }),

  // The slide colour also drives the overlay on that slide's background photo.
  setSlideBg: (i, color) =>
    set((s) => ({
      post: {
        ...s.post,
        slideBackgrounds: i === 'all' ? s.post.slideBackgrounds.map(() => color) : s.post.slideBackgrounds.map((c, n) => (n === i ? color : c)),
        elements: s.post.elements.map((e) =>
          e.type === 'image' && e.linkedTo && e.tint && (i === 'all' || Math.floor((e.x + e.w / 2) / SLIDE_W) === i)
            ? { ...e, tint: { ...e.tint, color } }
            : e,
        ),
      },
    })),

  addPhotoBackground: (polaroidId) => {
    const p = get().post.elements.find((e) => e.id === polaroidId)
    if (!p || p.type !== 'polaroid') return
    const { post } = get()
    const slide = Math.max(0, Math.min(post.slideCount - 1, Math.floor((p.x + p.w / 2) / SLIDE_W)))
    const bg = backgroundFromPolaroid(p, post.aspect, post.slideBackgrounds[slide])
    set((s) => ({ post: { ...s.post, elements: [bg, ...s.post.elements] }, selectedId: bg.id }))
  },
}))
