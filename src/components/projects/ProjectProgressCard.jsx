import { ArrowUpRight, Layers2, MoreHorizontal } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatDate } from '../../utils/date.js'

export default function ProjectProgressCard({ project, tasks, actions }) {
  const completed = tasks.filter((task) => task.status === 'completed').length
  const total = tasks.length
  const progress = total ? Math.round((completed / total) * 100) : 0
  const assignees = [...new Set(tasks.map(task => task.assignee).filter(Boolean))]

  return (
    <article className="fb-project-progress" style={{ '--project-color': project.color || 'var(--color-primary)' }}>
      {actions && <details className="fb-project-card-menu"><summary aria-label={`Actions for ${project.name}`}><MoreHorizontal aria-hidden="true" /></summary><div>{actions}</div></details>}
      <Link className="fb-project-progress__link" to={`/projects/${encodeURIComponent(project.id)}`}>
      <div className="fb-project-progress__top">
        <span className="fb-project-progress__mark"><Layers2 aria-hidden="true" /></span>
        <span aria-hidden="true" className="fb-project-progress__arrow"><ArrowUpRight /></span>
      </div>
      <h3>{project.name}</h3>
      <p className="fb-project-card-description">{project.description || 'No description provided.'}</p>
      <div className="fb-project-card-meta"><span className={`fb-status fb-status--${project.status}`}>{project.status === 'onHold' ? 'On hold' : project.status === 'completed' ? 'Completed' : 'Active'}</span><span>{project.startDate ? `Starts ${formatDate(project.startDate)}` : 'Start not set'} · {project.dueDate ? `Due ${formatDate(project.dueDate)}` : 'No due date'}</span></div>
      <div className="fb-project-card-team" title={assignees.join(', ')}>{assignees.length ? <><span>{assignees.slice(0, 3).map(name => name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()).join(' · ')}</span><small>{assignees.length} assignee{assignees.length === 1 ? '' : 's'}</small></> : <small>No assignees yet</small>}</div>
      <div className="fb-project-progress__numbers">
        <span>{completed} of {total} tasks</span>
        <strong>{progress}%</strong>
      </div>
      <div
        aria-label={`${project.name}: ${progress}% complete`}
        aria-valuemax="100"
        aria-valuemin="0"
        aria-valuenow={progress}
        className="fb-progress-track"
        role="progressbar"
      >
        <span style={{ width: `${progress}%` }} />
      </div>
      </Link>
    </article>
  )
}
