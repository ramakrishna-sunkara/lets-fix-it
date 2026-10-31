import { useEffect, useRef } from 'react'
import { FUNNY_LOADING_VIDEO } from '../lib/funny_loading'

type FunnyLoadingMascotProps = {
  isVisible: boolean
}

export function FunnyLoadingMascot({ isVisible }: FunnyLoadingMascotProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) {
      return
    }
    if (isVisible) {
      video.currentTime = 0
      void video.play().catch(() => {
        // Autoplay may be blocked; muted + playsInline usually allows it.
      })
      return
    }
    video.pause()
    video.currentTime = 0
  }, [isVisible])

  if (!isVisible) {
    return null
  }

  return (
    <aside
      className="pointer-events-none fixed bottom-6 right-3 z-30 hidden w-[18rem] sm:block md:right-5 md:w-[22rem] lg:right-8 lg:w-[26rem]"
      aria-hidden
    >
      <div className="overflow-hidden rounded-2xl border border-line bg-paper/95 shadow-soft backdrop-blur-sm">
        <video
          ref={videoRef}
          className="aspect-video w-full object-contain bg-charcoal"
          src={FUNNY_LOADING_VIDEO}
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
        />
        <p className="px-2 py-1.5 text-center text-[10px] font-medium uppercase tracking-wide text-muted">
          Gemma thinking…
        </p>
      </div>
    </aside>
  )
}
