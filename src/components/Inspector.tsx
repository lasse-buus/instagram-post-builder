import type { ReactNode } from 'react'
import { pickFile, readImage } from '../lib/files'
import { useStore } from '../store'
import { chatBubble, circle, newElement } from '../template'
import { type Crop, type El, type ElType, PALETTE, SLIDE_W, type Tint, type TintMode, slideHeight } from '../types'

const inputCls = 'w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm outline-none focus:border-zinc-500'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-500">{label}</span>
      {children}
    </label>
  )
}

function Num({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <Field label={label}>
      <input type="number" step={step} className={inputCls} value={Math.round(value * 100) / 100} onChange={(e) => onChange(+e.target.value)} />
    </Field>
  )
}

function Range({ label, value, min, max, step = 1, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void }) {
  return (
    <Field label={`${label} · ${Math.round(value * 100) / 100}`}>
      <input type="range" className="w-full" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} />
    </Field>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 border-b border-zinc-200 px-4 py-4">
      <h3 className="text-xs font-semibold text-zinc-800">{title}</h3>
      {children}
    </section>
  )
}

const btn = 'rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50'

/** `profile`: editing the account profile photo — hides the person-only post settings. */
export function Inspector({ profile = false }: { profile?: boolean }) {
  const { post, selectedId, addEl } = useStore()
  const el = post.elements.find((e) => e.id === selectedId)

  // New elements go onto the slide of the current selection (or slide 1).
  const targetSlide = el ? Math.min(post.slideCount - 1, Math.max(0, Math.floor((el.x + el.w / 2) / SLIDE_W))) : 0
  const add = (t: ElType) => addEl(newElement(t, targetSlide, post.aspect))

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col overflow-y-auto border-r border-zinc-200 bg-zinc-50">
      <Section title={`Add to slide ${targetSlide + 1}`}>
        <div className="grid grid-cols-2 gap-2">
          <button className={btn} onClick={() => add('polaroid')}>Polaroid</button>
          <button className={btn} onClick={() => add('text')}>Text</button>
          <button className={btn} onClick={() => add('image')}>Image</button>
          <button className={btn} onClick={() => add('rect')}>Line</button>
          <button className={btn} onClick={() => addEl(chatBubble(targetSlide, slideHeight(post.aspect) / 2 - 65, 'left', 'Question?'))}>Chat question</button>
          <button className={btn} onClick={() => addEl(chatBubble(targetSlide, slideHeight(post.aspect) / 2 - 65, 'right', 'Answer'))}>Chat answer</button>
          <button className={`${btn} col-span-2`} onClick={() => addEl(circle(targetSlide, post.aspect, '#ffffff'))}>Circle (behind a photo)</button>
        </div>
      </Section>
      {el ? <ElementInspector key={el.id} el={el} /> : profile ? <ProfileInspector /> : <PostInspector />}
    </aside>
  )
}

function PostInspector() {
  const { post, setPost, setSlideCount } = useStore()
  return (
    <Section title="Post">
      <Field label="Person">
        <input className={inputCls} value={post.person} onChange={(e) => setPost({ person: e.target.value })} />
      </Field>
      <Field label="Aspect ratio">
        <select className={inputCls} value={post.aspect} onChange={(e) => setPost({ aspect: e.target.value as '3:4' | '4:5' })}>
          <option value="3:4">3:4 · 1080×1440 (profile grid, upload via “Original”)</option>
          <option value="4:5">4:5 · 1080×1350 (API / ads compatible)</option>
        </select>
      </Field>
      <Field label="Slides">
        <div className="flex items-center gap-2">
          <button className={btn} onClick={() => setSlideCount(post.slideCount - 1)}>−</button>
          <span className="w-6 text-center text-sm tabular-nums">{post.slideCount}</span>
          <button className={btn} onClick={() => setSlideCount(post.slideCount + 1)}>+</button>
        </div>
      </Field>
      <SlideBackgrounds />
      <Field label="Status">
        <select className={inputCls} value={post.status} onChange={(e) => setPost({ status: e.target.value as typeof post.status })}>
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="posted">Posted</option>
        </select>
      </Field>
      <div className="space-y-2 rounded-md border border-zinc-200 bg-white p-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={post.consent.given}
            onChange={(e) => setPost({ consent: { ...post.consent, given: e.target.checked, date: e.target.checked ? new Date().toISOString().slice(0, 10) : undefined } })}
          />
          Person has agreed to be posted
        </label>
        {post.consent.given && <p className="text-[11px] text-zinc-500">Recorded {post.consent.date}</p>}
        <input
          className={inputCls}
          placeholder="How / where (e.g. Messenger 9 Nov)"
          value={post.consent.note ?? ''}
          onChange={(e) => setPost({ consent: { ...post.consent, note: e.target.value } })}
        />
      </div>
      <p className="text-[11px] leading-relaxed text-zinc-400">Select an element on the strip to edit it.</p>
    </Section>
  )
}

