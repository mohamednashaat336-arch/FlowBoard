import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  assertPermission,
  canChangeMemberRole,
  canClaimTask,
  canCreateTaskInProject,
  canDeleteTaskInProject,
  canEditTaskInProject,
  canInviteRole,
  canManageProjectAuthorization,
  canReleaseTask,
  canRemoveMember,
  getInvitableRoles,
  getPermissions,
  getRoleLabel,
  normalizeRole,
  ROLES,
} from './permissions.js'

test('normalizeRole and getRoleLabel work properly', () => {
  assert.equal(normalizeRole('OWNER'), ROLES.OWNER)
  assert.equal(normalizeRole(' Admin '), ROLES.ADMIN)
  assert.equal(normalizeRole('member'), ROLES.MEMBER)
  assert.equal(normalizeRole('VIEWER'), ROLES.VIEWER)
  assert.equal(normalizeRole('unknown'), ROLES.MEMBER)
  assert.equal(normalizeRole(null), ROLES.MEMBER)

  assert.equal(getRoleLabel(ROLES.OWNER), 'Owner')
  assert.equal(getRoleLabel(ROLES.ADMIN), 'Admin')
  assert.equal(getRoleLabel(ROLES.MEMBER), 'Member')
  assert.equal(getRoleLabel(ROLES.VIEWER), 'Viewer')
})

test('Owner permissions: full access and admin management', () => {
  const p = getPermissions(ROLES.OWNER)
  assert.equal(p.isOwner, true)
  assert.equal(p.canCreateProject, true)
  assert.equal(p.canEditProject, true)
  assert.equal(p.canDeleteProject, true)
  assert.equal(p.canCreateTask, true)
  assert.equal(p.canEditTask, true)
  assert.equal(p.canDeleteTask, true)
  assert.equal(p.canMoveKanbanTask, true)
  assert.equal(p.canManageMembers, true)
  assert.equal(p.canManageTeamSettings, true)
  assert.equal(p.canResetWorkspace, true)
  assert.equal(p.canImportData, true)

  assert.deepEqual(getInvitableRoles(ROLES.OWNER), [ROLES.ADMIN, ROLES.MEMBER, ROLES.VIEWER])
  assert.equal(canInviteRole(ROLES.OWNER, ROLES.ADMIN), true)
  assert.equal(canInviteRole(ROLES.OWNER, ROLES.MEMBER), true)
  assert.equal(canInviteRole(ROLES.OWNER, ROLES.VIEWER), true)
  assert.equal(canInviteRole(ROLES.OWNER, ROLES.OWNER), false)

  assert.equal(canRemoveMember(ROLES.OWNER, ROLES.ADMIN), true)
  assert.equal(canRemoveMember(ROLES.OWNER, ROLES.MEMBER), true)
  assert.equal(canRemoveMember(ROLES.OWNER, ROLES.VIEWER), true)
  assert.equal(canRemoveMember(ROLES.OWNER, ROLES.OWNER), false)

  assert.equal(canChangeMemberRole(ROLES.OWNER, ROLES.MEMBER, ROLES.ADMIN), true)
  assert.equal(canChangeMemberRole(ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER), true)
  assert.equal(canChangeMemberRole(ROLES.OWNER, ROLES.MEMBER, ROLES.OWNER), false)
  assert.equal(canChangeMemberRole(ROLES.OWNER, ROLES.OWNER, ROLES.ADMIN), false)
})

