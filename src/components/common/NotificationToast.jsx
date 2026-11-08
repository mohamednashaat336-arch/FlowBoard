import { useEffect } from 'react'
import { CircleCheck, CircleX, X } from 'lucide-react'

export default function NotificationToast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return undefined
    const timeout = window.setTimeout(onDismiss, 3500)
    return () => window.clearTimeout(timeout)
  }, [toast, onDismiss])

  if (!toast) return null
  const Icon = toast.type === 'error' ? CircleX : CircleCheck

  return (
    <div className={`fb-toast fb-toast--${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'}>
      <Icon aria-hidden="true" className="fb-toast__icon" />
      <span>{toast.message}</span>
      <button aria-label="Dismiss notification" className="fb-toast__close" onClick={onDismiss} type="button">
        <X aria-hidden="true" />
      </button>
    </div>
  )
}
