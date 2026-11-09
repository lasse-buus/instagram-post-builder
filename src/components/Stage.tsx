import { forwardRef, type DragEvent, type PointerEvent } from 'react'
import { type Crop, type El, type Post, SLIDE_W, elHeight, polaroidLayout, slideBg, slideHeight } from '../types'

export const FONTS = {
  sans: "-apple-system, 'SF Pro Text', 'Helvetica Neue', Inter, Arial, sans-serif",
  serif: "'New York', Georgia, 'Times New Roman', serif",
  mono: "'SF Mono', Menlo, Consolas, monospace",
}

export type DragMode = 'move' | 'resize'

interface Props {
  post: Post
  interactive?: boolean
  /** Current editor scale — keeps selection chrome a constant on-screen size. */
  scale?: number
  selectedId?: string | null
  onElPointerDown?: (e: PointerEvent, el: El, mode: DragMode) => void
  onBackgroundPointerDown?: () => void
  onDropImage?: (el: El, file: File) => void
}

/** The strip at native pixel size. Used for editing, preview and export. */
export const Stage = forwardRef<HTMLDivElement, Props>(function Stage(
  { post, interactive, scale = 1, selectedId, onElPointerDown, onBackgroundPointerDown, onDropImage },
  ref,
) {
  const H = slideHeight(post.aspect)
  const W = SLIDE_W * post.slideCount
  const px = 1 / scale

  return (
    <div
      ref={ref}
      onPointerDown={interactive ? onBackgroundPointerDown : undefined}
      style={{ width: W, height: H, background: post.background, position: 'relative', overflow: 'hidden', fontFamily: FONTS.sans }}
    >
      {Array.from({ length: post.slideCount }, (_, i) => (
        <div key={`bg${i}`} style={{ position: 'absolute', left: i * SLIDE_W, top: 0, width: SLIDE_W, height: H, background: slideBg(post, i) }} />
      ))}
      {post.elements.map((el) => {
        const selected = interactive && selectedId === el.id
        const canDrop = el.type === 'polaroid' || el.type === 'image'
        return (
          <div
            key={el.id}
            data-el={el.id}
            onPointerDown={interactive ? (e) => onElPointerDown?.(e, el, 'move') : undefined}
            onDragOver={interactive && canDrop ? (e) => e.preventDefault() : undefined}
            onDrop={
              interactive && canDrop
                ? (e: DragEvent) => {
                    e.preventDefault()
                    const f = e.dataTransfer.files[0]
                    if (f?.type.startsWith('image/')) onDropImage?.(el, f)
                  }
                : undefined
            }
            style={{
              position: 'absolute',
              left: el.x,
              top: el.y,
              width: el.w,
              height: elHeight(el),
              transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
              cursor: interactive ? 'move' : undefined,
            }}
          >
            <ElementContent el={el} interactive={interactive} />
            {selected && (
              <>
                <div style={{ position: 'absolute', inset: -2 * px, outline: `${2 * px}px solid #3b82f6`, pointerEvents: 'none' }} />
                <div
                  onPointerDown={(e) => onElPointerDown?.(e, el, 'resize')}
                  style={{
                    position: 'absolute',
                    right: -7 * px,
                    bottom: -7 * px,
                    width: 14 * px,
                    height: 14 * px,
                    background: '#fff',
                    border: `${2 * px}px solid #3b82f6`,
                    borderRadius: 3 * px,
                    cursor: 'nwse-resize',
                  }}
                />
              </>
            )}
          </div>
        )
      })}
    </div>
  )
})

function Photo({ src, crop, blur = 0, grayscale, placeholder, interactive }: { src?: string; crop: Crop; blur?: number; grayscale?: boolean; placeholder: string; interactive?: boolean }) {
  if (!src) {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: '#e4e4e7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#71717a',
          fontSize: 36,
          textAlign: 'center',
          padding: 40,
        }}
      >
        {interactive ? placeholder : ''}
      </div>
    )
  }
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <img
        src={src}
        alt=""
        draggable={false}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: `${crop.x}% ${crop.y}%`,
          transform: `scale(${crop.zoom * (blur ? 1.08 : 1)})`,
          transformOrigin: `${crop.x}% ${crop.y}%`,
          filter: [blur ? `blur(${blur}px)` : '', grayscale ? 'grayscale(1) contrast(1.1)' : ''].join(' ').trim() || undefined,
          display: 'block',
        }}
      />
    </div>
  )
}

