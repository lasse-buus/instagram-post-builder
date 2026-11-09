import { type Aspect, type El, type ImageEl, type Post, SLIDE_W, polaroidLayout, slideHeight } from './types'

export const uid = () => crypto.randomUUID().slice(0, 8)

const text = (o: Partial<Extract<El, { type: 'text' }>> & { x: number; y: number; w: number; content: string }): El => ({
  id: uid(),
  type: 'text',
  h: 200,
  rotation: 0,
  fontSize: 48,
  weight: 500,
  color: '#18181b',
  align: 'left',
  font: 'sans',
  lineHeight: 1.25,
  ...o,
})

/**
 * Default "then → story → now" post: 4 slides.
 * A timeline line runs across every seam so the swipe feels continuous.
 */
export function createDefaultPost(aspect: Aspect = '3:4'): Post {
  const H = slideHeight(aspect)
  const slides = 4
  const lastX = SLIDE_W * (slides - 1)
  const pw = 820
  const ph = polaroidLayout(pw).h
  const py = Math.round((H - ph) / 2) - 40

  const thenId = uid()
  const nowId = uid()

  const elements: El[] = [
    // Background photos first so everything else sits on top of them (slides 1 and 4)
    backgroundFromPolaroid({ id: thenId, x: 0, w: SLIDE_W }, aspect, '#FFC72C'),
    backgroundFromPolaroid({ id: nowId, x: lastX, w: SLIDE_W }, aspect, '#1FB5AD'),
    { id: thenId, type: 'polaroid', x: (SLIDE_W - pw) / 2, y: py, w: pw, h: ph, rotation: 0, crop: { x: 50, y: 35, zoom: 1 }, year: '2007', subtitle: 'Then' },

    // Timeline across all seams
    { id: uid(), type: 'rect', x: SLIDE_W / 2, y: H - 120, w: lastX, h: 6, rotation: 0, color: '#18181b', radius: 3 },
    { id: uid(), type: 'rect', x: SLIDE_W / 2 - 14, y: H - 131, w: 28, h: 28, rotation: 0, color: '#18181b', radius: 14 },
    { id: uid(), type: 'rect', x: lastX + SLIDE_W / 2 - 14, y: H - 131, w: 28, h: 28, rotation: 0, color: '#18181b', radius: 14 },

    // Slide 2 — who they were, as a chat
    text({ x: SLIDE_W + 110, y: 220, w: 860, content: 'Name Surname', fontSize: 96, weight: 700, lineHeight: 1.05 }),
    text({ x: SLIDE_W + 110, y: 380, w: 860, h: 120, content: 'CLASS OF 2007', fontSize: 34, weight: 600, color: '#71717a', font: 'mono' }),
    chatBubble(1, 520, 'left', 'Who was I?'),
    chatBubble(1, 680, 'right', 'Back in 2007 I was… the hobbies, the jokes, the dream job.', 380),

    // Slide 3 — what happened next, as a chat
    text({ x: SLIDE_W * 2 + 110, y: 180, w: 860, h: 120, content: '20 years later', fontSize: 96, weight: 700, lineHeight: 1.05 }),
    chatBubble(2, 340, 'left', 'Who am I now?'),
    chatBubble(2, 480, 'right', 'Today I live in… and work with…', 260),
    chatBubble(2, 780, 'left', 'Who do I have contact with?'),
    chatBubble(2, 920, 'right', 'I still keep in touch with…', 240),

    // Slide 4 — now
    { id: nowId, type: 'polaroid', x: lastX + (SLIDE_W - pw) / 2, y: py, w: pw, h: ph, rotation: 0, crop: { x: 50, y: 35, zoom: 1 }, year: '2027', subtitle: 'Now' },
  ]

  return {
    version: 1,
    id: uid(),
    person: 'New person',
    account: 'ourschool.20years',
    aspect,
    slideCount: slides,
    background: '#F4F1EA',
    slideBackgrounds: ['#FFC72C', '#F4F1EA', '#F4F1EA', '#1FB5AD'],
    elements,
    caption: '',
    consent: { given: false },
    status: 'draft',
  }
}

/**
 * A post reduced to its reusable layout: no photos, name, consent or status.
 * Photos are stripped from every image too, so a template never carries a real person's pictures.
 */
export function templateFrom(post: Post): Post {
  return {
    ...post,
    id: 'template',
    person: 'New person',
    consent: { given: false },
    status: 'draft',
    updatedAt: undefined,
    elements: post.elements.map((e) => (e.type === 'polaroid' || e.type === 'image' ? { ...e, image: undefined } : e)),
  }
}

/** A fresh post for a new person, laid out like the template. */
export const postFromTemplate = (template: Post): Post => ({ ...template, id: uid() })

export function newElement(type: El['type'], slide: number, aspect: Aspect): El {
  const H = slideHeight(aspect)
  const ox = slide * SLIDE_W
  switch (type) {
    case 'polaroid': {
      const w = 640
      const { h } = polaroidLayout(w)
      return { id: uid(), type, x: ox + (SLIDE_W - w) / 2, y: (H - h) / 2, w, h, rotation: -3, crop: { x: 50, y: 40, zoom: 1 }, year: '2007', subtitle: '' }
    }
    case 'text':
      return text({ x: ox + 110, y: H / 2 - 100, w: 860, content: 'New text', fontSize: 64, weight: 600 })
    case 'image':
      return { id: uid(), type, x: ox + 140, y: H / 2 - 400, w: 800, h: 800, rotation: 0, crop: { x: 50, y: 50, zoom: 1 }, blur: 0, opacity: 1 }
    case 'rect':
      return { id: uid(), type, x: ox + 140, y: H / 2 - 3, w: 800, h: 6, rotation: 0, color: '#18181b', radius: 3 }
  }
}

/** Full-slide copy of a polaroid's photo, placed behind everything on that slide. */
export function backgroundFromPolaroid(p: { id: string; x: number; w: number; image?: string }, aspect: Aspect, color = '#FFC72C'): ImageEl {
  const slide = Math.floor((p.x + p.w / 2) / SLIDE_W)
  return {
    id: uid(), type: 'image', x: slide * SLIDE_W, y: 0, w: SLIDE_W, h: slideHeight(aspect), rotation: 0,
    crop: { x: 50, y: 40, zoom: 1.15 }, blur: 0, opacity: 1, image: p.image, linkedTo: p.id,
    tint: { color, strength: 0.85, mode: 'multiply', grayscale: true },
  }
}

/** Chat bubble: 'left' = question (white), 'right' = answer (blue). Box is 760 wide, hugging that side of the slide. */
export function chatBubble(slide: number, y: number, side: 'left' | 'right', content: string, h = 130): El {
  const left = side === 'left'
  return text({
    x: slide * SLIDE_W + (left ? 110 : 210),
    y,
    w: 760,
    h,
    content,
    fontSize: 44,
    weight: left ? 600 : 400,
    lineHeight: 1.3,
    color: left ? '#18181b' : '#ffffff',
    bubble: { side, color: left ? '#ffffff' : '#2E86DE' },
  })
}

export function circle(slide: number, aspect: Aspect, color: string): El {
  const d = 820
  return { id: uid(), type: 'rect', x: slide * SLIDE_W + (SLIDE_W - d) / 2, y: (slideHeight(aspect) - d) / 2, w: d, h: d, rotation: 0, color, radius: d / 2 }
}
