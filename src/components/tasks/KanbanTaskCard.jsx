import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { ExternalLink, GripVertical, Lock, MoreHorizontal, Pencil, Trash2, Unlock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatDate, localDateKey, sessionDate } from '../../utils/date.js'
import useApp from '../../hooks/useApp.js'

function initials(name) {
  return name?.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || '?'
}

export default function KanbanTaskCard({ task, projectName, onEdit, onDelete, overlay = false }) {
  const { claimTask, releaseTask, showToast, permissions, currentUser, projects = [], teamMembers = [] } = useApp()
  const project = projects.find(p => p.id === task.projectId)
  const activeMemberIds = teamMembers.filter(m => m.status === 'active').map(m => m.id)
  const canEdit = permissions?.canEditTaskInProject
    ? permissions.canEditTaskInProject(currentUser?.id, project, activeMemberIds)
    : (permissions?.canEditTask ?? true)
  const canDelete = permissions?.canDeleteTaskInProject
    ? permissions.canDeleteTaskInProject(currentUser?.id, project)
    : (permissions?.canDeleteTask ?? true)
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, isDragging } = useDraggable({ id: overlay ? `overlay-${task.id}` : task.id, data: { status: task.status }, disabled: !canEdit })
  const style = overlay ? undefined : { transform: CSS.Transform.toString(transform), opacity: isDragging ? 0.35 : 1 }

  const isClaimed = Boolean(task.claimedById)
  const claimedByMe = task.claimedById === currentUser?.id
  const canClaim = permissions.canClaimTask(task, currentUser?.id)
  const canRelease = permissions.canReleaseTask(task, currentUser?.id)

  function handleClaim() {
    try { claimTask(task.id); showToast('Task claimed.') }
    catch (e) { showToast(e.message, 'error') }
  }
  function handleRelease() {
    try { releaseTask(task.id); showToast('Task released.') }
    catch (e) { showToast(e.message, 'error') }
  }

  return <div className={`fb-kanban-card-wrap${overlay ? ' is-overlay' : ''}`} ref={overlay ? undefined : setNodeRef} style={style}>
    <article className={`fb-kanban-card${isClaimed ? ' fb-kanban-card--claimed' : ''}`}>
      <div className="fb-kanban-card__top"><span className={`fb-priority fb-priority--${task.priority}`}>{task.priority}</span><div className="fb-kanban-card__top-actions">{!overlay && canEdit && <button className="fb-kanban-card__drag" {...attributes} {...listeners} ref={setActivatorNodeRef} type="button" aria-label={`Drag ${task.title}`}><GripVertical aria-hidden="true"/></button>}<details className="fb-kanban-card__menu" onPointerDown={event => event.stopPropagation()}><summary aria-label={`Actions for ${task.title}`}><MoreHorizontal aria-hidden="true"/></summary><div>
        {!isClaimed && canClaim && <button onClick={handleClaim} type="button"><Lock size={14}/>Claim task</button>}
        {isClaimed && canRelease && <button onClick={handleRelease} type="button"><Unlock size={14}/>Release task</button>}
        {onEdit && canEdit && <button onClick={() => onEdit(task)} type="button"><Pencil/>Edit task</button>}
        {onDelete && canDelete && <button className="is-danger" onClick={() => onDelete(task)} type="button"><Trash2/>Delete task</button>}
        <Link to={`/projects/${encodeURIComponent(task.projectId)}`}><ExternalLink/>Open project</Link>
      </div></details></div></div>
      <h3>{task.title}</h3>{task.description && <p className="fb-kanban-card__description">{task.description}</p>}
      {isClaimed && (
        <div className={`fb-kanban-claim ${claimedByMe ? 'fb-kanban-claim--mine' : 'fb-kanban-claim--other'}`}>
          <Lock size={11} aria-hidden="true" />
          {claimedByMe ? 'Claimed by you' : `${task.claimedByName || 'Team member'}`}
        </div>
      )}
      <Link className="fb-kanban-card__project" to={`/projects/${encodeURIComponent(task.projectId)}`}>{projectName || 'Unknown project'} <ExternalLink aria-hidden="true"/></Link>
      <div className="fb-kanban-card__footer"><span className={task.dueDate && task.dueDate < localDateKey(sessionDate) && task.status !== 'completed' ? 'is-overdue' : ''}>{task.dueDate ? formatDate(task.dueDate) : 'No due date'}</span><span aria-label={task.assignee ? `Assigned to ${task.assignee}` : 'Unassigned'} className="fb-avatar fb-kanban-card__assignee" title={task.assignee || 'Unassigned'}>{initials(task.assignee)}</span></div>
    </article>
  </div>
}
