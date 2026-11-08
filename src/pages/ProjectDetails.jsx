import { useMemo, useState } from 'react'
import { ArrowLeft, Pencil, Plus, Trash2, ShieldCheck } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Button from '../components/common/Button.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import ProjectModal from '../components/projects/ProjectModal.jsx'
import TaskList from '../components/tasks/TaskList.jsx'
import TaskModal from '../components/tasks/TaskModal.jsx'
import useApp from '../hooks/useApp.js'
import { formatDate } from '../utils/date.js'

export default function ProjectDetails() {
  const { projectId } = useParams(); const navigate = useNavigate()
  const {
    projects, tasks, updateProject, deleteProject, addTask, updateTask, deleteTask,
    showToast, updateProjectAuthorization, updateProjectTaskEditorAuthorization, teamMembers, permissions, currentUser: user,
  } = useApp()
  const project = projects.find(p => p.id === projectId)
  const projectTasks = useMemo(() => tasks.filter(t => t.projectId === projectId), [tasks, projectId])
  const [projectOpen, setProjectOpen] = useState(false); const [taskOpen, setTaskOpen] = useState(false); const [editingTask, setEditingTask] = useState(null)
  const [authOpen, setAuthOpen] = useState(false)

  if (!project) return <div className="fb-not-found"><EmptyState title="Project not found" description="This project may have been deleted or the URL is invalid." action={<Link className="fb-text-link" to="/projects">Back to projects</Link>}/></div>

  const completed = projectTasks.filter(t => t.status === 'completed').length
  const progress = projectTasks.length ? Math.round(completed / projectTasks.length * 100) : 0

  const canEdit = permissions.canEditProject
  const canDelete = permissions.canDeleteProject
  const activeIds = teamMembers.filter(m => (m.status || '').toLowerCase() === 'active').flatMap(m => [m.userId, m.id].filter(Boolean))
  const canAddTask = permissions.canCreateTaskInProject(user?.id, project, activeIds)
  const isCreator = Boolean(project?.ownerId && user?.id && project.ownerId === user.id)
  const canManageAuth = permissions.isOwner || permissions.isAdmin || isCreator

  function saveProject(data) { try { updateProject(project.id, data); showToast('Project updated.') } catch(e) { showToast(e.message, 'error'); throw e } }
  function removeProject() { const n = projectTasks.length; if (!window.confirm(`Delete "${project.name}"? Its ${n} associated task${n === 1 ? '' : 's'} will also be permanently deleted.`)) return; deleteProject(project.id); showToast('Project and associated tasks deleted.'); navigate('/projects') }
  function saveTask(data) { try { if (editingTask) updateTask(editingTask.id, data); else addTask(data); showToast(editingTask ? 'Task updated.' : 'Task created.') } catch(e) { showToast(e.message, 'error'); throw e } }
  function removeTask(task) {
    if (!window.confirm(`Delete task "${task.title}"?`)) return
    try {
      deleteTask(task.id)
      showToast('Task deleted.')
    } catch (e) {
      showToast(e.message, 'error')
    }
  }

  const authorizedIds = new Set(Array.isArray(project.authorizedMemberIds) ? project.authorizedMemberIds : [])
  const authorizedEditorIds = new Set(Array.isArray(project.authorizedTaskEditorIds) ? project.authorizedTaskEditorIds : [])
  const eligibleMembers = teamMembers.filter(m => {
    const status = (m.status || '').toLowerCase()
    const memberUserId = m.userId || m.id
    return (
      status === 'active' &&
      m.role !== 'owner' && m.role !== 'admin' &&
      memberUserId !== project.ownerId
    )
  })

  function toggleAuth(memberId, currentlyGranted) {
    try {
      updateProjectAuthorization(projectId, memberId, !currentlyGranted)
      showToast(currentlyGranted ? 'Permission revoked.' : 'Permission granted.')
    } catch(e) { showToast(e.message, 'error') }
  }

  function toggleEditorAuth(memberId, currentlyGranted) {
    try {
      updateProjectTaskEditorAuthorization(projectId, memberId, !currentlyGranted)
      showToast(currentlyGranted ? 'Edit permission revoked.' : 'Edit permission granted.')
    } catch(e) { showToast(e.message, 'error') }
  }

  return <div className="fb-management-page"><Link className="fb-back-link" to="/projects"><ArrowLeft/>All projects</Link>
    <section className="fb-project-detail-hero"><div className="fb-project-detail-hero__title"><span className="fb-project-color" style={{background: project.color}}/><div><p className="fb-eyebrow">Project details</p><h1>{project.name}</h1><p>{project.description || 'No description provided.'}</p></div></div><div className="fb-project-detail-hero__actions">
      {canEdit && <Button onClick={() => setProjectOpen(true)}><Pencil/>Edit</Button>}
      {canDelete && <Button onClick={removeProject}><Trash2/>Delete</Button>}
      {canAddTask && <Button onClick={() => {setEditingTask(null); setTaskOpen(true)}} variant="primary"><Plus/>Add task</Button>}
    </div>
      <div className="fb-project-info"><span className={`fb-status fb-status--${project.status}`}>{project.status === 'onHold' ? 'On hold' : project.status === 'completed' ? 'Completed' : 'Active'}</span><span>Starts {project.startDate ? formatDate(project.startDate) : 'Not set'}</span><span>Due {project.dueDate ? formatDate(project.dueDate) : 'Not set'}</span><span>{new Set(projectTasks.map(t => t.assignee).filter(Boolean)).size} team members</span></div>
      <div className="fb-project-progress-summary"><div><span>Progress</span><strong>{progress}%</strong></div><span>{completed} completed of {projectTasks.length} tasks</span><div className="fb-progress-track"><span style={{width:`${progress}%`}}/></div></div>
    </section>

    {canManageAuth && (
      <section className="fb-project-auth-section">
        <div className="fb-section-heading">
          <div>
            <h2><ShieldCheck size={18} style={{marginRight: '0.4rem', verticalAlign: 'middle'}}/>Task Creation Permissions</h2>
            <p>Owner and Admin always have access. Grant or revoke task creation for Members in this project.</p>
          </div>
          <Button onClick={() => setAuthOpen(o => !o)} variant="secondary">
            {authOpen ? 'Hide' : 'Manage'}
          </Button>
        </div>
        {authOpen && (
          eligibleMembers.length === 0
            ? <p className="fb-auth-empty">No Members or Viewers to manage. Invite team members first.</p>
            : <div className="fb-auth-list">
                {eligibleMembers.map(member => {
                  const granted = authorizedIds.has(member.id) || member.id === project.ownerId
                  return (
                    <div key={member.id} className={`fb-auth-row ${granted ? 'fb-auth-row--granted' : ''}`}>
                      <div className="fb-auth-row__info">
                        <span className="fb-auth-row__name">{member.name}</span>
                        <span className="fb-auth-row__email">{member.email}</span>
                        <span className={`fb-role-badge fb-role-badge--${member.role}`}>{member.role}</span>
                        {member.role === 'viewer' && <span className="fb-auth-note">Viewers are always read-only</span>}
                      </div>
                      <div className="fb-auth-row__action">
                        {member.role === 'viewer'
                          ? <span className="fb-auth-status fb-auth-status--denied">Read-only</span>
                          : granted
                            ? <><span className="fb-auth-status fb-auth-status--granted">Authorized</span><button className="fb-auth-btn fb-auth-btn--revoke" onClick={() => toggleAuth(member.id, true)} type="button">Revoke</button></>
                            : <><span className="fb-auth-status fb-auth-status--denied">Not authorized</span><button className="fb-auth-btn fb-auth-btn--grant" onClick={() => toggleAuth(member.id, false)} type="button">Grant</button></>
                        }
                      </div>
                    </div>
                  )
                })}
              </div>
        )}
      </section>
    )}

    {canManageAuth && (
      <section className="fb-project-auth-section" aria-label="Task Editing Permissions">
        <div className="fb-section-heading">
          <div>
            <h2><ShieldCheck size={18} style={{marginRight: '0.4rem', verticalAlign: 'middle'}}/>Task Editing Permissions</h2>
            <p>Grant or revoke task editing permissions for active team members in this project. Project creator, Owner, and Admin always have edit access.</p>
          </div>
        </div>
        {eligibleMembers.length === 0 ? (
          <p className="fb-auth-empty">No active team members eligible for task editing permissions.</p>
        ) : (
          <div className="fb-auth-list">
            {eligibleMembers.map(member => {
              const memberUserId = member.userId || member.id
              const granted = authorizedEditorIds.has(memberUserId) || authorizedEditorIds.has(member.id)
              return (
                <div key={member.id} className={`fb-auth-row ${granted ? 'fb-auth-row--granted' : ''}`}>
                  <div className="fb-auth-row__info">
                    <span className="fb-auth-row__name">{member.name}</span>
                    <span className="fb-auth-row__email">{member.email}</span>
                    <span className={`fb-role-badge fb-role-badge--${member.role}`}>{member.role}</span>
                    {member.role === 'viewer' && <span className="fb-auth-note">Viewers are always read-only</span>}
                  </div>
                  <div className="fb-auth-row__action">
                    {member.role === 'viewer' ? (
                      <span className="fb-auth-status fb-auth-status--denied">Read-only</span>
                    ) : granted ? (
                      <>
                        <span className="fb-auth-status fb-auth-status--granted">Authorized</span>
                        <button className="fb-auth-btn fb-auth-btn--revoke" onClick={() => toggleEditorAuth(memberUserId, true)} type="button">Revoke</button>
                      </>
                    ) : (
                      <>
                        <span className="fb-auth-status fb-auth-status--denied">Not authorized</span>
                        <button className="fb-auth-btn fb-auth-btn--grant" onClick={() => toggleEditorAuth(memberUserId, false)} type="button">Grant</button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    )}

    <section className="fb-detail-tasks"><div className="fb-section-heading"><div><h2>Project tasks</h2><p>Tasks linked to this project</p></div>{canAddTask && <Button onClick={() => {setEditingTask(null); setTaskOpen(true)}} variant="secondary"><Plus/>Add task</Button>}</div><TaskList tasks={projectTasks} projects={projects} onEdit={task => {setEditingTask(task); setTaskOpen(true)}} onDelete={removeTask}/></section>
    <ProjectModal open={projectOpen} onClose={() => setProjectOpen(false)} onSave={saveProject} project={project}/><TaskModal defaultProjectId={project.id} open={taskOpen} onClose={() => setTaskOpen(false)} onSave={saveTask} projects={projects} task={editingTask}/>
  </div>
}
