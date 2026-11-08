import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children, labelledBy = 'modal-title' }) {
  const dialogRef = useRef(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  useEffect(() => {
    if (!open) return undefined
    const previousOverflow = document.body.style.overflow
    const previousFocus = document.activeElement
    document.body.style.overflow = 'hidden'
    const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    const dialog = dialogRef.current
    const firstControl = dialog?.querySelector(focusableSelector)
    ;(firstControl || dialog)?.focus()
    const handleKeyboard = (event) => {
      if (event.key === 'Escape') {
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab' || !dialog) return
      const focusable = [...dialog.querySelectorAll(focusableSelector)].filter(element => element.getClientRects().length > 0)
      if (!focusable.length) { event.preventDefault(); dialog.focus(); return }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault(); last.focus()
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) {
        event.preventDefault(); first.focus()
      }
    }
    window.addEventListener('keydown', handleKeyboard)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyboard)
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus()
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fb-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        aria-labelledby={labelledBy}
        aria-modal="true"
        className="fb-dialog"
        ref={dialogRef}
        role="dialog"
        tabIndex="-1"
      >
        <header className="fb-dialog__header">
          <h2 id={labelledBy}>{title}</h2>
          <button aria-label="Close dialog" className="fb-icon-button" onClick={onClose} type="button">
            <X aria-hidden="true" />
          </button>
        </header>
        {children}
      </section>
    </div>
  )
}
