import { useMemo, useState } from 'react'
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, closestCorners, useSensor, useSensors } from '@dnd-kit/core'
import { RotateCcw, Search, Plus } from 'lucide-react'
import Button from '../components/common/Button.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import KanbanColumn from '../components/tasks/KanbanColumn.jsx'
import KanbanTaskCard from '../components/tasks/KanbanTaskCard.jsx'
import TaskModal from '../components/tasks/TaskModal.jsx'
import useApp from '../hooks/useApp.js'

const columns = [
  { id: 'todo', title: 'To Do' },
  { id: 'inProgress', title: 'In Progress' },
  { id: 'inReview', title: 'In Review' },
  { id: 'completed', title: 'Completed' },
]

export default function Kanban() {
  const { projects, tasks, addTask, updateTask, deleteTask, showToast } = useApp()
  const [query, setQuery] = useState('')
  const [projectId, setProjectId] = useState('all')
  const [priority, setPriority] = useState('all')
  const [open, setOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [defaultStatus, setDefaultStatus] = useState('todo')
  const [activeTaskId, setActiveTaskId] = useState(null)
  const projectNames = useMemo(() => new Map(projects.map(project => [project.id, project.name])), [projects])
  const filteredTasks = useMemo(() => tasks.filter(task => (
    (projectId === 'all' || task.projectId === projectId)
    && (priority === 'all' || task.priority === priority)
    && `${task.title} ${task.description}`.toLowerCase().includes(query.toLowerCase())
  )), [tasks, projectId, priority, query])
  const activeTask = tasks.find(task => task.id === activeTaskId)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor))

  function openCreate(status = 'todo') { setEditingTask(null); setDefaultStatus(status); setOpen(true) }
  function saveTask(data) {
    try {
      if (editingTask) updateTask(editingTask.id, data)
      else addTask(data)
      showToast(editingTask ? 'Task updated.' : 'Task created.')
    } catch (error) { showToast(error.message || 'Task could not be saved.', 'error'); throw error }
  }
  function removeTask(task) {
    if (!window.confirm(`Delete task “${task.title}”?`)) return
    deleteTask(task.id)
    showToast('Task deleted.')
  }
  function onDragEnd(event) {
    setActiveTaskId(null)
    const { active, over } = event
    if (!over) return
    const task = tasks.find(item => item.id === active.id)
    const status = over.data.current?.status || columns.find(column => column.id === over.id)?.id
    if (!task || !columns.some(column => column.id === status) || task.status === status) return
    updateTask(task.id, { ...task, status })
    showToast(`Task moved to ${columns.find(column => column.id === status).title}.`)
  }
  function clearFilters() { setQuery(''); setProjectId('all'); setPriority('all') }

  return <div className="fb-management-page fb-kanban-page">
    <div className="fb-page-heading"><div><p className="fb-eyebrow">Workspace</p><h1>Kanban board</h1><p>Move work through each stage. Changes save to your workspace automatically.</p></div><Button onClick={() => openCreate()} variant="primary"><Plus/>New task</Button></div>
    <div className="fb-kanban-toolbar">
      <label className="fb-search"><Search aria-hidden="true" className="fb-search__icon"/><input aria-label="Search board tasks" className="form-control" onChange={event => setQuery(event.target.value)} placeholder="Search tasks" value={query}/></label>
      <select aria-label="Filter by project" className="fb-filter-select" onChange={event => setProjectId(event.target.value)} value={projectId}><option value="all">All projects</option>{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select>
      <select aria-label="Filter by priority" className="fb-filter-select" onChange={event => setPriority(event.target.value)} value={priority}><option value="all">All priorities</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select>
      <Button onClick={clearFilters}><RotateCcw/>Clear filters</Button>
    </div>
    {tasks.length === 0 ? <EmptyState title="No tasks on the board" description="Create a task and it will appear in its status column." action={projects.length > 0 && <Button onClick={() => openCreate()} variant="primary"><Plus/>Create task</Button>}/> : <DndContext collisionDetection={closestCorners} onDragCancel={() => setActiveTaskId(null)} onDragEnd={onDragEnd} onDragStart={({ active }) => setActiveTaskId(active.id)} sensors={sensors}>
      <div className="fb-kanban-board">{columns.map(column => <KanbanColumn id={column.id} key={column.id} onAdd={openCreate} onDelete={removeTask} onEdit={task => { setEditingTask(task); setOpen(true) }} projectNames={projectNames} tasks={filteredTasks.filter(task => task.status === column.id)} title={column.title}/>)}</div>
      <DragOverlay>{activeTask ? <KanbanTaskCard onDelete={removeTask} onEdit={task => { setEditingTask(task); setOpen(true) }} overlay projectName={projectNames.get(activeTask.projectId)} task={activeTask}/> : null}</DragOverlay>
    </DndContext>}
    {tasks.length > 0 && filteredTasks.length === 0 && <EmptyState title="No matching tasks" description="Adjust or clear the project, priority, or search filters."/>}
    <TaskModal defaultStatus={defaultStatus} open={open} onClose={() => setOpen(false)} onSave={saveTask} projects={projects} task={editingTask}/>
  </div>
}