test('Admin permissions: manages members and viewers only, cannot touch admin/owner', () => {
  const p = getPermissions(ROLES.ADMIN)
  assert.equal(p.isAdmin, true)
  assert.equal(p.isOwner, false)
  assert.equal(p.canCreateProject, true)
  assert.equal(p.canEditProject, true)
  assert.equal(p.canDeleteProject, true)
  assert.equal(p.canCreateTask, true)
  assert.equal(p.canEditTask, true)
  assert.equal(p.canDeleteTask, true)
  assert.equal(p.canMoveKanbanTask, true)
  assert.equal(p.canManageMembers, true)
  assert.equal(p.canManageTeamSettings, false)
  assert.equal(p.canResetWorkspace, false)
  assert.equal(p.canImportData, false)

  assert.deepEqual(getInvitableRoles(ROLES.ADMIN), [ROLES.MEMBER, ROLES.VIEWER])
  assert.equal(canInviteRole(ROLES.ADMIN, ROLES.ADMIN), false)
  assert.equal(canInviteRole(ROLES.ADMIN, ROLES.OWNER), false)
  assert.equal(canInviteRole(ROLES.ADMIN, ROLES.MEMBER), true)
  assert.equal(canInviteRole(ROLES.ADMIN, ROLES.VIEWER), true)

  assert.equal(canRemoveMember(ROLES.ADMIN, ROLES.ADMIN), false)
  assert.equal(canRemoveMember(ROLES.ADMIN, ROLES.OWNER), false)
  assert.equal(canRemoveMember(ROLES.ADMIN, ROLES.MEMBER), true)
  assert.equal(canRemoveMember(ROLES.ADMIN, ROLES.VIEWER), true)

  assert.equal(canChangeMemberRole(ROLES.ADMIN, ROLES.MEMBER, ROLES.VIEWER), true)
  assert.equal(canChangeMemberRole(ROLES.ADMIN, ROLES.VIEWER, ROLES.MEMBER), true)
  assert.equal(canChangeMemberRole(ROLES.ADMIN, ROLES.MEMBER, ROLES.ADMIN), false)
  assert.equal(canChangeMemberRole(ROLES.ADMIN, ROLES.ADMIN, ROLES.MEMBER), false)
  assert.equal(canChangeMemberRole(ROLES.ADMIN, ROLES.OWNER, ROLES.VIEWER), false)
})

test('Member permissions: works on tasks, cannot delete projects or manage team/settings', () => {
  const p = getPermissions(ROLES.MEMBER)
  assert.equal(p.isMember, true)
  assert.equal(p.canCreateProject, false)
  assert.equal(p.canEditProject, false)
  assert.equal(p.canDeleteProject, false)
  assert.equal(p.canCreateTask, true)
  assert.equal(p.canEditTask, false)
  assert.equal(p.canDeleteTask, false)
  assert.equal(p.canMoveKanbanTask, false)
  assert.equal(p.canManageMembers, false)
  assert.equal(p.canInvite, false)
  assert.equal(p.canManageTeamSettings, false)
  assert.equal(p.canResetWorkspace, false)
  assert.equal(p.canImportData, false)

  assert.deepEqual(getInvitableRoles(ROLES.MEMBER), [])
  assert.equal(canInviteRole(ROLES.MEMBER, ROLES.VIEWER), false)
  assert.equal(canRemoveMember(ROLES.MEMBER, ROLES.VIEWER), false)
  assert.equal(canChangeMemberRole(ROLES.MEMBER, ROLES.VIEWER, ROLES.MEMBER), false)
})

test('Viewer permissions: read-only access across projects, tasks, team, and settings', () => {
  const p = getPermissions(ROLES.VIEWER)
  assert.equal(p.isViewer, true)
  assert.equal(p.canCreateProject, false)
  assert.equal(p.canEditProject, false)
  assert.equal(p.canDeleteProject, false)
  assert.equal(p.canCreateTask, false)
  assert.equal(p.canEditTask, false)
  assert.equal(p.canDeleteTask, false)
  assert.equal(p.canMoveKanbanTask, false)
  assert.equal(p.canManageMembers, false)
  assert.equal(p.canInvite, false)
  assert.equal(p.canManageTeamSettings, false)
  assert.equal(p.canResetWorkspace, false)
  assert.equal(p.canImportData, false)
})

test('assertPermission throws PERMISSION_DENIED on unauthorized action', () => {
  assert.doesNotThrow(() => assertPermission(true))
  assert.throws(() => assertPermission(false, 'Denied test'), {
    name: 'Error',
    message: 'Denied test',
    code: 'PERMISSION_DENIED',
  })
})

