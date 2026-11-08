import { useState } from 'react'
import { Plus } from 'lucide-react'
import useApp from '../../hooks/useApp.js'
import Button from '../common/Button.jsx'
import Modal from '../common/Modal.jsx'

export default function TaskModal({ open, onClose, onSave, task, projects, defaultProjectId, defaultDueDate, defaultStatus }) {
  const { teamMembers = [] } = useApp()
  const [error, setError] = useState('')
  function submit(event) {
    event.preventDefault(); const f = new FormData(event.currentTarget)
    try { onSave({ title: f.get('title'), description: f.get('description'), projectId: f.get('projectId'), status: f.get('status'), priority: f.get('priority'), dueDate: f.get('dueDate'), assignee: f.get('assignee') }); onClose() }
    catch (e) { setError(e.message || 'Could not save task.') }
  }
  return <Modal open={open} onClose={onClose} title={task ? 'Edit task' : 'Create task'}>
    <form className="fb-project-form" key={`${open}-${task?.id || defaultProjectId || 'new'}-${defaultDueDate || ''}-${defaultStatus || ''}`} onSubmit={submit}>
      <label className="fb-form-field"><span>Task title</span><input defaultValue={task?.title || ''} maxLength={160} minLength={2} name="title" required /></label>
      <label className="fb-form-field"><span>Description <small>Optional</small></span><textarea defaultValue={task?.description || ''} maxLength={500} name="description" rows={3} /></label>
      <label className="fb-form-field"><span>Project</span><select defaultValue={task?.projectId || defaultProjectId || projects[0]?.id || ''} name="projectId" required>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <div className="row g-3"><div className="col-12 col-sm-6"><label className="fb-form-field"><span>Status</span><select defaultValue={task?.status || defaultStatus || 'todo'} name="status"><option value="todo">To Do</option><option value="inProgress">In Progress</option><option value="inReview">In Review</option><option value="completed">Completed</option></select></label></div><div className="col-12 col-sm-6"><label className="fb-form-field"><span>Priority</span><select defaultValue={task?.priority || 'medium'} name="priority"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></label></div></div>
      <div className="row g-3"><div className="col-12 col-sm-6"><label className="fb-form-field"><span>Due date</span><input defaultValue={task?.dueDate || defaultDueDate || ''} name="dueDate" type="date" /></label></div><div className="col-12 col-sm-6"><label className="fb-form-field"><span>Assignee</span><select defaultValue={task?.assignee || ''} name="assignee"><option value="">Unassigned</option>{task?.assignee && !teamMembers.some(member => member.name === task.assignee) && <option value={task.assignee}>{task.assignee}</option>}{teamMembers.map(member => <option key={member.id} value={member.name}>{member.name} ({member.role})</option>)}</select></label></div></div>
      {error && <p className="fb-form-error" role="alert">{error}</p>}
      <div className="fb-dialog__footer"><Button onClick={onClose}>Cancel</Button><Button type="submit" variant="primary"><Plus aria-hidden="true" />{task ? 'Save changes' : 'Create task'}</Button></div>
    </form>
  </Modal>
}
