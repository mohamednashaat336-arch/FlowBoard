import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import Button from '../components/common/Button.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import ProjectModal from '../components/projects/ProjectModal.jsx'
import ProjectProgressCard from '../components/projects/ProjectProgressCard.jsx'
import useApp from '../hooks/useApp.js'

export default function Projects() {
  const { projects, tasks, addProject, updateProject, deleteProject, showToast } = useApp()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [modalProject, setModalProject] = useState(null)
  const [open, setOpen] = useState(false)
  const filtered = useMemo(() => projects.filter((project) => (
    (status === 'all' || project.status === status)
    && `${project.name} ${project.description}`.toLowerCase().includes(query.toLowerCase())
  )), [projects, query, status])
  function save(data) { try { const result = modalProject ? updateProject(modalProject.id, data) : addProject(data); showToast(`${result?.name || data.name} ${modalProject ? 'updated' : 'created'}.`) } catch (e) { showToast(e.message, 'error'); throw e } }
  function remove(project) { const count = tasks.filter(t => t.projectId === project.id).length; if (!window.confirm(`Delete “${project.name}”? This will permanently delete its ${count} associated task${count === 1 ? '' : 's'} too.`)) return; deleteProject(project.id); showToast('Project and associated tasks deleted.') }
  return <div className="fb-management-page">
    <div className="fb-page-heading">
      <div><p className="fb-eyebrow">Workspace</p><h1>Projects</h1><p>Organize work and keep an eye on progress.</p></div>
      <Button onClick={() => { setModalProject(null); setOpen(true) }} variant="primary"><Plus />New project</Button>
    </div>
    <div className="fb-management-toolbar">
      <label className="fb-search"><Search aria-hidden="true" className="fb-search__icon"/><input aria-label="Search projects" className="form-control" onChange={event => setQuery(event.target.value)} placeholder="Search projects" value={query}/></label>
      <label><span className="visually-hidden">Filter projects by status</span><select aria-label="Filter projects by status" className="fb-filter-select" onChange={event => setStatus(event.target.value)} value={status}><option value="all">All statuses</option><option value="active">Active</option><option value="onHold">On hold</option><option value="completed">Completed</option></select></label>
      <span>{filtered.length} project{filtered.length === 1 ? '' : 's'}</span>
    </div>
    {filtered.length ? <div className="row g-3">{filtered.map(project => <div className="col-12 col-md-6 col-xl-4" key={project.id}><ProjectProgressCard project={project} tasks={tasks.filter(task => task.projectId === project.id)} actions={<><button onClick={() => { setModalProject(project); setOpen(true) }} type="button">Edit</button><button className="is-danger" onClick={() => remove(project)} type="button">Delete</button></>} /></div>)}</div> : <EmptyState title={projects.length ? 'No projects found' : 'No projects yet'} description={projects.length ? 'Try another search or status.' : 'Create a project to begin organizing work.'} action={!projects.length && <Button onClick={() => { setModalProject(null); setOpen(true) }} variant="primary"><Plus/>Create project</Button>}/>}
    <ProjectModal open={open} onClose={() => setOpen(false)} onSave={save} project={modalProject}/>
  </div>
}
