import { useMemo } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CheckCheck, CircleDashed, ClockAlert, FolderKanban, ListTodo, Percent } from 'lucide-react'
import EmptyState from '../components/common/EmptyState.jsx'
import StatsCard from '../components/dashboard/StatsCard.jsx'
import useApp from '../hooks/useApp.js'
import { localDateKey, sessionDate, shortDate, startOfWeek } from '../utils/date.js'

const statusItems = [{ id: 'todo', name: 'To Do' }, { id: 'inProgress', name: 'In Progress' }, { id: 'inReview', name: 'In Review' }, { id: 'completed', name: 'Completed' }]
const priorityItems = [{ id: 'low', name: 'Low' }, { id: 'medium', name: 'Medium' }, { id: 'high', name: 'High' }, { id: 'urgent', name: 'Urgent' }]
const chartColors = ['var(--color-muted)', 'var(--color-primary)', 'color-mix(in srgb, var(--color-primary) 55%, var(--color-muted))', 'var(--color-danger)']

function ChartPanel({ title, description, children }) {
  return <section className="fb-panel fb-analytics-panel"><div className="fb-section-heading"><div><h2>{title}</h2><p>{description}</p></div></div>{children}</section>
}

function ChartEmpty({ message }) { return <div className="fb-analytics-empty"><EmptyState title="Not enough data yet" description={message}/></div> }

