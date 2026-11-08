import assert from 'node:assert/strict'
import { after, beforeEach, test } from 'node:test'
import {
  acceptTeamInvitationRecord,
  addTeamMemberRecord,
  cancelTeamInvitationRecord,
  createTeamInvitationRecord,
  createTeamRecord,
  DEFAULT_TEAM,
  getUserActiveTeams,
  getUserTeamMembership,
  migrateTeamsAndMemberships,
  readMemberships,
  readTeams,
  removeTeamMemberRecord,
  saveMemberships,
  saveTeams,
  updateMemberRoleRecord,
} from './teamService.js'
import {
  getTeamWorkspaceKey,
  loadAndMigrateTeamWorkspace,
} from './localDataService.js'
import { ROLES } from '../utils/permissions.js'

const storage = new Map()
globalThis.window = {
  localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
    clear: () => storage.clear(),
  },
}

beforeEach(() => {
  storage.clear()
})

after(() => {
  delete globalThis.window
})

test('creating and persisting teams with owner membership', () => {
  const { team, ownerMembership } = createTeamRecord({
    name: 'Apollo Team',
    description: 'Apollo launch mission workspace',
    ownerId: 'user-apollo-owner',
  })

  assert.equal(team.name, 'Apollo Team')
  assert.equal(team.ownerId, 'user-apollo-owner')
  assert.equal(ownerMembership.role, ROLES.OWNER)
  assert.equal(ownerMembership.status, 'active')
  assert.equal(ownerMembership.teamId, team.id)

  saveTeams([team])
  saveMemberships([ownerMembership])

  const loadedTeams = readTeams()
  assert.equal(loadedTeams.length, 1)
  assert.equal(loadedTeams[0].id, team.id)

  const activeTeams = getUserActiveTeams('user-apollo-owner', loadedTeams, readMemberships())
  assert.equal(activeTeams.length, 1)
  assert.equal(activeTeams[0].name, 'Apollo Team')
})

test('multiple users belonging to the same team with specific roles', () => {
  const { team, ownerMembership } = createTeamRecord({ name: 'Engineering', ownerId: 'user-owner' })
  const adminMembership = addTeamMemberRecord(ROLES.OWNER, { teamId: team.id, userId: 'user-admin', role: ROLES.ADMIN })
  const memberMembership = addTeamMemberRecord(ROLES.ADMIN, { teamId: team.id, userId: 'user-member', role: ROLES.MEMBER })
  const viewerMembership = addTeamMemberRecord(ROLES.ADMIN, { teamId: team.id, userId: 'user-viewer', role: ROLES.VIEWER })

  const allMemberships = [ownerMembership, adminMembership, memberMembership, viewerMembership]

  assert.equal(getUserTeamMembership('user-owner', team.id, allMemberships)?.role, ROLES.OWNER)
  assert.equal(getUserTeamMembership('user-admin', team.id, allMemberships)?.role, ROLES.ADMIN)
  assert.equal(getUserTeamMembership('user-member', team.id, allMemberships)?.role, ROLES.MEMBER)
  assert.equal(getUserTeamMembership('user-viewer', team.id, allMemberships)?.role, ROLES.VIEWER)

  for (const uid of ['user-owner', 'user-admin', 'user-member', 'user-viewer']) {
    const teams = getUserActiveTeams(uid, [team], allMemberships)
    assert.equal(teams.length, 1)
    assert.equal(teams[0].id, team.id)
  }
})

test('different roles for the same user in different teams', () => {
  const teamA = { id: 'team-a', name: 'Alpha', ownerId: 'user-1' }
  const teamB = { id: 'team-b', name: 'Beta', ownerId: 'user-2' }

  const memberships = [
    { id: 'm-1', teamId: 'team-a', userId: 'user-bob', role: ROLES.ADMIN, status: 'active' },
    { id: 'm-2', teamId: 'team-b', userId: 'user-bob', role: ROLES.VIEWER, status: 'active' },
  ]

  assert.equal(getUserTeamMembership('user-bob', 'team-a', memberships)?.role, ROLES.ADMIN)
  assert.equal(getUserTeamMembership('user-bob', 'team-b', memberships)?.role, ROLES.VIEWER)

  const bobTeams = getUserActiveTeams('user-bob', [teamA, teamB], memberships)
  assert.equal(bobTeams.length, 2)
})