const P5_ownerId = 'user-owner'
const P5_adminId = 'user-admin'
const P5_creatorId = 'user-creator'
const P5_authMemberId = 'user-auth-member'
const P5_unauthMemberId = 'user-unauth'
const P5_viewerId = 'user-viewer'
const P5_removedId = 'user-removed'

const P5_project = {
  id: 'proj-p5',
  ownerId: P5_creatorId,
  authorizedMemberIds: [P5_authMemberId],
}

const P5_activeIds = [P5_ownerId, P5_adminId, P5_creatorId, P5_authMemberId, P5_unauthMemberId, P5_viewerId]

test('Phase 5 — Owner can create tasks in any project', () => {
  assert.equal(canCreateTaskInProject(ROLES.OWNER, P5_ownerId, P5_project, P5_activeIds), true)
})

test('Phase 5 — Admin can create tasks in any project', () => {
  assert.equal(canCreateTaskInProject(ROLES.ADMIN, P5_adminId, P5_project, P5_activeIds), true)
})

test('Phase 5 — Project creator can always create tasks', () => {
  assert.equal(canCreateTaskInProject(ROLES.MEMBER, P5_creatorId, P5_project, P5_activeIds), true)
})

test('Phase 5 — Authorized active Member can create tasks', () => {
  assert.equal(canCreateTaskInProject(ROLES.MEMBER, P5_authMemberId, P5_project, P5_activeIds), true)
})

test('Phase 5 — Unauthorized Member cannot create tasks', () => {
  assert.equal(canCreateTaskInProject(ROLES.MEMBER, P5_unauthMemberId, P5_project, P5_activeIds), false)
})

test('Phase 5 — Viewer cannot create tasks even if listed in authorizedMemberIds', () => {
  const projectWithViewer = { ...P5_project, authorizedMemberIds: [P5_viewerId] }
  assert.equal(canCreateTaskInProject(ROLES.VIEWER, P5_viewerId, projectWithViewer, P5_activeIds), false)
})

test('Phase 5 — Inactive/removed Member cannot create tasks even if authorized', () => {
  const projectWithRemoved = { ...P5_project, authorizedMemberIds: [P5_removedId] }
  assert.equal(canCreateTaskInProject(ROLES.MEMBER, P5_removedId, projectWithRemoved, P5_activeIds), false)
})

test('Phase 5 — Permissions are isolated between projects', () => {
  const projA = { id: 'a', ownerId: 'other', authorizedMemberIds: [P5_authMemberId] }
  const projB = { id: 'b', ownerId: 'other', authorizedMemberIds: [] }
  assert.equal(canCreateTaskInProject(ROLES.MEMBER, P5_authMemberId, projA, P5_activeIds), true)
  assert.equal(canCreateTaskInProject(ROLES.MEMBER, P5_authMemberId, projB, P5_activeIds), false)
})

test('Phase 5 — Revoked permission takes effect immediately', () => {
  const before = { ...P5_project, authorizedMemberIds: [P5_authMemberId] }
  assert.equal(canCreateTaskInProject(ROLES.MEMBER, P5_authMemberId, before, P5_activeIds), true)
  const after = { ...P5_project, authorizedMemberIds: [] }
  assert.equal(canCreateTaskInProject(ROLES.MEMBER, P5_authMemberId, after, P5_activeIds), false)
})

test('Phase 5 — Existing project without authorizedMemberIds is safely compatible', () => {
  const legacy = { id: 'legacy', ownerId: 'other-owner' }
  assert.equal(canCreateTaskInProject(ROLES.MEMBER, P5_unauthMemberId, legacy, P5_activeIds), false)
  assert.equal(canCreateTaskInProject(ROLES.OWNER, P5_ownerId, legacy, P5_activeIds), true)
  assert.equal(canCreateTaskInProject(ROLES.ADMIN, P5_adminId, legacy, P5_activeIds), true)
})

test('Phase 5 — canManageProjectAuthorization: Owner and Admin can always manage', () => {
  assert.equal(canManageProjectAuthorization(ROLES.OWNER, P5_ownerId, P5_project), true)
  assert.equal(canManageProjectAuthorization(ROLES.ADMIN, P5_adminId, P5_project), true)
})

