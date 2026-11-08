import { Inbox } from 'lucide-react'

export default function EmptyState({ title, description, Icon = Inbox, action }) {
  return (
    <div className="fb-empty-state">
      <span className="fb-empty-state__icon"><Icon aria-hidden="true" /></span>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  )
}