test('shared projects and tasks within one team', () => {
  const workspace = loadAndMigrateTeamWorkspace(DEFAULT_TEAM.id)
  assert.ok(workspace.projects.length > 0)
  assert.ok(workspace.tasks.length > 0)

  const newTask = {
    id: 'shared-task-1',
    projectId: workspace.projects[0].id,
    title: 'Shared Task by Nina',
    status: 'todo',
    priority: 'high',
    assignee: 'Nina Patel',
  }
  workspace.tasks.push(newTask)
  window.localStorage.setItem(getTeamWorkspaceKey(DEFAULT_TEAM.id), JSON.stringify(workspace))

  const reloaded = loadAndMigrateTeamWorkspace(DEFAULT_TEAM.id)
  const found = reloaded.tasks.find((t) => t.id === 'shared-task-1')
  assert.ok(found)
  assert.equal(found.title, 'Shared Task by Nina')
})

test('isolation between different teams', () => {
  const teamA = 'team-alpha-123'
  const teamB = 'team-beta-456'

  const wsA = loadAndMigrateTeamWorkspace(teamA)
  wsA.projects.push({ id: 'proj-alpha-only', name: 'Alpha Secret Project', status: 'active' })
  wsA.tasks.push({ id: 'task-alpha-only', projectId: 'proj-alpha-only', title: 'Alpha Task', status: 'todo', priority: 'medium' })
  window.localStorage.setItem(getTeamWorkspaceKey(teamA), JSON.stringify(wsA))

  const wsB = loadAndMigrateTeamWorkspace(teamB)
  wsB.projects.push({ id: 'proj-beta-only', name: 'Beta Secret Project', status: 'active' })
  window.localStorage.setItem(getTeamWorkspaceKey(teamB), JSON.stringify(wsB))

  const checkB = loadAndMigrateTeamWorkspace(teamB)
  assert.equal(checkB.projects.some((p) => p.id === 'proj-alpha-only'), false)
  assert.equal(checkB.tasks.some((t) => t.id === 'task-alpha-only'), false)
  assert.equal(checkB.projects.some((p) => p.id === 'proj-beta-only'), true)

  const checkA = loadAndMigrateTeamWorkspace(teamA)
  assert.equal(checkA.projects.some((p) => p.id === 'proj-beta-only'), false)
  assert.equal(checkA.projects.some((p) => p.id === 'proj-alpha-only'), true)
})

test('switching between teams loads different workspaces', () => {
  const ws1 = loadAndMigrateTeamWorkspace('team-1')
  ws1.projects.push({ id: 'p1', name: 'Team 1 Project' })
  window.localStorage.setItem(getTeamWorkspaceKey('team-1'), JSON.stringify(ws1))

  const ws2 = loadAndMigrateTeamWorkspace('team-2')
  ws2.projects.push({ id: 'p2', name: 'Team 2 Project' })
  window.localStorage.setItem(getTeamWorkspaceKey('team-2'), JSON.stringify(ws2))

  assert.equal(loadAndMigrateTeamWorkspace('team-1').projects[0].name, 'Team 1 Project')
  assert.equal(loadAndMigrateTeamWorkspace('team-2').projects[0].name, 'Team 2 Project')
})

test('removed/inactive membership access is revoked', () => {
  const team = { id: 'team-x', name: 'Project X', ownerId: 'user-owner' }
  const activeMember = { id: 'm-1', teamId: 'team-x', userId: 'user-dev', role: ROLES.MEMBER, status: 'active' }

  assert.equal(getUserActiveTeams('user-dev', [team], [activeMember]).length, 1)

  const updatedMember = removeTeamMemberRecord(ROLES.OWNER, activeMember)
  assert.equal(updatedMember.status, 'inactive')

  const activeAfterRemoval = getUserActiveTeams('user-dev', [team], [updatedMember])
  assert.equal(activeAfterRemoval.length, 0)
  assert.equal(getUserTeamMembership('user-dev', 'team-x', [updatedMember]), null)
})

test('legacy workspace migration preserves existing projects and tasks into core team', () => {
  const legacyData = {
    projects: [
      { id: 'custom-legacy-proj', name: 'Custom Legacy Project', status: 'active' },
    ],
    tasks: [
      { id: 'custom-legacy-task', projectId: 'custom-legacy-proj', title: 'Custom Legacy Task', status: 'todo', priority: 'high' },
    ],
    notifications: [],
    preferences: { notifications: {}, defaultTaskView: 'tasks', workspaceName: 'Mohamed Work' },
  }
  window.localStorage.setItem('flowboard-workspace-data:owner-permanent-mohamed', JSON.stringify(legacyData))

  const migrated = loadAndMigrateTeamWorkspace(DEFAULT_TEAM.id, ['owner-permanent-mohamed'])

  assert.ok(migrated.projects.some((p) => p.id === 'custom-legacy-proj'))
  assert.ok(migrated.tasks.some((t) => t.id === 'custom-legacy-task'))
  assert.ok(migrated.projects.some((p) => p.id === 'project-atlas'))
})

