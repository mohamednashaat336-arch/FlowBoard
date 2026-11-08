import { ArrowUpRight, CalendarClock } from 'lucide-react'
import { Link } from 'react-router-dom'
import EmptyState from '../common/EmptyState.jsx'
import { formatDate, localDateKey, sessionDate } from '../../utils/date.js'

export default function UpcomingDeadlines({ tasks, projects }) {
  const today = localDateKey(sessionDate)
  const projectMap = new Map(projects.map((project) => [project.id, project]))
  const upcoming = tasks
    .filter((task) => task.status !== 'completed' && task.dueDate && task.dueDate >= today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5)

  return (
    <section aria-labelledby="upcoming-title" className="fb-panel fb-deadlines-panel">
      <div className="fb-section-heading">
        <div>
          <h2 id="upcoming-title">Upcoming deadlines</h2>
          <p>Next tasks due</p>
        </div>
      </div>
      {upcoming.length === 0 ? (
        <EmptyState Icon={CalendarClock} title="All clear" description="There are no upcoming deadlines." />
      ) : (
        <ul className="fb-deadline-list">
          {upcoming.map((task) => (
            <li key={task.id}>
              <Link to={`/projects/${encodeURIComponent(task.projectId)}`}>
                <span className="fb-deadline-list__date">{formatDate(task.dueDate)}</span>
                <span className="fb-deadline-list__copy">
                  <strong>{task.title}</strong>
                  <small>{projectMap.get(task.projectId)?.name ?? 'Unassigned project'}</small>
                </span>
                <ArrowUpRight aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
