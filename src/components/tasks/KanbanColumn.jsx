import { useDroppable } from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import KanbanTaskCard from './KanbanTaskCard.jsx'

const columnTone = { todo: 'todo', inProgress: 'progress', inReview: 'review', completed: 'completed' }
export default function KanbanColumn({ id, title, tasks, projectNames, onEdit, onDelete, onAdd }) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { status: id } })
  return <section aria-labelledby={`kanban-${id}`} className={`fb-kanban-column${isOver ? ' is-over' : ''}`} ref={setNodeRef}>
    <header className="fb-kanban-column__header"><span className={`fb-kanban-column__indicator is-${columnTone[id]}`} /><h2 id={`kanban-${id}`}>{title}</h2><span className="fb-kanban-column__count">{tasks.length}</span><button aria-label={`Add task to ${title}`} className="fb-icon-button" onClick={() => onAdd(id)} type="button"><Plus/></button></header>
    <div className="fb-kanban-column__body">{tasks.map(task => <KanbanTaskCard key={task.id} onDelete={onDelete} onEdit={onEdit} projectName={projectNames.get(task.projectId)} task={task}/>)}</div>
  </section>
}