test('idempotent migration does not create duplicate teams, memberships, or projects', () => {
  const users = [
    { id: 'owner-permanent-mohamed', fullName: 'Mohamed', email: 'mohamed@flowboard.com', role: 'owner' },
    { id: 'user-nina', fullName: 'Nina Patel', email: 'nina@example.test', role: 'admin' },
  ]

  const first = migrateTeamsAndMemberships(users)
  const firstWs = loadAndMigrateTeamWorkspace(DEFAULT_TEAM.id, ['owner-permanent-mohamed'])
  const firstProjCount = firstWs.projects.length

  const second = migrateTeamsAndMemberships(users)
  const secondWs = loadAndMigrateTeamWorkspace(DEFAULT_TEAM.id, ['owner-permanent-mohamed'])

  assert.equal(second.teams.length, first.teams.length)
  assert.equal(second.memberships.length, first.memberships.length)
  assert.equal(secondWs.projects.length, firstProjCount)
  assert.equal(secondWs.tasks.length, firstWs.tasks.length)
})

test('Owner and Admin role restrictions', () => {
  const teamId = 'team-rules-test'
  const ownerMembership = { id: 'm-owner', teamId, userId: 'u-owner', role: ROLES.OWNER, status: 'active' }
  const adminMembership = { id: 'm-admin', teamId, userId: 'u-admin', role: ROLES.ADMIN, status: 'active' }
  const memberMembership = { id: 'm-member', teamId, userId: 'u-member', role: ROLES.MEMBER, status: 'active' }

  assert.doesNotThrow(() => addTeamMemberRecord(ROLES.OWNER, { teamId, userId: 'u-new-admin', role: ROLES.ADMIN }))
  assert.doesNotThrow(() => addTeamMemberRecord(ROLES.OWNER, { teamId, userId: 'u-new-member', role: ROLES.MEMBER }))

  assert.throws(() => addTeamMemberRecord(ROLES.ADMIN, { teamId, userId: 'u-new-admin', role: ROLES.ADMIN }), /permission/)
  assert.throws(() => addTeamMemberRecord(ROLES.ADMIN, { teamId, userId: 'u-new-owner', role: ROLES.OWNER }), /single permanent Owner/)

  assert.doesNotThrow(() => addTeamMemberRecord(ROLES.ADMIN, { teamId, userId: 'u-new-viewer', role: ROLES.VIEWER }))

  assert.throws(() => removeTeamMemberRecord(ROLES.OWNER, ownerMembership), /Owner cannot be removed/)
  assert.throws(() => removeTeamMemberRecord(ROLES.ADMIN, ownerMembership), /Owner cannot be removed/)
  assert.throws(() => updateMemberRoleRecord(ROLES.OWNER, ownerMembership, ROLES.ADMIN), /Cannot modify or demote the team Owner/)

  assert.throws(() => removeTeamMemberRecord(ROLES.ADMIN, adminMembership), /cannot remove a admin/)
  assert.throws(() => updateMemberRoleRecord(ROLES.ADMIN, adminMembership, ROLES.MEMBER), /cannot change role from admin/)

  const demotedToMember = updateMemberRoleRecord(ROLES.OWNER, adminMembership, ROLES.MEMBER)
  assert.equal(demotedToMember.role, ROLES.MEMBER)

  const promotedToAdmin = updateMemberRoleRecord(ROLES.OWNER, memberMembership, ROLES.ADMIN)
  assert.equal(promotedToAdmin.role, ROLES.ADMIN)

  const viewerFromMember = updateMemberRoleRecord(ROLES.ADMIN, memberMembership, ROLES.VIEWER)
  assert.equal(viewerFromMember.role, ROLES.VIEWER)
})

test('Owner invitation permissions: can invite Admin, Member, Viewer, but not Owner', () => {
  const teamId = 'team-invites'
  assert.doesNotThrow(() => createTeamInvitationRecord(ROLES.OWNER, 'u-owner', { teamId, email: 'admin@test.com', role: ROLES.ADMIN }))
  assert.doesNotThrow(() => createTeamInvitationRecord(ROLES.OWNER, 'u-owner', { teamId, email: 'member@test.com', role: ROLES.MEMBER }))
  assert.doesNotThrow(() => createTeamInvitationRecord(ROLES.OWNER, 'u-owner', { teamId, email: 'viewer@test.com', role: ROLES.VIEWER }))
  assert.throws(() => createTeamInvitationRecord(ROLES.OWNER, 'u-owner', { teamId, email: 'owner2@test.com', role: ROLES.OWNER }), /Cannot invite a user as Owner/)
})

