import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import Button from '../components/common/Button.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import TaskList from '../components/tasks/TaskList.jsx'
import TaskModal from '../components/tasks/TaskModal.jsx'
import useApp from '../hooks/useApp.js'

export default function Tasks() {
  const { projects, tasks, addTask, updateTask, deleteTask, showToast } = useApp()
  const [query, setQuery] = useState(''); const [projectId, setProjectId] = useState('all'); const [status, setStatus] = useState('all'); const [priority, setPriority] = useState('all')
  const [open, setOpen] = useState(false); const [editing, setEditing] = useState(null)
  const filtered = useMemo(() => tasks.filter(task => (
    (projectId === 'all' || task.projectId === projectId)
    && (status === 'all' || task.status === status)
    && (priority === 'all' || task.priority === priority)
    && `${task.title} ${task.description} ${task.assignee}`.toLowerCase().includes(query.toLowerCase())
  )), [tasks, projectId, status, priority, query])
  function save(data) { try { if (editing) updateTask(editing.id, data); else addTask(data); showToast(editing ? 'Task updated.' : 'Task created.') } catch(e) { showToast(e.message, 'error'); throw e } }
  function remove(task) { if (!window.confirm(`Delete task “${task.title}”?`)) return; deleteTask(task.id); showToast('Task deleted.') }
  return <div className="fb-management-page"><div className="fb-page-heading"><div><p className="fb-eyebrow">Workspace</p><h1>Tasks</h1><p>Search, filter, and manage tasks across your projects.</p></div><Button onClick={() => { setEditing(null); setOpen(true) }} variant="primary"><Plus/>New task</Button></div>
    <div className="fb-task-filters"><label className="fb-search"><Search className="fb-search__icon"/><input aria-label="Search tasks" className="form-control" onChange={e => setQuery(e.target.value)} placeholder="Search tasks" value={query}/></label>
      <label><span className="visually-hidden">Filter by project</span><select aria-label="Filter by project" className="fb-filter-select" onChange={e => setProjectId(e.target.value)} value={projectId}><option value="all">All projects</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <label><span className="visually-hidden">Filter by status</span><select aria-label="Filter by status" className="fb-filter-select" onChange={e => setStatus(e.target.value)} value={status}><option value="all">All statuses</option><option value="todo">To Do</option><option value="inProgress">In Progress</option><option value="inReview">In Review</option><option value="completed">Completed</option></select></label>
      <label><span className="visually-hidden">Filter by priority</span><select aria-label="Filter by priority" className="fb-filter-select" onChange={e => setPriority(e.target.value)} value={priority}><option value="all">All priorities</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
      <span className="fb-task-filter-count">{filtered.length} task{filtered.length === 1 ? '' : 's'}</span>
    </div>
    {tasks.length ? <TaskList tasks={filtered} projects={projects} onEdit={task => { setEditing(task); setOpen(true) }} onDelete={remove}/> : <EmptyState title="No tasks yet" description="Add a task to one of your projects to get started." action={projects.length > 0 && <Button onClick={() => setOpen(true)} variant="primary"><Plus/>Create task</Button>}/>}
    {tasks.length > 0 && filtered.length === 0 && <EmptyState title="No matching tasks" description="Try changing the search or filters."/>}
    <TaskModal open={open} onClose={() => setOpen(false)} onSave={save} projects={projects} task={editing}/>
  </div>
}
