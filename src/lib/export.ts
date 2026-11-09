import { toCanvas } from 'html-to-image'
import { type Post, SLIDE_W, slideHeight } from '../types'

/**
 * Renders the full strip once at native size, then cuts it into 1080-wide slides.
 * Rendering once (instead of per slide) guarantees elements line up across seams.
 */
export async function renderSlices(stage: HTMLElement, post: Post): Promise<Blob[]> {
  const H = slideHeight(post.aspect)
  const W = SLIDE_W * post.slideCount
  // Wait for images and fonts so nothing renders blank.
  await document.fonts.ready
  await Promise.all(
    Array.from(stage.querySelectorAll('img')).map((img) => (img.complete ? null : img.decode().catch(() => null))),
  )
  const strip = await toCanvas(stage, { width: W, height: H, pixelRatio: 1, cacheBust: false })

  const blobs: Blob[] = []
  for (let i = 0; i < post.slideCount; i++) {
    const c = document.createElement('canvas')
    c.width = SLIDE_W
    c.height = H
    c.getContext('2d')!.drawImage(strip, i * SLIDE_W, 0, SLIDE_W, H, 0, 0, SLIDE_W, H)
    blobs.push(await new Promise<Blob>((r) => c.toBlob((b) => r(b!), 'image/png')))
  }
  return blobs
}