export default function Analytics() {
  const { projects, tasks } = useApp()
  const todayKey = localDateKey(sessionDate)
  const stats = useMemo(() => {
    const completed = tasks.filter(task => task.status === 'completed').length
    const inProgress = tasks.filter(task => task.status === 'inProgress').length
    const overdue = tasks.filter(task => task.status !== 'completed' && task.dueDate && task.dueDate < todayKey).length
    const rate = tasks.length ? Math.round(completed / tasks.length * 100) : 0
    return [
      { label: 'Total projects', value: projects.length, detail: `${projects.filter(project => project.status === 'active').length} active`, Icon: FolderKanban },
      { label: 'Total tasks', value: tasks.length, detail: 'Across your workspace', Icon: ListTodo },
      { label: 'Completed tasks', value: completed, detail: `${rate}% completion rate`, Icon: CheckCheck },
      { label: 'In progress', value: inProgress, detail: 'Currently being worked on', Icon: CircleDashed },
      { label: 'Overdue tasks', value: overdue, detail: 'Past due and not completed', Icon: ClockAlert },
      { label: 'Task completion rate', value: `${rate}%`, detail: tasks.length ? `${completed} of ${tasks.length} tasks` : 'No tasks yet', Icon: Percent },
    ]
  }, [projects, tasks, todayKey])
  const statusData = useMemo(() => statusItems.map(item => ({ ...item, count: tasks.filter(task => task.status === item.id).length })), [tasks])
  const priorityData = useMemo(() => priorityItems.map(item => ({ ...item, count: tasks.filter(task => task.priority === item.id).length })), [tasks])
  const projectProgress = useMemo(() => projects.map(project => {
    const related = tasks.filter(task => task.projectId === project.id)
    const complete = related.filter(task => task.status === 'completed').length
    return { name: project.name, progress: related.length ? Math.round(complete / related.length * 100) : 0 }
  }), [projects, tasks])
  const activity = useMemo(() => {
    const currentWeek = startOfWeek(sessionDate)
    const weeks = Array.from({ length: 6 }, (_, index) => {
      const start = new Date(currentWeek)
      start.setDate(start.getDate() - (5 - index) * 7)
      return { key: localDateKey(start), label: shortDate(start), created: 0, completed: 0 }
    })
    for (const task of tasks) {
      for (const [field, value] of [['created', task.createdAt], ['completed', task.completedAt]]) {
        if (typeof value !== 'string' || !value) continue
        const date = new Date(value)
        if (Number.isNaN(date.getTime())) continue
        const week = weeks.find(item => item.key === localDateKey(startOfWeek(date)))
        if (week) week[field] += 1
      }
    }
    return weeks
  }, [tasks])
  const hasActivity = activity.some(item => item.created || item.completed)

  return <div className="fb-management-page fb-analytics-page">
    <div className="fb-page-heading"><div><p className="fb-eyebrow">Workspace</p><h1>Analytics</h1><p>Live project and task metrics from your workspace data.</p></div><span className="fb-data-tag">Workspace data</span></div>
    <section aria-label="Workspace statistics" className="row g-3">{stats.map(stat => <div className="col-12 col-sm-6 col-xl-4" key={stat.label}><StatsCard {...stat}/></div>)}</section>
    <div className="row g-3">
      <div className="col-12 col-xl-6"><ChartPanel description="Tasks grouped by their current workflow status." title="Task status distribution">{tasks.length ? <><div className="fb-analytics-chart"><ResponsiveContainer height="100%" width="100%"><PieChart><Tooltip contentStyle={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}/><Pie data={statusData} dataKey="count" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={2}>{statusData.map((item, index) => <Cell fill={chartColors[index]} key={item.id}/>)}</Pie></PieChart></ResponsiveContainer></div><div className="fb-analytics-legend">{statusData.map((item, index) => <span key={item.id}><i style={{ background: chartColors[index] }}/>{item.name}<strong>{item.count}</strong></span>)}</div></> : <ChartEmpty message="Task status information will appear once tasks are added."/>}</ChartPanel></div>
      <div className="col-12 col-xl-6"><ChartPanel description="Current task volume by priority." title="Task priority distribution">{tasks.length ? <><div className="fb-analytics-chart"><ResponsiveContainer height="100%" width="100%"><PieChart><Tooltip contentStyle={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}/><Pie data={priorityData} dataKey="count" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={2}>{priorityData.map((item, index) => <Cell fill={chartColors[index]} key={item.id}/>)}</Pie></PieChart></ResponsiveContainer></div><div className="fb-analytics-legend">{priorityData.map((item, index) => <span key={item.id}><i style={{ background: chartColors[index] }}/>{item.name}<strong>{item.count}</strong></span>)}</div></> : <ChartEmpty message="Task priority information will appear once tasks are added."/>}</ChartPanel></div>
      <div className="col-12 col-xl-6"><ChartPanel description="Completed tasks divided by total tasks in each project." title="Project progress">{projects.length ? <div className="fb-analytics-chart fb-analytics-chart--wide"><ResponsiveContainer height="100%" width="100%"><BarChart data={projectProgress} layout="vertical" margin={{ top: 4, right: 14, left: 8, bottom: 4 }}><CartesianGrid stroke="var(--color-border)" strokeDasharray="3 5" horizontal={false}/><XAxis type="number" domain={[0, 100]} tick={{ fill: 'var(--color-muted)', fontSize: 11 }} unit="%"/><YAxis dataKey="name" type="category" width={100} tick={{ fill: 'var(--color-muted)', fontSize: 10 }}/><Tooltip formatter={value => [`${value}%`, 'Complete']} contentStyle={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}/><Bar dataKey="progress" fill="var(--color-primary)" maxBarSize={18} radius={[0, 4, 4, 0]}/></BarChart></ResponsiveContainer></div> : <ChartEmpty message="Create a project to compare progress."/>}</ChartPanel></div>
      <div className="col-12 col-xl-6"><ChartPanel description="Task creation and completion events recorded in the last six weeks." title="Task activity">{hasActivity ? <div className="fb-analytics-chart fb-analytics-chart--wide"><ResponsiveContainer height="100%" width="100%"><AreaChart data={activity} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}><CartesianGrid stroke="var(--color-border)" strokeDasharray="3 5" vertical={false}/><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-muted)', fontSize: 10 }}/><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: 'var(--color-muted)', fontSize: 10 }}/><Tooltip contentStyle={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}/><Area dataKey="created" fill="var(--color-primary-soft)" isAnimationActive={false} name="Created" stroke="var(--color-primary)" type="monotone"/><Area dataKey="completed" fill="transparent" isAnimationActive={false} name="Completed" stroke="var(--color-muted)" strokeDasharray="4 4" type="monotone"/></AreaChart></ResponsiveContainer></div> : <ChartEmpty message="No task creation or completion dates fall within the last six weeks. No sample history is shown."/>}</ChartPanel></div>
    </div>
  </div>
}
