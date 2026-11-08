import { Suspense, lazy, useMemo, useState } from 'react'
import { ArrowRight, CheckCheck, CircleDashed, FolderKanban, ListTodo, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import RecentTasks from '../components/dashboard/RecentTasks.jsx'
import StatsCard from '../components/dashboard/StatsCard.jsx'
import UpcomingDeadlines from '../components/dashboard/UpcomingDeadlines.jsx'
import Button from '../components/common/Button.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import ProjectModal from '../components/projects/ProjectModal.jsx'
import ProjectProgressCard from '../components/projects/ProjectProgressCard.jsx'
import useApp from '../hooks/useApp.js'
import useAuth from '../hooks/useAuth.js'

const ActivityChart = lazy(() => import('../components/dashboard/ActivityChart.jsx'))

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function displayDate() {
  return new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())
}

export default function Dashboard() {
  const { projects, tasks, addProject, showToast } = useApp()
  const { currentUser } = useAuth()
  const [isCreateOpen, setCreateOpen] = useState(false)

  const stats = useMemo(() => {
    const completed = tasks.filter((task) => task.status === 'completed').length
    const inProgress = tasks.filter((task) => task.status === 'inProgress').length
    const activeProjects = projects.filter((project) => project.status !== 'completed').length
    return [
      { label: 'Total projects', value: projects.length, detail: `${activeProjects} active`, Icon: FolderKanban },
      { label: 'Total tasks', value: tasks.length, detail: 'Across your workspace', Icon: ListTodo },
      { label: 'Completed tasks', value: completed, detail: tasks.length ? `${Math.round((completed / tasks.length) * 100)}% of all tasks` : 'No tasks yet', Icon: CheckCheck },
      { label: 'In progress', value: inProgress, detail: 'Currently being worked on', Icon: CircleDashed },
    ]
  }, [projects, tasks])

  const activeProjects = projects.filter((project) => project.status !== 'completed').slice(0, 3)
  const tasksByProject = useMemo(() => {
    const grouped = new Map()
    tasks.forEach((task) => {
      const group = grouped.get(task.projectId) ?? []
      group.push(task)
      grouped.set(task.projectId, group)
    })
    return grouped
  }, [tasks])

  function handleCreateProject(data) {
    try {
      const project = addProject(data)
      setCreateOpen(false)
      showToast(`${project.name} was added to your projects.`)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'The project could not be created.', 'error')
      throw error
    }
  }

  return (
    <div className="fb-dashboard">
      <section className="fb-welcome" aria-labelledby="welcome-title">
        <div>
          <p className="fb-welcome__date">{displayDate()}</p>
          <h2 id="welcome-title">{greeting()}, {currentUser?.fullName?.split(/\s+/)[0] || 'there'}</h2>
          <p>Here’s what’s moving across your workspace today.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} variant="primary">
          <Plus aria-hidden="true" />
          Create project
        </Button>
      </section>

      <section aria-label="Workspace statistics" className="row g-3 fb-stats-grid">
        {stats.map((stat) => (
          <div className="col-12 col-sm-6 col-xl-3" key={stat.label}>
            <StatsCard {...stat} />
          </div>
        ))}
      </section>

      <section aria-labelledby="projects-progress-title" className="fb-dashboard-section">
        <div className="fb-section-heading">
          <div>
            <h2 id="projects-progress-title">Project progress</h2>
            <p>A quick look at active work</p>
          </div>
          <Link className="fb-text-link" to="/projects">All projects <ArrowRight aria-hidden="true" /></Link>
        </div>
        {activeProjects.length === 0 ? (
          <EmptyState
            action={<Button onClick={() => setCreateOpen(true)} variant="secondary"><Plus aria-hidden="true" />Create a project</Button>}
            title="No active projects"
            description="Create your first project to start organizing work."
          />
        ) : (
          <div className="row g-3">
            {activeProjects.map((project) => (
              <div className="col-12 col-md-6 col-xl-4" key={project.id}>
                <ProjectProgressCard project={project} tasks={tasksByProject.get(project.id) ?? []} />
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="row g-3 fb-dashboard-mid-row">
        <div className="col-12 col-xl-7">
          <Suspense fallback={<div aria-busy="true" className="fb-panel fb-chart-loading">Loading activity chart…</div>}>
            <ActivityChart tasks={tasks} />
          </Suspense>
        </div>
        <div className="col-12 col-xl-5">
          <UpcomingDeadlines projects={projects} tasks={tasks} />
        </div>
      </div>

      <RecentTasks projects={projects} tasks={tasks} />

      <ProjectModal onClose={() => setCreateOpen(false)} onSave={handleCreateProject} open={isCreateOpen} />
    </div>
  )
}
