import { useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useBodyScrollLock, useEscapeKey, useFocusTrap } from '../../hooks/useOverlay'

/** Slide-over panel used for the cart and the mobile filter sheet. */
export default function Drawer({
  open,
  onClose,
  title,
  subtitle,
  side = 'right',
  footer,
  className,
  children,
}) {
  const panelRef = useRef(null)
  const close = useCallback(() => onClose?.(), [onClose])

  useBodyScrollLock(open)
  useEscapeKey(open, close)
  useFocusTrap(open, panelRef)

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[75]">
      <div
        className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm animate-fade-in"
        onClick={close}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'absolute inset-y-0 flex w-full max-w-md flex-col bg-ink-50 shadow-pop',
          side === 'right' ? 'right-0 animate-slide-left' : 'left-0 animate-slide-right',
          className,
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-ink-100 bg-white px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-ink-900">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close panel"
            className="-mr-1 rounded-full p-2 text-ink-400 transition hover:bg-ink-100 hover:text-ink-800"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>

        {footer ? (
          <footer className="border-t border-ink-100 bg-white px-5 py-4 shadow-[0_-8px_24px_-20px_rgba(16,24,40,0.4)]">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}
