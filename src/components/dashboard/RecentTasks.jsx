import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import EmptyState from '../common/EmptyState.jsx'
import { formatDate } from '../../utils/date.js'

const statusLabels = {
  todo: 'To do',
  inProgress: 'In progress',
  inReview: 'In review',
  completed: 'Completed',
}

export default function RecentTasks({ tasks, projects }) {
  const projectMap = new Map(projects.map((project) => [project.id, project]))
  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime())
    .slice(0, 6)

  return (
    <section aria-labelledby="recent-tasks-title" className="fb-panel fb-recent-panel">
      <div className="fb-section-heading">
        <div>
          <h2 id="recent-tasks-title">Recent tasks</h2>
          <p>Latest work across your projects</p>
        </div>
      </div>
      {recentTasks.length === 0 ? (
        <EmptyState title="No tasks yet" description="Tasks from your projects will appear here." />
      ) : (
        <div className="fb-task-table" role="table" aria-label="Recent tasks">
          <div className="fb-task-table__head" role="row">
            <span role="columnheader">Task</span>
            <span role="columnheader">Project</span>
            <span role="columnheader">Priority</span>
            <span role="columnheader">Status</span>
            <span role="columnheader">Due date</span>
            <span role="columnheader">Owner</span>
          </div>
          {recentTasks.map((task) => {
            const project = projectMap.get(task.projectId)
            const initials = (task.assignee || '?').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
            return (
              <Link
                aria-label={`${task.title}, ${project?.name ?? 'Unassigned project'}`}
                className="fb-task-row"
                key={task.id}
                role="row"
                to={`/projects/${encodeURIComponent(task.projectId)}`}
              >
                <span className="fb-task-row__title" role="cell">
                  <strong>{task.title}</strong>
                  <small className="fb-task-row__mobile-project">{project?.name ?? 'Unassigned project'}</small>
                  <ArrowUpRight aria-hidden="true" />
                </span>
                <span className="fb-task-row__project" role="cell">{project?.name ?? 'Unassigned project'}</span>
                <span role="cell"><span className={`fb-priority fb-priority--${task.priority}`}>{task.priority}</span></span>
                <span role="cell"><span className={`fb-status fb-status--${task.status}`}>{statusLabels[task.status]}</span></span>
                <span className="fb-task-row__date" role="cell">{formatDate(task.dueDate)}</span>
                <span aria-label={task.assignee || 'Unassigned'} className="fb-assignee" role="cell" title={task.assignee || 'Unassigned'}>{initials}</span>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