test('Phase 5 — canManageProjectAuthorization: project creator (Member) can manage', () => {
  assert.equal(canManageProjectAuthorization(ROLES.MEMBER, P5_creatorId, P5_project), true)
})

test('Phase 5 — canManageProjectAuthorization: non-creator Member/Viewer cannot manage', () => {
  assert.equal(canManageProjectAuthorization(ROLES.MEMBER, P5_unauthMemberId, P5_project), false)
  assert.equal(canManageProjectAuthorization(ROLES.VIEWER, P5_viewerId, P5_project), false)
})

const P6_ownerId  = 'p6-owner'
const P6_adminId  = 'p6-admin'
const P6_memberId = 'p6-member'
const P6_otherMemberId = 'p6-other-member'
const P6_viewerId = 'p6-viewer'

const unclaimedTask = { id: 'task-1', claimedById: null, claimedByName: null }
const claimedByMemberTask = { id: 'task-2', claimedById: P6_memberId, claimedByName: 'Alice' }

test('Phase 6 — First user (Member) successfully claims an unclaimed task', () => {
  assert.equal(canClaimTask(ROLES.MEMBER, unclaimedTask, P6_memberId), true)
})

test('Phase 6 — Second Member cannot claim an already-claimed task', () => {
  assert.equal(canClaimTask(ROLES.MEMBER, claimedByMemberTask, P6_otherMemberId), false)
})

test('Phase 6 — Claimant can release their own task', () => {
  assert.equal(canReleaseTask(ROLES.MEMBER, claimedByMemberTask, P6_memberId), true)
})

test('Phase 6 — Another Member cannot release someone else\'s task', () => {
  assert.equal(canReleaseTask(ROLES.MEMBER, claimedByMemberTask, P6_otherMemberId), false)
})

test('Phase 6 — Owner can release any claimed task', () => {
  assert.equal(canReleaseTask(ROLES.OWNER, claimedByMemberTask, P6_ownerId), true)
})

test('Phase 6 — Admin can release any claimed task', () => {
  assert.equal(canReleaseTask(ROLES.ADMIN, claimedByMemberTask, P6_adminId), true)
})

test('Phase 6 — Viewer cannot claim tasks', () => {
  assert.equal(canClaimTask(ROLES.VIEWER, unclaimedTask, P6_viewerId), false)
})

test('Phase 6 — Viewer cannot release tasks', () => {
  assert.equal(canReleaseTask(ROLES.VIEWER, claimedByMemberTask, P6_viewerId), false)
})

test('Phase 6 — canReleaseTask returns false when task has no claim', () => {
  assert.equal(canReleaseTask(ROLES.OWNER, unclaimedTask, P6_ownerId), false)
  assert.equal(canReleaseTask(ROLES.MEMBER, unclaimedTask, P6_memberId), false)
})

test('Phase 6 — Claimant can re-claim their own task (idempotent, no error)', () => {
  assert.equal(canClaimTask(ROLES.MEMBER, claimedByMemberTask, P6_memberId), true)
})

const P7_ownerId = 'p7-owner'
const P7_adminId = 'p7-admin'
const P7_creatorId = 'p7-creator'
const P7_authEditorId = 'p7-auth-editor'
const P7_unauthMemberId = 'p7-unauth-member'
const P7_assignedMemberId = 'p7-assigned-member'
const P7_claimantId = 'p7-claimant'
const P7_viewerId = 'p7-viewer'
const P7_removedId = 'p7-removed'

const P7_project = {
  id: 'proj-p7',
  ownerId: P7_creatorId,
  authorizedTaskEditorIds: [P7_authEditorId],
}

const P7_activeIds = [
  P7_ownerId,
  P7_adminId,
  P7_creatorId,
  P7_authEditorId,
  P7_unauthMemberId,
  P7_assignedMemberId,
  P7_claimantId,
  P7_viewerId,
]

test('Phase 7 — Owner/Admin can edit and delete tasks', () => {
  assert.equal(canEditTaskInProject(ROLES.OWNER, P7_ownerId, P7_project, P7_activeIds), true)
  assert.equal(canDeleteTaskInProject(ROLES.OWNER, P7_ownerId, P7_project), true)
  assert.equal(canEditTaskInProject(ROLES.ADMIN, P7_adminId, P7_project, P7_activeIds), true)
  assert.equal(canDeleteTaskInProject(ROLES.ADMIN, P7_adminId, P7_project), true)
})