function ProfileInspector() {
  return (
    <Section title="Profile photo">
      <p className="text-[11px] leading-relaxed text-zinc-500">
        Instagram shows this as a circle — keep everything important inside the dashed ring. Add an Image and drop a photo on it for a photo background.
      </p>
      <SlideBackgrounds />
      <p className="text-[11px] leading-relaxed text-zinc-400">Select an element to edit it.</p>
    </Section>
  )
}

function Swatches({ value, onPick }: { value: string; onPick: (c: string) => void }) {
  return (
    <div className="flex items-center gap-[3px]">
      {PALETTE.map((c) => (
        <button
          key={c}
          title={c}
          onClick={() => onPick(c)}
          className={`h-[18px] w-[18px] shrink-0 rounded-full border ${value.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-zinc-900 ring-offset-1' : 'border-black/10'}`}
          style={{ background: c }}
        />
      ))}
      <input type="color" value={value} onChange={(e) => onPick(e.target.value)} className="h-[18px] w-5 shrink-0 cursor-pointer" title="Custom colour" />
    </div>
  )
}

function SlideBackgrounds() {
  const { post, setSlideBg } = useStore()
  return (
    <Field label="Slide backgrounds">
      <div className="space-y-1.5 rounded-md border border-zinc-200 bg-white p-2">
        {post.slideBackgrounds.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-4 text-right text-[11px] tabular-nums text-zinc-400">{i + 1}</span>
            <Swatches value={c} onPick={(v) => setSlideBg(i, v)} />
          </div>
        ))}
        <div className="flex items-center gap-2 border-t border-zinc-100 pt-1.5">
          <span className="w-4 text-right text-[11px] text-zinc-400">All</span>
          <Swatches value="" onPick={(v) => setSlideBg('all', v)} />
        </div>
      </div>
    </Field>
  )
}

function TintControls({ tint, onChange }: { tint?: Tint; onChange: (t: Tint | undefined) => void }) {
  if (!tint) {
    return (
      <button className={`${btn} w-full`} onClick={() => onChange({ color: '#FFC72C', strength: 0.85, mode: 'multiply', grayscale: true })}>
        Add colour overlay
      </button>
    )
  }
  return (
    <div className="space-y-3 rounded-md border border-zinc-200 bg-white p-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Colour overlay</span>
        <button className="text-[11px] text-zinc-400 underline" onClick={() => onChange(undefined)}>Remove</button>
      </div>
      <Swatches value={tint.color} onPick={(color) => onChange({ ...tint, color })} />
      <Range label="Strength" value={tint.strength} min={0} max={1} step={0.01} onChange={(strength) => onChange({ ...tint, strength })} />
      <Field label="Blend">
        <select className={inputCls} value={tint.mode} onChange={(e) => onChange({ ...tint, mode: e.target.value as TintMode })}>
          <option value="multiply">Multiply (duotone)</option>
          <option value="color">Colour</option>
          <option value="screen">Screen (light)</option>
          <option value="normal">Solid</option>
        </select>
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={tint.grayscale} onChange={(e) => onChange({ ...tint, grayscale: e.target.checked })} />
        Black &amp; white photo
      </label>
    </div>
  )
}

function CropControls({ crop, onChange }: { crop: Crop; onChange: (c: Crop) => void }) {
  return (
    <>
      <Range label="Zoom" value={crop.zoom} min={1} max={3} step={0.01} onChange={(zoom) => onChange({ ...crop, zoom })} />
      <Range label="Focus X" value={crop.x} min={0} max={100} onChange={(x) => onChange({ ...crop, x })} />
      <Range label="Focus Y" value={crop.y} min={0} max={100} onChange={(y) => onChange({ ...crop, y })} />
    </>
  )
}

