import { useRef, useState } from 'react'
import { useStore } from '../store'
import { type Post, SLIDE_W, slideHeight } from '../types'
import { Avatar, Stage } from './Stage'

const VIEW_W = 360

const Icon = ({ d }: { d: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

/**
 * A feed-post mock: swipe through the slices exactly as they will be cut.
 * `avatar` is the account profile photo, shown next to the handle.
 */
export function InstagramPreview({ avatar }: { avatar?: Post | null }) {
  const { post, setPost } = useStore()
  const H = slideHeight(post.aspect)
  const s = VIEW_W / SLIDE_W
  const viewH = H * s
  const [index, setIndex] = useState(0)
  const [drag, setDrag] = useState(0)
  const start = useRef<number | null>(null)
  const i = Math.min(index, post.slideCount - 1)

  const go = (n: number) => setIndex(Math.max(0, Math.min(post.slideCount - 1, n)))

  return (
    <aside className="flex h-full w-[420px] shrink-0 flex-col overflow-y-auto border-l border-zinc-200 bg-zinc-50">
      <div className="px-4 py-2 text-xs font-medium text-zinc-700">Instagram preview</div>

      <div className="mx-auto w-[360px] overflow-hidden rounded-xl border border-zinc-200 bg-white text-[13px] text-zinc-900 shadow-sm">
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-violet-600 p-[2px]">
            <div className="h-full w-full overflow-hidden rounded-full border-2 border-white bg-zinc-200">{avatar && <Avatar post={avatar} size={24} />}</div>
          </div>
          <span className="font-semibold">{post.account}</span>
          <span className="ml-auto text-lg leading-none text-zinc-500">···</span>
        </div>

        <div
          className="relative cursor-grab touch-none select-none overflow-hidden bg-zinc-100 active:cursor-grabbing"
          style={{ width: VIEW_W, height: viewH }}
          onPointerDown={(e) => {
            start.current = e.clientX
            ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
          }}
          onPointerMove={(e) => start.current !== null && setDrag(e.clientX - start.current)}
          onPointerUp={() => {
            if (drag < -50) go(i + 1)
            else if (drag > 50) go(i - 1)
            start.current = null
            setDrag(0)
          }}
        >
          <div
            style={{
              transform: `translateX(${-i * VIEW_W + drag}px)`,
              transition: start.current === null ? 'transform 300ms cubic-bezier(.2,.8,.2,1)' : 'none',
            }}
          >
            <div style={{ transform: `scale(${s})`, transformOrigin: '0 0', width: SLIDE_W * post.slideCount, height: H }}>
              <Stage post={post} />
            </div>
          </div>
          <div className="absolute top-3 right-3 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
            {i + 1}/{post.slideCount}
          </div>
          {i > 0 && (
            <button onClick={() => go(i - 1)} className="absolute top-1/2 left-2 h-7 w-7 -translate-y-1/2 rounded-full bg-white/85 text-zinc-700 shadow">‹</button>
          )}
          {i < post.slideCount - 1 && (
            <button onClick={() => go(i + 1)} className="absolute top-1/2 right-2 h-7 w-7 -translate-y-1/2 rounded-full bg-white/85 text-zinc-700 shadow">›</button>
          )}
        </div>

        <div className="relative flex items-center gap-3.5 px-3 pt-2.5 pb-1">
          <Icon d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
          <Icon d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 21l2.1-5.7A8.4 8.4 0 1 1 21 11.5z" />
          <Icon d="M22 3 9.2 10.1M22 3l-6.7 18-3.9-8.4L3 8.8z" />
          <div className="absolute left-1/2 flex -translate-x-1/2 gap-1">
            {Array.from({ length: post.slideCount }, (_, n) => (
              <span key={n} className={`h-1.5 w-1.5 rounded-full ${n === i ? 'bg-sky-500' : 'bg-zinc-300'}`} />
            ))}
          </div>
          <span className="ml-auto">
            <Icon d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </span>
        </div>
        <div className="px-3 pb-3">
          <p className="font-semibold">128 likes</p>
          <p className="mt-0.5 whitespace-pre-wrap">
            <span className="font-semibold">{post.account}</span>{' '}
            {post.caption ? (post.caption.length > 125 ? post.caption.slice(0, 125) + '… more' : post.caption) : <span className="text-zinc-400">Write a caption…</span>}
          </p>
        </div>
      </div>

      <div className="space-y-3 px-4 py-4">
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-500">Account</span>
          <input className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm" value={post.account} onChange={(e) => setPost({ account: e.target.value })} />
        </label>
        <label className="block">
          <span className="mb-1 flex justify-between text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            Caption <span className={post.caption.length > 2200 ? 'text-red-600' : ''}>{post.caption.length}/2200</span>
          </span>
          <textarea
            className="min-h-32 w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm"
            value={post.caption}
            onChange={(e) => setPost({ caption: e.target.value })}
            placeholder="Then and now… #classof2007"
          />
        </label>
      </div>
    </aside>
  )
}

/** Profile-page mock: the photo at the sizes Instagram shows it, plus the handle. */
export function ProfilePreview() {
  const { post, setPost } = useStore()
  return (
    <aside className="flex h-full w-[420px] shrink-0 flex-col overflow-y-auto border-l border-zinc-200 bg-zinc-50">
      <div className="px-4 py-2 text-xs font-medium text-zinc-700">Instagram preview</div>
      <div className="mx-auto w-[360px] rounded-xl border border-zinc-200 bg-white p-4 text-[13px] text-zinc-900 shadow-sm">
        <div className="flex items-center gap-6">
          <Avatar post={post} size={86} />
          <div className="flex flex-1 justify-around text-center">
            {[['24', 'posts'], ['312', 'followers'], ['180', 'following']].map(([n, l]) => (
              <div key={l}>
                <div className="font-semibold">{n}</div>
                <div className="text-zinc-500">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-3 font-semibold">{post.account}</p>
        <div className="mt-4 flex items-center gap-3 border-t border-zinc-100 pt-3 text-zinc-500">
          <Avatar post={post} size={32} />
          <span className="font-semibold text-zinc-900">{post.account}</span>
          <span className="ml-auto text-[11px]">feed size</span>
        </div>
      </div>
      <div className="space-y-3 px-4 py-4">
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-500">Account</span>
          <input className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm" value={post.account} onChange={(e) => setPost({ account: e.target.value })} />
        </label>
      </div>
    </aside>
  )
}
