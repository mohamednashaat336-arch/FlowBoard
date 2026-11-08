import { ShieldOff } from 'lucide-react'
import { Link } from 'react-router-dom'

/**
 * Reusable access-denied display for restricted pages/routes.
 * Does NOT replace logic-layer permission checks.
 */
export default function AccessDenied({ message = 'You do not have permission to access this page.' }) {
  return (
    <div className="fb-access-denied">
      <ShieldOff aria-hidden="true" className="fb-access-denied__icon" />
      <h2>Access restricted</h2>
      <p>{message}</p>
      <Link className="fb-text-link" to="/dashboard">Return to dashboard</Link>
    </div>
  )
}