function ElementInspector({ el }: { el: El }) {
  const { post, updateEl, setImage, removeEl, duplicateEl, reorderEl, select, addPhotoBackground } = useStore()
  const photoBg = post.elements.find((e) => e.type === 'image' && e.linkedTo === el.id)
  const set = (patch: Partial<El>) => updateEl(el.id, patch)
  const upload = async () => {
    const f = await pickFile('image/*')
    if (f) setImage(el.id, await readImage(f))
  }

  return (
    <>
      <Section title={el.type === 'rect' ? (el.radius >= Math.min(el.w, el.h) / 2 && el.w === el.h ? 'Circle' : 'Shape') : el.type[0].toUpperCase() + el.type.slice(1)}>
        {el.type === 'polaroid' && (
          <>
            <button className={`${btn} w-full py-1.5`} onClick={upload}>{el.image ? 'Replace photo' : 'Upload photo'}</button>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Year">
                <input className={inputCls} value={el.year} onChange={(e) => set({ year: e.target.value })} />
              </Field>
              <Field label="Subtitle">
                <input className={inputCls} value={el.subtitle} onChange={(e) => set({ subtitle: e.target.value })} />
              </Field>
            </div>
            <CropControls crop={el.crop} onChange={(crop) => set({ crop })} />
            {photoBg ? (
              <button className={`${btn} w-full`} onClick={() => select(photoBg.id)}>Edit background overlay</button>
            ) : (
              <button className={`${btn} w-full`} onClick={() => addPhotoBackground(el.id)} disabled={!el.image}>
                Add photo background
              </button>
            )}
          </>
        )}

        {el.type === 'image' && (
          <>
            {el.linkedTo ? (
              <p className="text-[11px] text-zinc-500">
                Follows the photo of a polaroid.{' '}
                <button className="underline" onClick={() => select(el.linkedTo!)}>Select it</button> ·{' '}
                <button className="underline" onClick={() => set({ linkedTo: undefined })}>Unlink</button>
              </p>
            ) : (
              <button className={`${btn} w-full py-1.5`} onClick={upload}>{el.image ? 'Replace image' : 'Upload image'}</button>
            )}
            <CropControls crop={el.crop} onChange={(crop) => set({ crop })} />
            <TintControls tint={el.tint} onChange={(tint) => set({ tint })} />
            <Range label="Blur" value={el.blur} min={0} max={40} onChange={(blur) => set({ blur })} />
            <Range label="Opacity" value={el.opacity} min={0} max={1} step={0.01} onChange={(opacity) => set({ opacity })} />
          </>
        )}

        {el.type === 'text' && (
          <>
            <Field label="Text">
              <textarea className={`${inputCls} min-h-28`} value={el.content} onChange={(e) => set({ content: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Num label="Size" value={el.fontSize} onChange={(fontSize) => set({ fontSize })} />
              <Num label="Line height" step={0.05} value={el.lineHeight} onChange={(lineHeight) => set({ lineHeight })} />
              <Field label="Font">
                <select className={inputCls} value={el.font} onChange={(e) => set({ font: e.target.value as typeof el.font })}>
                  <option value="sans">Sans</option>
                  <option value="serif">Serif</option>
                  <option value="mono">Mono</option>
                </select>
              </Field>
              <Field label="Weight">
                <select className={inputCls} value={el.weight} onChange={(e) => set({ weight: +e.target.value as typeof el.weight })}>
                  {[400, 500, 600, 700, 800].map((w) => <option key={w} value={w}>{w}</option>)}
                </select>
              </Field>
              <Field label="Align">
                <select className={inputCls} value={el.align} onChange={(e) => set({ align: e.target.value as typeof el.align })}>
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </Field>
              <Field label="Color">
                <input type="color" className="h-8 w-full" value={el.color} onChange={(e) => set({ color: e.target.value })} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Letters">
                <select className={inputCls} value={el.effect ?? 'none'} onChange={(e) => set({ effect: e.target.value === 'none' ? undefined : (e.target.value as 'cutout' | 'tiles') })}>
                  <option value="none">Plain</option>
                  <option value="cutout">Cut-out</option>
                  <option value="tiles">Tiles</option>
                </select>
              </Field>
              <Num label="Arc (°)" value={el.arc ?? 0} onChange={(arc) => set({ arc: Math.max(-120, Math.min(120, arc)) || undefined })} />
            </div>
            <Field label="Chat bubble">
              <select
                className={inputCls}
                value={el.bubble?.side ?? 'none'}
                onChange={(e) => {
                  const side = e.target.value
                  set({ bubble: side === 'none' ? undefined : { side: side as 'left' | 'right', color: el.bubble?.color ?? (side === 'left' ? '#ffffff' : '#2E86DE') } })
                }}
              >
                <option value="none">None</option>
                <option value="left">Left · question</option>
                <option value="right">Right · answer</option>
              </select>
            </Field>
            {el.bubble && (
              <Field label="Bubble colour">
                <Swatches value={el.bubble.color} onPick={(color) => set({ bubble: { ...el.bubble!, color } })} />
              </Field>
            )}
          </>
        )}

        {el.type === 'rect' && (
          <>
            <Field label="Color">
              <Swatches value={el.color} onPick={(color) => set({ color })} />
            </Field>
            <Num label="Corner radius" value={el.radius} onChange={(radius) => set({ radius })} />
          </>
        )}
      </Section>

      <Section title="Position">
        <div className="grid grid-cols-2 gap-2">
          <Num label="X" value={el.x} onChange={(x) => set({ x })} />
          <Num label="Y" value={el.y} onChange={(y) => set({ y })} />
          <Num label="Width" value={el.w} onChange={(w) => set({ w })} />
          {el.type !== 'polaroid' && <Num label="Height" value={el.h} onChange={(h) => set({ h })} />}
          <Num label="Rotation" value={el.rotation} onChange={(rotation) => set({ rotation })} />
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <button className={btn} onClick={() => reorderEl(el.id, 'up')}>Bring forward</button>
          <button className={btn} onClick={() => reorderEl(el.id, 'down')}>Send back</button>
          <button className={btn} onClick={() => duplicateEl(el.id)}>Duplicate</button>
          <button className={`${btn} text-red-600`} onClick={() => removeEl(el.id)}>Delete</button>
        </div>
      </Section>
    </>
  )
}
