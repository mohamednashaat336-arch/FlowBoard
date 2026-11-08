import { useMemo, useState } from 'react'
import { Check, Mail, Plus, Search, Trash2, UserPlus, UsersRound, X } from 'lucide-react'
import Button from '../components/common/Button.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import Modal from '../components/common/Modal.jsx'
import TaskList from '../components/tasks/TaskList.jsx'
import TaskModal from '../components/tasks/TaskModal.jsx'
import useApp from '../hooks/useApp.js'
import usePermissions from '../hooks/usePermissions.js'
import { getRoleLabel, ROLES } from '../utils/permissions.js'

function initials(name = '') {
  return name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'U'
}

export default function Team() {
  const {
    currentTeam,
    teamMembers = [],
    teamInvitations = [],
    userPendingInvitations = [],
    currentTeamRole,
    projects,
    tasks,
    updateTask,
    deleteTask,
    addInvitation,
    cancelInvitation,
    acceptInvitation,
    updateMemberRole,
    removeMember,
    showToast,
  } = useApp()

  const permissions = usePermissions()
  const [activeTab, setActiveTab] = useState('members')
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selectedMember, setSelectedMember] = useState(null)
  const [editingTask, setEditingTask] = useState(null)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState(ROLES.MEMBER)
  const [inviteError, setInviteError] = useState('')

  const members = useMemo(() => {
    return teamMembers
      .filter((member) => (
        (roleFilter === 'all' || member.role === roleFilter)
        && `${member.name} ${member.email}`.toLowerCase().includes(query.toLowerCase())
      ))
      .map((member) => {
        const assigned = tasks.filter((task) => task.assignee === member.name)
        return {
          ...member,
          assigned,
          completed: assigned.filter((task) => task.status === 'completed').length,
        }
      })
  }, [teamMembers, query, roleFilter, tasks])

  const pendingInvitations = useMemo(() => {
    return teamInvitations.filter((inv) => inv.status === 'pending')
  }, [teamInvitations])

  function saveTask(data) {
    try {
      updateTask(editingTask.id, data)
      showToast('Task assignment updated.')
    } catch (error) {
      showToast(error.message || 'Task could not be saved.', 'error')
      throw error
    }
  }

  function removeTask(task) {
    if (!window.confirm(`Delete task “${task.title}”?`)) return
    deleteTask(task.id)
    showToast('Task deleted.')
  }

  function handleSendInvite(event) {
    event.preventDefault()
    setInviteError('')
    try {
      addInvitation({ email: inviteEmail, role: inviteRole })
      showToast(`Demo invitation sent to ${inviteEmail} as ${getRoleLabel(inviteRole)}.`)
      setInviteModalOpen(false)
      setInviteEmail('')
      setInviteRole(ROLES.MEMBER)
    } catch (error) {
      setInviteError(error.message || 'Could not create invitation.')
    }
  }

  function handleCancelInvite(invitationId) {
    if (!window.confirm('Cancel this pending invitation?')) return
    try {
      cancelInvitation(invitationId)
      showToast('Invitation cancelled.')
    } catch (error) {
      showToast(error.message || 'Could not cancel invitation.', 'error')
    }
  }

  function handleAcceptInvite(invitationId) {
    try {
      acceptInvitation(invitationId)
      showToast('Invitation accepted! Welcome to the team.')
    } catch (error) {
      showToast(error.message || 'Could not accept invitation.', 'error')
    }
  }

  function handleRoleChange(newRole) {
    if (!selectedMember) return
    try {
      updateMemberRole({ targetUserId: selectedMember.userId, newRole })
      setSelectedMember((prev) => (prev ? { ...prev, role: newRole } : null))
      showToast(`Role updated to ${getRoleLabel(newRole)}.`)
    } catch (error) {
      showToast(error.message || 'Could not update role.', 'error')
    }
  }

  function handleRemoveMember() {
    if (!selectedMember) return
    if (!window.confirm(`Remove ${selectedMember.name} from ${currentTeam.name}?`)) return
    try {
      removeMember({ targetUserId: selectedMember.userId })
      showToast(`${selectedMember.name} was removed from the team.`)
      setSelectedMember(null)
    } catch (error) {
      showToast(error.message || 'Could not remove member.', 'error')
    }
  }

  return (
    <div className="fb-management-page">
      <div className="fb-page-heading">
        <div>
          <p className="fb-eyebrow">Workspace Team</p>
          <h1>{currentTeam.name}</h1>
          <p>{currentTeam.description || 'Active team members and their assignments.'}</p>
        </div>
        {permissions.canInvite && (
          <Button onClick={() => setInviteModalOpen(true)} variant="primary">
            <UserPlus /> Invite member
          </Button>
        )}
      </div>

      {userPendingInvitations.length > 0 && (
        <section aria-label="Pending invitations for your account" className="fb-team-invite-banner">
          <div>
            <strong>Pending Invitation:</strong> You have an invite to join a team as <em>{userPendingInvitations[0].role}</em>.
          </div>
          <Button onClick={() => handleAcceptInvite(userPendingInvitations[0].id)} variant="primary">
            <Check /> Accept &amp; Join
          </Button>
        </section>
      )}

      {(permissions.canInvite || pendingInvitations.length > 0) && (
        <div className="fb-team-tabs" role="tablist">
          <button
            aria-selected={activeTab === 'members'}
            className={`fb-team-tab${activeTab === 'members' ? ' is-active' : ''}`}
            onClick={() => setActiveTab('members')}
            role="tab"
            type="button"
          >
            Members ({teamMembers.length})
          </button>
          <button
            aria-selected={activeTab === 'invitations'}
            className={`fb-team-tab${activeTab === 'invitations' ? ' is-active' : ''}`}
            onClick={() => setActiveTab('invitations')}
            role="tab"
            type="button"
          >
            Pending Invitations ({pendingInvitations.length})
          </button>
        </div>
      )}

      {activeTab === 'members' ? (
        <>
          <div className="fb-management-toolbar">
            <label className="fb-search">
              <Search aria-hidden="true" className="fb-search__icon" />
              <input
                aria-label="Search team members"
                className="form-control"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search team"
                value={query}
              />
            </label>
            <label>
              <span className="visually-hidden">Filter by role</span>
              <select
                aria-label="Filter by role"
                className="fb-filter-select"
                onChange={(event) => setRoleFilter(event.target.value)}
                value={roleFilter}
              >
                <option value="all">All roles</option>
                <option value={ROLES.OWNER}>Owner</option>
                <option value={ROLES.ADMIN}>Admin</option>
                <option value={ROLES.MEMBER}>Member</option>
                <option value={ROLES.VIEWER}>Viewer</option>
              </select>
            </label>
            <span>{members.length} member{members.length === 1 ? '' : 's'}</span>
          </div>

          {members.length ? (
            <div className="row g-3">
              {members.map((member) => (
                <div className="col-12 col-md-6 col-xl-4" key={member.id}>
                  <button className="fb-team-card" onClick={() => setSelectedMember(member)} type="button">
                    <span className="fb-team-card__avatar">{initials(member.name)}</span>
                    <span className="fb-team-card__identity">
                      <strong>{member.name}</strong>
                      <span className={`fb-role-badge fb-role-badge--${member.role}`}>{getRoleLabel(member.role)}</span>
                    </span>
                    <span className="fb-team-card__status">{member.status}</span>
                    <span className="fb-team-card__email">
                      <Mail /> {member.email || 'No email registered'}
                    </span>
                    <span className="fb-team-card__stats">
                      <span><strong>{member.assigned.length}</strong> assigned</span>
                      <span><strong>{member.completed}</strong> completed</span>
                    </span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              Icon={UsersRound}
              title="No team members found"
              description="Try a different name or role filter."
            />
          )}
        </>
      ) : (
        <section aria-label="Pending invitations" className="fb-invitation-list">
          {pendingInvitations.length ? (
            pendingInvitations.map((inv) => (
              <div className="fb-invitation-item" key={inv.id}>
                <div className="fb-invitation-item__info">
                  <strong>{inv.email}</strong>
                  <span>
                    Invited as <span className={`fb-role-badge fb-role-badge--${inv.role}`}>{getRoleLabel(inv.role)}</span> · Local demo invitation
                  </span>
                </div>
                <Button onClick={() => handleCancelInvite(inv.id)}>
                  <X /> Cancel
                </Button>
              </div>
            ))
          ) : (
            <EmptyState
              Icon={UsersRound}
              title="No pending invitations"
              description="Invite collaborators to your team workspace above."
            />
          )}
        </section>
      )}

      <Modal
        onClose={() => setSelectedMember(null)}
        open={Boolean(selectedMember)}
        title={selectedMember ? `${selectedMember.name} · Assigned Tasks` : 'Member details'}
      >
        {selectedMember && (
          <div className="fb-team-details">
            <p>
              <span className={`fb-role-badge fb-role-badge--${selectedMember.role}`}>
                {getRoleLabel(selectedMember.role)}
              </span>{' '}
              · {selectedMember.email || 'No email registered'}
            </p>

            {permissions.canManageMembers && selectedMember.role !== ROLES.OWNER && (
              <div className="fb-member-manage-row">
                <div className="fb-member-manage-control">
                  <label htmlFor="member-role-select">Change role:</label>
                  <select
                    id="member-role-select"
                    className="fb-filter-select"
                    onChange={(e) => handleRoleChange(e.target.value)}
                    value={selectedMember.role}
                  >
                    {permissions.isOwner && <option value={ROLES.ADMIN}>Admin</option>}
                    <option value={ROLES.MEMBER}>Member</option>
                    <option value={ROLES.VIEWER}>Viewer</option>
                  </select>
                </div>
                <Button onClick={handleRemoveMember}>
                  <Trash2 /> Remove member
                </Button>
              </div>
            )}

            {selectedMember.role === ROLES.OWNER && (
              <p className="fb-settings-note">The team Owner cannot be demoted or removed.</p>
            )}

            <TaskList
              compact={false}
              onDelete={removeTask}
              onEdit={(task) => {
                setEditingTask(task)
                setTaskModalOpen(true)
              }}
              projects={projects}
              tasks={tasks.filter((task) => task.assignee === selectedMember.name)}
            />
          </div>
        )}
      </Modal>

      <Modal
        onClose={() => setInviteModalOpen(false)}
        open={inviteModalOpen}
        title={`Invite to ${currentTeam.name}`}
      >
        <form className="fb-project-form" onSubmit={handleSendInvite}>
          <label className="fb-form-field">
            <span>Email address</span>
            <input
              autoComplete="email"
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="collaborator@example.com"
              required
              type="email"
              value={inviteEmail}
            />
          </label>
          <label className="fb-form-field">
            <span>Role</span>
            <select
              onChange={(e) => setInviteRole(e.target.value)}
              value={inviteRole}
            >
              {currentTeamRole === ROLES.OWNER && <option value={ROLES.ADMIN}>Admin</option>}
              <option value={ROLES.MEMBER}>Member</option>
              <option value={ROLES.VIEWER}>Viewer</option>
            </select>
          </label>
          <p className="fb-demo-access__notice">
            This is a local demo invitation. Any user in this browser registering or signing in with this email can accept it.
          </p>
          {inviteError && <p className="fb-form-error" role="alert">{inviteError}</p>}
          <div className="fb-dialog__footer">
            <Button onClick={() => setInviteModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">
              <Plus /> Send invitation
            </Button>
          </div>
        </form>
      </Modal>

      <TaskModal
        onClose={() => setTaskModalOpen(false)}
        onSave={saveTask}
        open={taskModalOpen}
        projects={projects}
        task={editingTask}
      />
    </div>
  )
}
