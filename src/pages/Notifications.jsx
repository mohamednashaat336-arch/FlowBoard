import { useMemo } from 'react'
import { Bell, Check, CheckCheck, Clock3, FolderPlus, ListChecks, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../components/common/Button.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import useApp from '../hooks/useApp.js'

const iconByType = { taskAssigned: ListChecks, taskCompleted: CheckCheck, upcomingDeadline: Clock3, overdueTask: Clock3, projectCreated: FolderPlus }

function dateTime(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export default function Notifications() {
  const { workspace, markNotificationRead, markAllNotificationsRead, deleteNotification } = useApp()
  const notifications = useMemo(() => [...workspace.notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [workspace.notifications])
  const unreadCount = notifications.filter(item => !item.read).length
  return <div className="fb-management-page">
    <div className="fb-page-heading"><div><p className="fb-eyebrow">Workspace</p><h1>Notifications</h1><p>{unreadCount ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'You’re all caught up.'}</p></div>{unreadCount > 0 && <Button onClick={markAllNotificationsRead}><CheckCheck/>Mark all as read</Button>}</div>
    {notifications.length ? <section aria-label="Notifications" className="fb-notification-list">{notifications.map(notification => {
      const Icon = iconByType[notification.type] || Bell
      return <article className={`fb-notification-item${notification.read ? '' : ' is-unread'}`} key={notification.id}>
        <span className="fb-notification-item__icon"><Icon aria-hidden="true"/></span>
        <div className="fb-notification-item__copy"><div className="fb-notification-item__title"><h2>{notification.title}</h2>{!notification.read && <span>New</span>}</div><p>{notification.description}</p><time dateTime={notification.createdAt}>{dateTime(notification.createdAt)}</time></div>
        <div className="fb-notification-item__actions">{notification.projectId && workspace.projects.some(project => project.id === notification.projectId) && <Link aria-label="Open related project" className="fb-notification-item__link" to={`/projects/${encodeURIComponent(notification.projectId)}`}>Open</Link>}{!notification.read && <button aria-label="Mark notification as read" className="fb-icon-button" onClick={() => markNotificationRead(notification.id)} type="button"><Check/></button>}<button aria-label="Delete notification" className="fb-icon-button" onClick={() => deleteNotification(notification.id)} type="button"><Trash2/></button></div>
      </article>
    })}</section> : <EmptyState Icon={Bell} title="No notifications" description="Project and task updates will appear here. No emails or push messages are sent."/>}
  </div>
}
