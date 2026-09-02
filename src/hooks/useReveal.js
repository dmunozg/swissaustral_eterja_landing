import { useEffect, useRef, useState } from 'react'

/*
 * useReveal — IntersectionObserver-based scroll reveal.
 *
 * Returns { ref, state } where state is one of:
 *   'idle'   — before mount / not yet tracked (element is fully visible)
 *   'hidden' — below the fold, waiting to enter the viewport
 *   'shown'  — in view (or already visible on load / reduced motion)
 *
 * The initial (server-rendered and first-paint) state is 'idle', i.e. the
 * element is fully visible. That keeps the page intact for no-JS users and
 * avoids the classic flash-of-visibility bug: elements already on screen at
 * load are set to 'shown' synchronously (no hidden frame), while elements
 * below the fold are only hidden once we confirm they are off-screen.
 */
export function useReveal(options = {}) {
  const {
    threshold = 0.15,
    rootMargin = '0px 0px -10% 0px',
    once = true,
  } = options

  const ref = useRef(null)
  const [state, setState] = useState('idle')

  useEffect(() => {
    const el = ref.current
    if (typeof window === 'undefined' || !el) {
      setState('shown')
      return
    }

    const reduced =
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || !('IntersectionObserver' in window)) {
      setState('shown')
      return
    }

    // Synchronous check: is it already on screen right now? If so, show it
    // immediately — no hidden frame, no re-animation of first-view content.
    const rect = el.getBoundingClientRect()
    const vh = window.innerHeight || document.documentElement.clientHeight
    if (rect.top < vh * 0.9 && rect.bottom > 0) {
      setState('shown')
      return
    }

    setState('hidden')
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setState('shown')
            if (once) io.unobserve(entry.target)
          } else if (!once) {
            setState('hidden')
          }
        })
      },
      { threshold, rootMargin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold, rootMargin, once])

  return { ref, state }
}