test('Admin invitation permissions: can invite Member and Viewer, but NOT Admin or Owner', () => {
  const teamId = 'team-invites'
  assert.doesNotThrow(() => createTeamInvitationRecord(ROLES.ADMIN, 'u-admin', { teamId, email: 'member@test.com', role: ROLES.MEMBER }))
  assert.doesNotThrow(() => createTeamInvitationRecord(ROLES.ADMIN, 'u-admin', { teamId, email: 'viewer@test.com', role: ROLES.VIEWER }))
  assert.throws(() => createTeamInvitationRecord(ROLES.ADMIN, 'u-admin', { teamId, email: 'admin2@test.com', role: ROLES.ADMIN }), /does not have permission/)
  assert.throws(() => createTeamInvitationRecord(ROLES.ADMIN, 'u-admin', { teamId, email: 'owner2@test.com', role: ROLES.OWNER }), /Cannot invite a user as Owner/)
})

test('Member and Viewer restrictions: cannot invite anyone', () => {
  const teamId = 'team-invites'
  assert.throws(() => createTeamInvitationRecord(ROLES.MEMBER, 'u-member', { teamId, email: 'test@test.com', role: ROLES.VIEWER }), /does not have permission/)
  assert.throws(() => createTeamInvitationRecord(ROLES.VIEWER, 'u-viewer', { teamId, email: 'test@test.com', role: ROLES.VIEWER }), /does not have permission/)
})

test('duplicate invitation prevention: rejects pending invite for same email in same team', () => {
  const teamId = 'team-invites'
  const existingInv = { id: 'inv-1', teamId, email: 'duplicate@test.com', role: ROLES.MEMBER, status: 'pending' }

  assert.throws(
    () => createTeamInvitationRecord(ROLES.OWNER, 'u-owner', { teamId, email: 'duplicate@test.com', role: ROLES.VIEWER }, { existingInvitations: [existingInv] }),
    /A pending invitation already exists for this email/,
  )

  assert.doesNotThrow(
    () => createTeamInvitationRecord(ROLES.OWNER, 'u-owner', { teamId: 'different-team', email: 'duplicate@test.com', role: ROLES.VIEWER }, { existingInvitations: [existingInv] }),
  )
})

test('invitation acceptance by matching email creates membership and updates invite', () => {
  const invitation = {
    id: 'inv-123',
    teamId: 'team-launch',
    email: 'invited.person@test.com',
    role: ROLES.MEMBER,
    status: 'pending',
  }
  const currentUser = { id: 'user-invited-person', email: 'Invited.Person@Test.com' }

  const { membership, updatedInvitation } = acceptTeamInvitationRecord(invitation, currentUser, [])

  assert.equal(updatedInvitation.status, 'accepted')
  assert.ok(updatedInvitation.acceptedAt)
  assert.equal(membership.teamId, 'team-launch')
  assert.equal(membership.userId, 'user-invited-person')
  assert.equal(membership.role, ROLES.MEMBER)
  assert.equal(membership.status, 'active')
})

test('rejection of mismatched email acceptance', () => {
  const invitation = {
    id: 'inv-123',
    teamId: 'team-launch',
    email: 'intended.recipient@test.com',
    role: ROLES.MEMBER,
    status: 'pending',
  }
  const wrongUser = { id: 'user-wrong', email: 'impostor@test.com' }

  assert.throws(
    () => acceptTeamInvitationRecord(invitation, wrongUser, []),
    /This invitation was sent to intended\.recipient@test\.com, but you are signed in as impostor@test\.com/,
  )
})

test('membership creation and duplicate prevention when accepting', () => {
  const invitation = {
    id: 'inv-dup',
    teamId: 'team-alpha',
    email: 'member@test.com',
    role: ROLES.MEMBER,
    status: 'pending',
  }
  const currentUser = { id: 'user-alpha-mem', email: 'member@test.com' }
  const existingActive = { id: 'm-existing', teamId: 'team-alpha', userId: 'user-alpha-mem', role: ROLES.MEMBER, status: 'active' }

  assert.throws(
    () => acceptTeamInvitationRecord(invitation, currentUser, [existingActive]),
    /already an active member/,
  )
})

test('invitation cancellation permissions', () => {
  const inv = { id: 'inv-c', teamId: 'team-c', email: 'c@test.com', role: ROLES.MEMBER, invitedBy: 'user-admin', status: 'pending' }

  const cancelledByOwner = cancelTeamInvitationRecord(ROLES.OWNER, 'user-owner', inv)
  assert.equal(cancelledByOwner.status, 'cancelled')

  const cancelledByCreator = cancelTeamInvitationRecord(ROLES.ADMIN, 'user-admin', inv)
  assert.equal(cancelledByCreator.status, 'cancelled')

  assert.throws(
    () => cancelTeamInvitationRecord(ROLES.MEMBER, 'user-other', inv),
    /permission/,
  )
})
