import { useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useBodyScrollLock, useEscapeKey, useFocusTrap } from '../../hooks/useOverlay'

const WIDTHS = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
}

export default function Modal({
  open,
  onClose,
  title,
  description,
  size = 'lg',
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
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-ink-950/55 backdrop-blur-sm animate-fade-in"
        onClick={close}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-pop animate-scale-in sm:rounded-3xl',
          WIDTHS[size],
          className,
        )}
      >
        {title || description ? (
          <header className="flex items-start justify-between gap-4 border-b border-ink-100 px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-ink-900">{title}</h2>
              {description ? <p className="mt-0.5 text-sm text-ink-500">{description}</p> : null}
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close dialog"
              className="-mr-1 rounded-full p-2 text-ink-400 transition hover:bg-ink-100 hover:text-ink-800"
            >
              <X className="size-5" />
            </button>
          </header>
        ) : (
          <button
            type="button"
            onClick={close}
            aria-label="Close dialog"
            className="absolute right-3 top-3 z-20 rounded-full bg-white/90 p-2 text-ink-500 shadow-soft transition hover:text-ink-900"
          >
            <X className="size-5" />
          </button>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
