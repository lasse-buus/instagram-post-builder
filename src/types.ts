export type Aspect = '3:4' | '4:5'

export const SLIDE_W = 1080
export const slideHeight = (a: Aspect) => (a === '3:4' ? 1440 : 1350)

/** Focal point (0–100 %) and zoom (1 = cover) for a photo inside its box. */
export interface Crop {
  x: number
  y: number
  zoom: number
}

interface Base {
  id: string
  x: number
  y: number
  w: number
  h: number
  rotation: number
}

export interface PolaroidEl extends Base {
  type: 'polaroid'
  image?: string
  crop: Crop
  year: string
  subtitle: string
}

export interface TextEl extends Base {
  type: 'text'
  content: string
  fontSize: number
  weight: 400 | 500 | 600 | 700 | 800
  color: string
  align: 'left' | 'center' | 'right'
  font: 'sans' | 'serif' | 'mono'
  lineHeight: number
  /** Renders the text as a chat bubble hugging the left (question) or right (answer) edge of its box. */
  bubble?: Bubble
}

export interface Bubble {
  side: 'left' | 'right'
  color: string
}

export interface ImageEl extends Base {
  type: 'image'
  image?: string
  crop: Crop
  blur: number
  opacity: number
  /** Polaroid whose photo this image mirrors (e.g. slide background). */
  linkedTo?: string
  /** Colour overlay on top of the photo. */
  tint?: Tint
}

export type TintMode = 'normal' | 'multiply' | 'color' | 'screen'
export interface Tint {
  color: string
  strength: number
  mode: TintMode
  grayscale: boolean
}

export interface RectEl extends Base {
  type: 'rect'
  color: string
  radius: number
}

export type El = PolaroidEl | TextEl | ImageEl | RectEl
export type ElType = El['type']

export interface Post {
  version: 1
  id: string
  person: string
  account: string
  aspect: Aspect
  slideCount: number
  /** Fallback colour for slides without their own. */
  background: string
  /** One background colour per slide. */
  slideBackgrounds: string[]
  /** Elements live on the full strip (N × 1080 px wide), not on single slides. */
  elements: El[]
  caption: string
  consent: { given: boolean; date?: string; note?: string }
  status: 'draft' | 'ready' | 'posted'
  /** ISO time of the last library save. */
  updatedAt?: string
}

/** What the people overview needs for one post — `then`/`now` are photo URLs (thumbnails when listed from disk). */
export interface PostSummary {
  id: string
  person: string
  status: Post['status']
  consent: boolean
  updatedAt?: string
  then?: string
  now?: string
}

/** The leftmost polaroid is "then", the rightmost is "now". */
export function summarize(p: Post): PostSummary {
  const pols = p.elements.filter((e): e is PolaroidEl => e.type === 'polaroid').sort((a, b) => a.x - b.x)
  return {
    id: p.id,
    person: p.person,
    status: p.status,
    consent: p.consent.given,
    updatedAt: p.updatedAt,
    then: pols[0]?.image,
    now: pols.length > 1 ? pols[pols.length - 1].image : undefined,
  }
}

/** Polaroid frame geometry derived from its width — keeps the classic proportions. */
export function polaroidLayout(w: number) {
  const pad = Math.round(w * 0.065)
  const photoW = w - pad * 2
  const photoH = Math.round(photoW * 1.1)
  const captionH = Math.round(w * 0.3)
  return { pad, photoW, photoH, captionH, h: pad + photoH + captionH }
}

/** Bold, flat colours that hold up next to old photos. */
export const PALETTE = ['#FFC72C', '#FF6B35', '#F05A7E', '#9B7BD4', '#2E86DE', '#1FB5AD', '#F4F1EA', '#18181B']

export const slideBg = (post: Post, i: number) => post.slideBackgrounds?.[i] ?? post.background

export function elHeight(el: El) {
  return el.type === 'polaroid' ? polaroidLayout(el.w).h : el.h
}
