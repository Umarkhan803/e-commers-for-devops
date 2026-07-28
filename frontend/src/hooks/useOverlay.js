import { useEffect } from 'react'

/** Locks background scrolling while an overlay is mounted, without layout shift. */
export function useBodyScrollLock(active) {
  useEffect(() => {
    if (!active) return undefined

    const { body } = document
    const previousOverflow = body.style.overflow
    const previousPadding = body.style.paddingRight
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

    body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`

    return () => {
      body.style.overflow = previousOverflow
      body.style.paddingRight = previousPadding
    }
  }, [active])
}

export function useEscapeKey(active, handler) {
  useEffect(() => {
    if (!active) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape') handler()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [active, handler])
}

/** Keeps Tab cycling inside the overlay so keyboard users cannot wander behind it. */
export function useFocusTrap(active, containerRef) {
  useEffect(() => {
    if (!active || !containerRef.current) return undefined

    const container = containerRef.current
    const previouslyFocused = document.activeElement

    const selector =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

    const focusables = () =>
      Array.from(container.querySelectorAll(selector)).filter(
        (element) => element.offsetParent !== null,
      )

    const initial = focusables()[0]
    initial?.focus({ preventScroll: true })

    const onKeyDown = (event) => {
      if (event.key !== 'Tab') return
      const elements = focusables()
      if (elements.length === 0) return

      const first = elements[0]
      const last = elements[elements.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    container.addEventListener('keydown', onKeyDown)
    return () => {
      container.removeEventListener('keydown', onKeyDown)
      previouslyFocused?.focus?.({ preventScroll: true })
    }
  }, [active, containerRef])
}