/** Magazine cut-out looks, cycled per letter so neighbours never match. */
const CUTOUTS = [
  { background: '#F7C8D8', color: '#B0174E', font: 'serif', weight: 700, italic: false },
  { background: '#1d1d1b', color: '#F7E36B', font: 'mono', weight: 700, italic: false },
  { background: '#F7E36B', color: '#D21F5B', font: 'sans', weight: 800, italic: false },
  { background: '#ffffff', color: '#2B6CB0', font: 'serif', weight: 600, italic: true },
  { background: '#E8590C', color: '#ffffff', font: 'sans', weight: 800, italic: false },
  { background: '#8FD3C1', color: '#3B2A6B', font: 'serif', weight: 700, italic: false },
] as const
const TILTS = [-6, 4, -3, 7, -5, 3, -2]
/** Letter values printed in the corner of each tile. */
const TILE_POINTS: Record<string, number> = Object.fromEntries(
  Object.entries({ 1: 'AEILNORSTU', 2: 'DG', 3: 'BCMP', 4: 'FHVWY', 5: 'K', 8: 'JX', 10: 'QZ' }).flatMap(([pts, ls]) => [...ls].map((l) => [l, +pts])),
)

/** Text drawn letter by letter: cut-out or tile styling, optionally bent along an arc. */
function Letters({ el }: { el: Extract<El, { type: 'text' }> }) {
  const size = el.fontSize
  const arc = ((el.arc ?? 0) * Math.PI) / 180
  // Circle that spans the element's width over the arc angle.
  const radius = arc ? el.w / 2 / Math.sin(Math.abs(arc) / 2) : 0
  const justify = el.align === 'left' ? 'flex-start' : el.align === 'right' ? 'flex-end' : 'center'

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', gap: size * 0.25, lineHeight: 1 }}>
      {el.content.split('\n').map((line, row) => {
        const chars = [...line]
        return (
          <div key={row} style={{ display: 'flex', justifyContent: justify, alignItems: 'center', gap: el.effect === 'tiles' ? size * 0.16 : size * 0.04 }}>
            {chars.map((ch, i) => {
              const a = arc * ((i + 0.5) / chars.length - 0.5)
              const bend = arc ? `translateY(${Math.sign(arc) * radius * (1 - Math.cos(a))}px) rotate(${(a * 180) / Math.PI}deg)` : ''
              if (ch === ' ') return <span key={i} style={{ width: size * 0.35, flexShrink: 0 }} />

              if (el.effect === 'tiles') {
                const pts = TILE_POINTS[ch.toUpperCase()]
                return (
                  <span
                    key={i}
                    style={{
                      position: 'relative',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      width: size * 1.15,
                      height: size * 1.2,
                      background: 'linear-gradient(160deg, #F1DEB5, #DDBF8A)',
                      borderRadius: size * 0.08,
                      boxShadow: `0 ${size * 0.05}px ${size * 0.1}px rgba(0,0,0,0.35), inset 0 -${size * 0.04}px 0 rgba(0,0,0,0.12)`,
                      fontFamily: FONTS.sans,
                      fontSize: size * 0.82,
                      fontWeight: 500,
                      color: '#1c1917',
                      transform: bend || undefined,
                    }}
                  >
                    {ch.toUpperCase()}
                    {pts && <span style={{ position: 'absolute', right: size * 0.1, bottom: size * 0.08, fontSize: size * 0.24 }}>{pts}</span>}
                  </span>
                )
              }

              if (el.effect === 'cutout') {
                const look = CUTOUTS[(i * 4 + ch.charCodeAt(0)) % CUTOUTS.length]
                const tilt = TILTS[(i + row * 3) % TILTS.length]
                return (
                  <span
                    key={i}
                    style={{
                      display: 'inline-block',
                      flexShrink: 0,
                      padding: `${size * 0.06}px ${size * 0.1}px`,
                      background: look.background,
                      color: look.color,
                      fontFamily: FONTS[look.font],
                      fontWeight: look.weight,
                      fontStyle: look.italic ? 'italic' : undefined,
                      fontSize: size * (i % 3 === 1 ? 1.08 : 0.95),
                      boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                      transform: `${bend} rotate(${tilt}deg)`,
                    }}
                  >
                    {i % 2 ? ch.toLowerCase() : ch.toUpperCase()}
                  </span>
                )
              }

              return (
                <span key={i} style={{ display: 'inline-block', fontFamily: FONTS[el.font], fontSize: size, fontWeight: el.weight, color: el.color, transform: bend || undefined }}>
                  {ch}
                </span>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

/** The account profile photo as a circle, the way Instagram crops it. */
export function Avatar({ post, size }: { post: Post; size: number }) {
  return (
    <div className="shrink-0 overflow-hidden rounded-full" style={{ width: size, height: size }}>
      <div style={{ transform: `scale(${size / SLIDE_W})`, transformOrigin: '0 0', width: SLIDE_W, height: SLIDE_W }}>
        <Stage post={post} />
      </div>
    </div>
  )
}

function ElementContent({ el, interactive }: { el: El; interactive?: boolean }) {
  switch (el.type) {
    case 'polaroid': {
      const { pad, photoH, captionH } = polaroidLayout(el.w)
      return (
        <div style={{ position: 'absolute', inset: 0, background: '#fff', boxShadow: '0 24px 60px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.12)' }}>
          <div style={{ position: 'absolute', left: pad, right: pad, top: pad, height: photoH }}>
            <Photo src={el.image} crop={el.crop} placeholder="Drop the photo here" interactive={interactive} />
          </div>
          <div style={{ position: 'absolute', left: pad, right: pad, top: pad + photoH, height: captionH, paddingTop: el.w * 0.06 }}>
            <div style={{ fontSize: el.w * 0.085, lineHeight: 1.1, color: '#18181b', fontWeight: 400, letterSpacing: '-0.01em' }}>{el.year}</div>
            {el.subtitle && <div style={{ fontSize: el.w * 0.042, color: '#6b7280', marginTop: el.w * 0.022 }}>{el.subtitle}</div>}
          </div>
        </div>
      )
    }
    case 'image':
      return (
        <div style={{ position: 'absolute', inset: 0, opacity: el.opacity }}>
          <Photo src={el.image} crop={el.crop} blur={el.blur} grayscale={el.tint?.grayscale} placeholder={el.linkedTo ? 'Background — follows the polaroid photo' : 'Drop an image here'} interactive={interactive} />
          {el.tint && el.tint.strength > 0 && (
            <div style={{ position: 'absolute', inset: 0, background: el.tint.color, opacity: el.tint.strength, mixBlendMode: el.tint.mode }} />
          )}
        </div>
      )
    case 'text': {
      const font = {
        fontFamily: FONTS[el.font],
        fontSize: el.fontSize,
        fontWeight: el.weight,
        color: el.color,
        textAlign: el.align,
        lineHeight: el.lineHeight,
        whiteSpace: 'pre-wrap',
        letterSpacing: el.font === 'mono' ? '0.08em' : '-0.01em',
      } as const
      if (el.bubble) {
        // Bubble hugs its text inside the element box; the corner nearest the speaker stays sharp like a chat tail.
        const r = el.fontSize
        const tail = el.fontSize * 0.2
        const left = el.bubble.side === 'left'
        return (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-start', justifyContent: left ? 'flex-start' : 'flex-end' }}>
            <div
              style={{
                ...font,
                maxWidth: '100%',
                background: el.bubble.color,
                padding: `${el.fontSize * 0.55}px ${el.fontSize * 0.8}px`,
                borderRadius: left ? `${r}px ${r}px ${r}px ${tail}px` : `${r}px ${r}px ${tail}px ${r}px`,
                boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
              }}
            >
              {el.content}
            </div>
          </div>
        )
      }
      if (el.effect || el.arc) return <Letters el={el} />
      return <div style={{ position: 'absolute', inset: 0, ...font }}>{el.content}</div>
    }
    case 'rect':
      return <div style={{ position: 'absolute', inset: 0, background: el.color, borderRadius: el.radius }} />
  }
}