test('Phase 7 — Project creator can edit and delete tasks', () => {
  assert.equal(canEditTaskInProject(ROLES.MEMBER, P7_creatorId, P7_project, P7_activeIds), true)
  assert.equal(canDeleteTaskInProject(ROLES.MEMBER, P7_creatorId, P7_project), true)
})

test('Phase 7 — Authorized project editor can edit but cannot delete', () => {
  assert.equal(canEditTaskInProject(ROLES.MEMBER, P7_authEditorId, P7_project, P7_activeIds), true)
  assert.equal(canDeleteTaskInProject(ROLES.MEMBER, P7_authEditorId, P7_project), false)
})

test('Phase 7 — Unauthorized member cannot edit or delete', () => {
  assert.equal(canEditTaskInProject(ROLES.MEMBER, P7_unauthMemberId, P7_project, P7_activeIds), false)
  assert.equal(canDeleteTaskInProject(ROLES.MEMBER, P7_unauthMemberId, P7_project), false)
})

test('Phase 7 — Assigned member without explicit edit permission cannot edit', () => {
  assert.equal(canEditTaskInProject(ROLES.MEMBER, P7_assignedMemberId, P7_project, P7_activeIds), false)
  assert.equal(canDeleteTaskInProject(ROLES.MEMBER, P7_assignedMemberId, P7_project), false)
})

test('Phase 7 — Task claimant without edit permission cannot edit', () => {
  assert.equal(canEditTaskInProject(ROLES.MEMBER, P7_claimantId, P7_project, P7_activeIds), false)
  assert.equal(canDeleteTaskInProject(ROLES.MEMBER, P7_claimantId, P7_project), false)
})

test('Phase 7 — Viewer cannot edit or delete', () => {
  const projWithViewer = { ...P7_project, authorizedTaskEditorIds: [P7_viewerId] }
  assert.equal(canEditTaskInProject(ROLES.VIEWER, P7_viewerId, projWithViewer, P7_activeIds), false)
  assert.equal(canDeleteTaskInProject(ROLES.VIEWER, P7_viewerId, projWithViewer), false)
})

test('Phase 7 — Grant/revoke authorization works', () => {
  const initial = { ...P7_project, authorizedTaskEditorIds: [] }
  assert.equal(canEditTaskInProject(ROLES.MEMBER, P7_unauthMemberId, initial, P7_activeIds), false)
  const granted = { ...P7_project, authorizedTaskEditorIds: [P7_unauthMemberId] }
  assert.equal(canEditTaskInProject(ROLES.MEMBER, P7_unauthMemberId, granted, P7_activeIds), true)
  const revoked = { ...P7_project, authorizedTaskEditorIds: [] }
  assert.equal(canEditTaskInProject(ROLES.MEMBER, P7_unauthMemberId, revoked, P7_activeIds), false)
})

test('Phase 7 — Authorization in one project does not affect another project', () => {
  const projA = { id: 'proj-a', ownerId: 'other', authorizedTaskEditorIds: [P7_authEditorId] }
  const projB = { id: 'proj-b', ownerId: 'other', authorizedTaskEditorIds: [] }
  assert.equal(canEditTaskInProject(ROLES.MEMBER, P7_authEditorId, projA, P7_activeIds), true)
  assert.equal(canEditTaskInProject(ROLES.MEMBER, P7_authEditorId, projB, P7_activeIds), false)
})

test('Phase 7 — Inactive or removed members cannot retain effective edit permission', () => {
  const projWithRemoved = { ...P7_project, authorizedTaskEditorIds: [P7_removedId] }
  assert.equal(canEditTaskInProject(ROLES.MEMBER, P7_removedId, projWithRemoved, P7_activeIds), false)
  assert.equal(canDeleteTaskInProject(ROLES.MEMBER, P7_removedId, projWithRemoved), false)
})
