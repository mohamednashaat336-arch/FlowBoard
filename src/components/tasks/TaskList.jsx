import { Pencil, Trash2, Lock, Unlock } from 'lucide-react'
import { formatDate } from '../../utils/date.js'
import useApp from '../../hooks/useApp.js'

const statusLabel = { todo: 'To Do', inProgress: 'In Progress', inReview: 'In Review', completed: 'Completed' }

export default function TaskList({ tasks, projects, onEdit, onDelete, compact = false }) {
  const { claimTask, releaseTask, showToast, permissions, currentUser, teamMembers = [] } = useApp()
  const names = new Map(projects.map(p => [p.id, p.name]))
  const activeMemberIds = teamMembers.filter(m => m.status === 'active').map(m => m.id)

  function handleClaim(task) {
    try { claimTask(task.id); showToast('Task claimed.') }
    catch (e) { showToast(e.message, 'error') }
  }
  function handleRelease(task) {
    try { releaseTask(task.id); showToast('Task released.') }
    catch (e) { showToast(e.message, 'error') }
  }

  if (!tasks.length) return <p className="fb-list-empty">No tasks match your filters.</p>
  return <div className="fb-task-list">{tasks.map(task => {
    const isClaimed = Boolean(task.claimedById)
    const claimedByMe = task.claimedById === currentUser?.id
    const canClaim = permissions.canClaimTask(task, currentUser?.id)
    const canRelease = permissions.canReleaseTask(task, currentUser?.id)
    const project = projects.find(p => p.id === task.projectId)
    const canEdit = permissions?.canEditTaskInProject
      ? permissions.canEditTaskInProject(currentUser?.id, project, activeMemberIds)
      : (permissions?.canEditTask ?? true)
    const canDelete = permissions?.canDeleteTaskInProject
      ? permissions.canDeleteTaskInProject(currentUser?.id, project)
      : (permissions?.canDeleteTask ?? true)

    return <article className="fb-task-item" key={task.id}>
      <div className="fb-task-item__main"><span className={`fb-task-item__dot is-${task.status}`} /><div><h3>{task.title}</h3>{task.description && <p>{task.description}</p>}
        <small>{names.get(task.projectId) || 'Unknown project'}{task.dueDate ? ` · Due ${formatDate(task.dueDate)}` : ''}{task.assignee ? ` · ${task.assignee}` : ''}{task.createdAt ? ` · Created ${formatDate(task.createdAt)}` : ''}
        </small>
        {isClaimed && (
          <span className={`fb-claim-badge ${claimedByMe ? 'fb-claim-badge--mine' : 'fb-claim-badge--other'}`}>
            <Lock size={11} aria-hidden="true" />
            {claimedByMe ? 'Claimed by you' : `Claimed by ${task.claimedByName || 'a team member'}`}
          </span>
        )}
      </div></div>
      <div className="fb-task-item__meta">
        <span className={`fb-status fb-status--${task.status}`}>{statusLabel[task.status]}</span>
        <span className={`fb-priority fb-priority--${task.priority}`}>{task.priority}</span>
        {!compact && <div className="fb-task-item__actions">
          {!isClaimed && canClaim && (
            <button aria-label={`Claim ${task.title}`} className="fb-icon-button fb-icon-button--claim" onClick={() => handleClaim(task)} title="Claim task" type="button"><Lock /></button>
          )}
          {isClaimed && canRelease && (
            <button aria-label={`Release ${task.title}`} className="fb-icon-button fb-icon-button--release" onClick={() => handleRelease(task)} title="Release task" type="button"><Unlock /></button>
          )}
          {onEdit && canEdit && (
            <button aria-label={`Edit ${task.title}`} className="fb-icon-button" onClick={() => onEdit(task)} type="button"><Pencil /></button>
          )}
          {onDelete && canDelete && (
            <button aria-label={`Delete ${task.title}`} className="fb-icon-button" onClick={() => onDelete(task)} type="button"><Trash2 /></button>
          )}
        </div>}
      </div>
    </article>
  })}</div>
}
