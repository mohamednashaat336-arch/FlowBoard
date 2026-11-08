import { useState } from 'react'
import { Plus } from 'lucide-react'
import Button from '../common/Button.jsx'
import Modal from '../common/Modal.jsx'

export default function ProjectModal({ open, onClose, onSave, project }) {
  const [error, setError] = useState('')
  function submit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    try {
      onSave({ name: form.get('name'), description: form.get('description'), startDate: form.get('startDate'), dueDate: form.get('dueDate'), status: form.get('status') })
      onClose()
    } catch (e) { setError(e.message || 'Could not save project.') }
  }
  return <Modal open={open} onClose={onClose} title={project ? 'Edit project' : 'Create project'}>
    <form className="fb-project-form" key={`${open}-${project?.id || 'new'}`} onSubmit={submit}>
      <label className="fb-form-field"><span>Project name</span><input autoComplete="off" defaultValue={project?.name || ''} maxLength={80} minLength={2} name="name" required /></label>
      <label className="fb-form-field"><span>Description <small>Optional</small></span><textarea defaultValue={project?.description || ''} maxLength={240} name="description" rows={3} /></label>
      <div className="row g-3"><div className="col-12 col-sm-6"><label className="fb-form-field"><span>Start date</span><input defaultValue={project?.startDate || ''} name="startDate" type="date" /></label></div><div className="col-12 col-sm-6"><label className="fb-form-field"><span>Due date</span><input defaultValue={project?.dueDate || ''} name="dueDate" type="date" /></label></div></div>
      <label className="fb-form-field"><span>Status</span><select defaultValue={project?.status || 'active'} name="status"><option value="active">Active</option><option value="onHold">On hold</option><option value="completed">Completed</option></select></label>
      {error && <p className="fb-form-error" role="alert">{error}</p>}
      <div className="fb-dialog__footer"><Button onClick={onClose}>Cancel</Button><Button type="submit" variant="primary"><Plus aria-hidden="true" />{project ? 'Save changes' : 'Create project'}</Button></div>
    </form>
  </Modal>
}
