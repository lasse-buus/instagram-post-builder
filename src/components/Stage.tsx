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
      return <div style={{ position: 'absolute', inset: 0, ...font }}>{el.content}</div>
    }
    case 'rect':
      return <div style={{ position: 'absolute', inset: 0, background: el.color, borderRadius: el.radius }} />
  }
}
