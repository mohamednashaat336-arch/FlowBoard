import { useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import Button from '../components/common/Button.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import TaskModal from '../components/tasks/TaskModal.jsx'
import useApp from '../hooks/useApp.js'
import { formatDate, localDateKey, sessionDate, shortDate, startOfWeek } from '../utils/date.js'

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const viewOptions = [
  { id: 'month', label: 'Month' },
  { id: 'week', label: 'Week' },
  { id: 'upcoming', label: 'Upcoming' },
]

function atNoon(date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12) }
function monthTitle(date) { return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(date) }
function weekTitle(days) { return `${shortDate(days[0])} – ${shortDate(days[6])}, ${days[6].getFullYear()}` }

export default function Calendar() {
  const { projects, tasks, addTask, updateTask, showToast } = useApp()
  const todayKey = localDateKey(sessionDate)
  const [anchor, setAnchor] = useState(() => atNoon(sessionDate))
  const [selectedDate, setSelectedDate] = useState(todayKey)
  const [view, setView] = useState('month')
  const [open, setOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [defaultDueDate, setDefaultDueDate] = useState(todayKey)
  const projectNames = useMemo(() => new Map(projects.map(project => [project.id, project.name])), [projects])
  const calendarTasks = useMemo(() => tasks.filter(task => /^\d{4}-\d{2}-\d{2}$/.test(task.dueDate || '') && !Number.isNaN(Date.parse(`${task.dueDate}T12:00:00`))).sort((a, b) => a.dueDate.localeCompare(b.dueDate)), [tasks])
  const tasksByDate = useMemo(() => {
    const grouped = new Map()
    for (const task of calendarTasks) grouped.set(task.dueDate, [...(grouped.get(task.dueDate) || []), task])
    return grouped
  }, [calendarTasks])
  const monthDays = useMemo(() => {
    const first = startOfWeek(new Date(anchor.getFullYear(), anchor.getMonth(), 1, 12))
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(first)
      day.setDate(first.getDate() + index)
      return atNoon(day)
    })
  }, [anchor])
  const weekDays = useMemo(() => {
    const first = startOfWeek(anchor)
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(first)
      day.setDate(first.getDate() + index)
      return atNoon(day)
    })
  }, [anchor])
  const selectedTasks = tasksByDate.get(selectedDate) || []

  function goToday() { const today = atNoon(new Date()); setAnchor(today); setSelectedDate(localDateKey(today)) }
  function move(direction) {
    const next = atNoon(anchor)
    if (view === 'week') next.setDate(next.getDate() + direction * 7)
    else { next.setDate(1); next.setMonth(next.getMonth() + direction) }
    setAnchor(next)
    setSelectedDate(localDateKey(next))
  }
  function openCreate(dateKey = selectedDate) { setEditingTask(null); setDefaultDueDate(dateKey); setOpen(true) }
  function saveTask(data) {
    try {
      if (editingTask) updateTask(editingTask.id, data)
      else addTask(data)
      showToast(editingTask ? 'Task updated.' : 'Task created.')
    } catch (error) { showToast(error.message || 'Task could not be saved.', 'error'); throw error }
  }
  function editTask(task) { setEditingTask(task); setOpen(true) }
  function taskChip(task) { return <button className={`fb-calendar-event${task.dueDate < todayKey && task.status !== 'completed' ? ' is-overdue' : ''}`} key={task.id} onClick={() => editTask(task)} title={`${task.title} · ${task.priority}${task.dueDate < todayKey && task.status !== 'completed' ? ' · Overdue' : ''}`} type="button"><span className={`fb-calendar-event__priority priority-${task.priority}`}/><span>{task.title}</span></button> }
  function renderDayCell(day, outsideMonth = false) {
    const key = localDateKey(day)
    const dayTasks = tasksByDate.get(key) || []
    return <div aria-label={`Calendar date ${formatDate(key)}`} className={`fb-calendar-day${outsideMonth ? ' is-outside' : ''}${key === todayKey ? ' is-today' : ''}${key === selectedDate ? ' is-selected' : ''}`} key={key} onClick={() => setSelectedDate(key)} role="group">
      <div className="fb-calendar-day__top"><button aria-label={`Select ${formatDate(key)}`} className="fb-calendar-day__number" onClick={event => { event.stopPropagation(); setSelectedDate(key) }} type="button">{day.getDate()}</button><button aria-label={`Create task due ${formatDate(key)}`} className="fb-calendar-day__add" onClick={event => { event.stopPropagation(); setSelectedDate(key); openCreate(key) }} type="button"><Plus/></button></div>
      <div className="fb-calendar-day__events">{dayTasks.slice(0, 3).map(taskChip)}{dayTasks.length > 3 && <span className="fb-calendar-day__more">+{dayTasks.length - 3} more</span>}</div>
    </div>
  }

  return <div className="fb-management-page fb-calendar-page">
    <div className="fb-page-heading"><div><p className="fb-eyebrow">Workspace</p><h1>Calendar</h1><p>Due dates across your projects.</p></div><Button onClick={() => openCreate(selectedDate)} variant="primary"><Plus/>New task</Button></div>
    <div className="fb-calendar-toolbar"><div className="fb-calendar-navigation">{view !== 'upcoming' && <Button aria-label="Previous period" onClick={() => move(-1)}><ChevronLeft/></Button>}<h2>{view === 'month' ? monthTitle(anchor) : view === 'week' ? weekTitle(weekDays) : 'Tasks with due dates'}</h2>{view !== 'upcoming' && <Button aria-label="Next period" onClick={() => move(1)}><ChevronRight/></Button>}{view !== 'upcoming' && <Button onClick={goToday}>Today</Button>}</div><div aria-label="Calendar view" className="fb-calendar-views" role="group">{viewOptions.map(option => <button aria-pressed={view === option.id} className={view === option.id ? 'is-active' : ''} key={option.id} onClick={() => setView(option.id)} type="button">{option.label}</button>)}</div></div>
    {calendarTasks.length === 0 ? <EmptyState Icon={CalendarDays} title="No scheduled tasks" description="Tasks appear here when they have a due date. Add a task to this date to get started." action={projects.length > 0 && <Button onClick={() => openCreate(selectedDate)} variant="primary"><Plus/>Create task</Button>}/> : view === 'upcoming' ? <section aria-label="Upcoming and overdue tasks" className="fb-upcoming-calendar-list">{calendarTasks.map(task => <button className={`fb-upcoming-calendar-item${task.dueDate < todayKey && task.status !== 'completed' ? ' is-overdue' : ''}`} key={task.id} onClick={() => editTask(task)} type="button"><span className="fb-upcoming-calendar-item__date">{formatDate(task.dueDate)}{task.dueDate < todayKey && task.status !== 'completed' && <strong>Overdue</strong>}</span><span className={`fb-calendar-event__priority priority-${task.priority}`}/><span className="fb-upcoming-calendar-item__copy"><strong>{task.title}</strong><small>{projectNames.get(task.projectId) || 'Unknown project'}</small></span><span className={`fb-priority fb-priority--${task.priority}`}>{task.priority}</span></button>)}</section> : <>
      {view === 'month' && <div className="fb-calendar-grid fb-calendar-grid--month">{weekdays.map(day => <div className="fb-calendar-weekday" key={day}>{day}</div>)}{monthDays.map(day => renderDayCell(day, day.getMonth() !== anchor.getMonth()))}</div>}
      {view === 'week' && <div className="fb-calendar-grid fb-calendar-grid--week">{weekDays.map(day => <div className="fb-calendar-weekday" key={localDateKey(day)}>{weekdays[(day.getDay() + 6) % 7]} <span>{day.getDate()}</span></div>)}{weekDays.map(day => renderDayCell(day))}</div>}
      <section className="fb-calendar-selected"><div className="fb-section-heading"><div><h2>{selectedDate === todayKey ? 'Today' : formatDate(selectedDate)}</h2><p>{selectedTasks.length} task{selectedTasks.length === 1 ? '' : 's'} scheduled</p></div><Button onClick={() => openCreate(selectedDate)}><Plus/>Add to date</Button></div>{selectedTasks.length ? <div className="fb-upcoming-calendar-list">{selectedTasks.map(task => <button className={`fb-upcoming-calendar-item${task.dueDate < todayKey && task.status !== 'completed' ? ' is-overdue' : ''}`} key={task.id} onClick={() => editTask(task)} type="button"><span className={`fb-calendar-event__priority priority-${task.priority}`}/><span className="fb-upcoming-calendar-item__copy"><strong>{task.title}</strong><small>{projectNames.get(task.projectId) || 'Unknown project'} · {task.priority}</small></span>{task.dueDate < todayKey && task.status !== 'completed' && <strong className="fb-overdue-label">Overdue</strong>}</button>)}</div> : <p className="fb-calendar-selected__empty">No tasks scheduled for this date.</p>}</section>
    </>}
    <TaskModal defaultDueDate={defaultDueDate} open={open} onClose={() => setOpen(false)} onSave={saveTask} projects={projects} task={editingTask}/>
  </div>
}
