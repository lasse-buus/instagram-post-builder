import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react'
import { readImage } from '../lib/files'
import { useStore } from '../store'
import { type El, SLIDE_W, elHeight, slideHeight } from '../types'
import { Stage, type DragMode } from './Stage'

const SAFE = 60 // keep text this far from seams / edges
const SNAP = 12

export function StripEditor() {
  const { post, selectedId, select, updateEl, setImage } = useStore()
  const H = slideHeight(post.aspect)
  const W = SLIDE_W * post.slideCount
  const wrap = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState(0.3)
  const [zoom, setZoom] = useState(1)
  const [guides, setGuides] = useState(true)
  const scale = fit * zoom

  useLayoutEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(() => setFit(Math.max(0.1, (el.clientHeight - 72) / H)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [H])

  // Snap targets: seams, slide centres and safe-zone lines.
  const xTargets: number[] = []
  for (let i = 0; i <= post.slideCount; i++) {
    xTargets.push(i * SLIDE_W)
    if (i < post.slideCount) xTargets.push(i * SLIDE_W + SLIDE_W / 2, i * SLIDE_W + SAFE, (i + 1) * SLIDE_W - SAFE)
  }
  const yTargets = [0, H / 2, H, SAFE, H - SAFE]

  const snap = (v: number, size: number, targets: number[]) => {
    for (const t of targets) {
      for (const off of [0, size / 2, size]) if (Math.abs(v + off - t) < SNAP / Math.max(scale, 0.2)) return t - off
    }
    return v
  }

  const onElPointerDown = (e: PointerEvent, el: El, mode: DragMode) => {
    e.stopPropagation()
    if (e.button !== 0) return
    select(el.id)
    const start = { px: e.clientX, py: e.clientY, x: el.x, y: el.y, w: el.w, h: el.h }
    const h0 = elHeight(el)
    const move = (ev: globalThis.PointerEvent) => {
      const dx = (ev.clientX - start.px) / scale
      const dy = (ev.clientY - start.py) / scale
      if (mode === 'move') {
        const free = ev.altKey
        const x = Math.round(free ? start.x + dx : snap(start.x + dx, el.w, xTargets))
        const y = Math.round(free ? start.y + dy : snap(start.y + dy, h0, yTargets))
        updateEl(el.id, { x, y })
      } else {
        const w = Math.max(40, Math.round(start.w + dx))
        if (el.type === 'polaroid') updateEl(el.id, { w })
        else if (ev.shiftKey) updateEl(el.id, { w, h: Math.round(start.h * (w / start.w)) })
        else updateEl(el.id, { w, h: Math.max(4, Math.round(start.h + dy)) })
      }
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  // Keyboard: delete, nudge, duplicate
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, select, [contenteditable]')) return
      const s = useStore.getState()
      const id = s.selectedId
      if (!id) return
      const el = s.post.elements.find((x) => x.id === id)
      if (!el) return
      const step = e.shiftKey ? 10 : 1
      const nudge: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }
      if (nudge[e.key]) {
        e.preventDefault()
        s.updateEl(id, { x: el.x + nudge[e.key][0], y: el.y + nudge[e.key][1] })
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault()
        s.removeEl(id)
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault()
        s.duplicateEl(id)
      } else if (e.key === 'Escape') s.select(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // 4:5 posts get cropped to 3:4 on the profile grid — show what's lost on slide 1.
  const gridCrop = post.aspect === '4:5' ? (SLIDE_W - (H * 3) / 4) / 2 : 0

  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="flex items-center gap-3 border-b border-zinc-200 px-4 py-2 text-xs text-zinc-500">
        <span className="font-medium text-zinc-700">Strip</span>
        <span>
          {post.slideCount} slides · {W}×{H}px
        </span>
        <label className="ml-auto flex items-center gap-1.5">
          <input type="checkbox" checked={guides} onChange={(e) => setGuides(e.target.checked)} /> Guides
        </label>
        <label className="flex items-center gap-2">
          Zoom
          <input type="range" min={0.5} max={3} step={0.05} value={zoom} onChange={(e) => setZoom(+e.target.value)} className="w-28" />
          <button className="rounded px-1.5 hover:bg-zinc-200" onClick={() => setZoom(1)}>
            Fit
          </button>
        </label>
      </div>

      <div ref={wrap} className="relative min-h-0 flex-1 overflow-auto bg-zinc-100" onPointerDown={() => select(null)}>
        <div className="p-9" style={{ width: W * scale + 72 }}>
          <div className="relative shadow-lg" style={{ width: W * scale, height: H * scale }}>
            <div style={{ transform: `scale(${scale})`, transformOrigin: '0 0', width: W, height: H }}>
              <Stage
                post={post}
                interactive
                scale={scale}
                selectedId={selectedId}
                onElPointerDown={onElPointerDown}
                onBackgroundPointerDown={() => select(null)}
                onDropImage={async (el, f) => setImage(el.id, await readImage(f))}
              />
            </div>

            {/* Guides overlay (never exported) */}
            <div className="pointer-events-none absolute inset-0">
              {Array.from({ length: post.slideCount }, (_, i) => (
                <div key={i}>
                  <div className="absolute -top-6 text-[11px] font-medium text-zinc-400" style={{ left: (i * SLIDE_W + 8) * scale }}>
                    {i + 1}
                  </div>
                  {i > 0 && (
                    <div className="absolute top-0 bottom-0 border-l border-dashed border-pink-500/80" style={{ left: i * SLIDE_W * scale }} />
                  )}
                  {guides && (
                    <div
                      className="absolute border border-dashed border-sky-500/35"
                      style={{ left: (i * SLIDE_W + SAFE) * scale, top: SAFE * scale, width: (SLIDE_W - SAFE * 2) * scale, height: (H - SAFE * 2) * scale }}
                    />
                  )}
                </div>
              ))}
              {guides && post.aspect === '1:1' && (
                <div className="absolute inset-0 overflow-hidden" title="Instagram crops the profile photo to this circle">
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/80" style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.35)' }} />
                </div>
              )}
              {guides && gridCrop > 0 && (
                <>
                  <div className="absolute top-0 bottom-0 bg-amber-400/25" style={{ left: 0, width: gridCrop * scale }} title="Cropped on profile grid" />
                  <div className="absolute top-0 bottom-0 bg-amber-400/25" style={{ left: (SLIDE_W - gridCrop) * scale, width: gridCrop * scale }} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-200 px-4 py-1.5 text-[11px] text-zinc-400">
        Drag to move · corner to resize (Shift keeps ratio) · Alt disables snapping · drop photos onto frames · ⌫ delete · ⌘D duplicate
        {gridCrop > 0 && ' · yellow = cropped on the 3:4 profile grid'}
      </div>
    </div>
  )
}
