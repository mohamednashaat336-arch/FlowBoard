import { ROLES, canChangeMemberRole, canInviteRole, canRemoveMember, normalizeRole } from '../utils/permissions.js'

export const TEAMS_KEY = 'flowboard_teams'
export const MEMBERSHIPS_KEY = 'flowboard_team_memberships'
export const INVITATIONS_KEY = 'flowboard_team_invitations'
export const ACTIVE_TEAM_KEY_PREFIX = 'flowboard_active_team_id'

export const DEFAULT_TEAM = Object.freeze({
  id: 'team-flowboard-core',
  name: 'FlowBoard Team',
  description: 'The core product and engineering team workspace.',
  ownerId: 'owner-permanent-mohamed',
  createdAt: '2026-01-01T00:00:00.000Z',
})

export const DEFAULT_OWNER_MEMBERSHIP = Object.freeze({
  id: 'membership-owner-mohamed',
  teamId: 'team-flowboard-core',
  userId: 'owner-permanent-mohamed',
  role: ROLES.OWNER,
  status: 'active',
  joinedAt: '2026-01-01T00:00:00.000Z',
})

export const DEFAULT_DEMO_MEMBERS = Object.freeze([
  { id: 'user-nina-demo', name: 'Nina Patel', email: 'nina.patel@example.test', role: ROLES.ADMIN },
  { id: 'user-jordan-demo', name: 'Jordan Lee', email: 'jordan.lee@example.test', role: ROLES.MEMBER },
  { id: 'user-sam-demo', name: 'Sam Rivera', email: 'sam.rivera@example.test', role: ROLES.VIEWER },
])

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function readTeams() {
  try {
    const raw = JSON.parse(window.localStorage?.getItem(TEAMS_KEY) || 'null')
    return Array.isArray(raw)
      ? raw.filter((t) => isRecord(t) && typeof t.id === 'string' && typeof t.name === 'string' && typeof t.ownerId === 'string')
      : []
  } catch {
    return []
  }
}

export function saveTeams(teams) {
  try {
    window.localStorage?.setItem(TEAMS_KEY, JSON.stringify(teams))
  } catch {
  }
}

export function readMemberships() {
  try {
    const raw = JSON.parse(window.localStorage?.getItem(MEMBERSHIPS_KEY) || 'null')
    return Array.isArray(raw)
      ? raw.filter((m) => isRecord(m) && typeof m.id === 'string' && typeof m.teamId === 'string' && typeof m.userId === 'string')
      : []
  } catch {
    return []
  }
}

export function saveMemberships(memberships) {
  try {
    window.localStorage?.setItem(MEMBERSHIPS_KEY, JSON.stringify(memberships))
  } catch {
  }
}

export function readInvitations() {
  try {
    const raw = JSON.parse(window.localStorage?.getItem(INVITATIONS_KEY) || 'null')
    return Array.isArray(raw)
      ? raw.filter((inv) => isRecord(inv) && typeof inv.id === 'string' && typeof inv.teamId === 'string' && typeof inv.email === 'string')
      : []
  } catch {
    return []
  }
}

export function saveInvitations(invitations) {
  try {
    window.localStorage?.setItem(INVITATIONS_KEY, JSON.stringify(invitations))
  } catch {
  }
}

export function getTeamInvitations(teamId, invitations = readInvitations()) {
  if (!teamId) return []
  return invitations.filter((inv) => inv.teamId === teamId)
}

export function getUserPendingInvitations(userEmail, invitations = readInvitations()) {
  if (!userEmail) return []
  const normalized = userEmail.trim().toLowerCase()
  return invitations.filter((inv) => inv.email.toLowerCase() === normalized && inv.status === 'pending')
}

export function getUserActiveTeams(userId, teams = readTeams(), memberships = readMemberships()) {
  if (!userId) return []
  const activeTeamIds = new Set(
    memberships
      .filter((m) => m.userId === userId && m.status === 'active')
      .map((m) => m.teamId),
  )
  return teams.filter((t) => activeTeamIds.has(t.id))
}

export function getUserTeamMembership(userId, teamId, memberships = readMemberships()) {
  if (!userId || !teamId) return null
  return memberships.find((m) => m.userId === userId && m.teamId === teamId && m.status === 'active') || null
}

export function readActiveTeamId(userId) {
  if (!userId) return ''
  try {
    return window.localStorage?.getItem(`${ACTIVE_TEAM_KEY_PREFIX}:${userId}`) || ''
  } catch {
    return ''
  }
}

export function saveActiveTeamId(userId, teamId) {
  if (!userId) return
  try {
    window.localStorage?.setItem(`${ACTIVE_TEAM_KEY_PREFIX}:${userId}`, teamId)
  } catch {
  }
}

export function getTeamMembers(teamId, users = [], memberships = readMemberships()) {
  if (!teamId) return []
  const activeMemberships = memberships.filter((m) => m.teamId === teamId && m.status === 'active')
  const userMap = new Map(users.map((u) => [u.id, u]))
  const demoMap = new Map(DEFAULT_DEMO_MEMBERS.map((d) => [d.id, d]))

  return activeMemberships.map((m) => {
    const user = userMap.get(m.userId)
    const demo = demoMap.get(m.userId)
    const name = user?.fullName || demo?.name || (m.userId === DEFAULT_TEAM.ownerId ? 'Mohamed' : 'Collaborator')
    const email = user?.email || demo?.email || (m.userId === DEFAULT_TEAM.ownerId ? 'mohamed@flowboard.com' : '')

    return {
      id: m.id,
      membershipId: m.id,
      userId: m.userId,
      name,
      email,
      role: m.role,
      status: 'Active',
      joinedAt: m.joinedAt,
      isOwner: m.role === ROLES.OWNER,
    }
  })
}

export function migrateTeamsAndMemberships(users = []) {
  let teams = readTeams()
  let memberships = readMemberships()
  let teamsModified = false
  let membershipsModified = false

  if (!teams.some((t) => t.id === DEFAULT_TEAM.id)) {
    teams = [DEFAULT_TEAM, ...teams]
    teamsModified = true
  }

  const hasOwnerMembership = memberships.some(
    (m) => m.teamId === DEFAULT_TEAM.id && m.userId === DEFAULT_TEAM.ownerId,
  )
  if (!hasOwnerMembership) {
    memberships = [DEFAULT_OWNER_MEMBERSHIP, ...memberships]
    membershipsModified = true
  }

  DEFAULT_DEMO_MEMBERS.forEach((demo) => {
    const hasDemo = memberships.some((m) => m.teamId === DEFAULT_TEAM.id && m.userId === demo.id)
    if (!hasDemo) {
      memberships.push({
        id: `membership-${DEFAULT_TEAM.id}-${demo.id}`,
        teamId: DEFAULT_TEAM.id,
        userId: demo.id,
        role: demo.role,
        status: 'active',
        joinedAt: '2026-01-01T00:00:00.000Z',
      })
      membershipsModified = true
    }
  })

  users.forEach((user) => {
    if (!user || !user.id) return
    const existing = memberships.find((m) => m.teamId === DEFAULT_TEAM.id && m.userId === user.id)
    if (!existing) {
      const role = user.id === DEFAULT_TEAM.ownerId ? ROLES.OWNER : normalizeRole(user.role)
      memberships.push({
        id: `membership-${DEFAULT_TEAM.id}-${user.id}`,
        teamId: DEFAULT_TEAM.id,
        userId: user.id,
        role,
        status: 'active',
        joinedAt: user.createdAt || new Date().toISOString(),
      })
      membershipsModified = true
    } else if (user.id === DEFAULT_TEAM.ownerId && (existing.role !== ROLES.OWNER || existing.status !== 'active')) {
      existing.role = ROLES.OWNER
      existing.status = 'active'
      membershipsModified = true
    }
  })

  const seenPairs = new Set()
  const deduplicatedMemberships = []
  for (const m of memberships) {
    const key = `${m.teamId}:${m.userId}`
    if (!seenPairs.has(key)) {
      seenPairs.add(key)
      deduplicatedMemberships.push(m)
    } else {
      membershipsModified = true
    }
  }
  memberships = deduplicatedMemberships

  if (teamsModified) saveTeams(teams)
  if (membershipsModified) saveMemberships(memberships)

  return { teams, memberships }
}

export function createTeamRecord({ name, description = '', ownerId }) {
  if (!ownerId) throw new Error('A team owner ID is required.')
  const trimmedName = typeof name === 'string' ? name.trim() : ''
  if (trimmedName.length < 2 || trimmedName.length > 80) {
    throw new Error('Team name must be between 2 and 80 characters.')
  }
  const id = `team-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const team = {
    id,
    name: trimmedName,
    description: typeof description === 'string' ? description.trim().slice(0, 240) : '',
    ownerId,
    createdAt: new Date().toISOString(),
  }
  const ownerMembership = {
    id: `membership-${id}-${ownerId}`,
    teamId: id,
    userId: ownerId,
    role: ROLES.OWNER,
    status: 'active',
    joinedAt: team.createdAt,
  }
  return { team, ownerMembership }
}

export function addTeamMemberRecord(actorRole, { teamId, userId, role = ROLES.MEMBER }) {
  if (!teamId || !userId) throw new Error('Team ID and User ID are required.')
  const normalizedNewRole = normalizeRole(role)
  if (normalizedNewRole === ROLES.OWNER) {
    throw new Error('Cannot assign an Owner role. Teams have a single permanent Owner.')
  }
  if (!canInviteRole(actorRole, normalizedNewRole)) {
    throw new Error(`Your role (${actorRole}) does not have permission to assign the ${normalizedNewRole} role.`)
  }

  return {
    id: `membership-${teamId}-${userId}-${Date.now()}`,
    teamId,
    userId,
    role: normalizedNewRole,
    status: 'active',
    joinedAt: new Date().toISOString(),
  }
}

export function updateMemberRoleRecord(actorRole, membership, newRole) {
  if (!membership) throw new Error('Membership not found.')
  if (membership.role === ROLES.OWNER) {
    throw new Error('Cannot modify or demote the team Owner.')
  }
  const normalizedNewRole = normalizeRole(newRole)
  if (normalizedNewRole === ROLES.OWNER) {
    throw new Error('Cannot promote a member to Owner.')
  }
  if (!canChangeMemberRole(actorRole, membership.role, normalizedNewRole)) {
    throw new Error(`Your role (${actorRole}) cannot change role from ${membership.role} to ${normalizedNewRole}.`)
  }

  return {
    ...membership,
    role: normalizedNewRole,
  }
}

export function removeTeamMemberRecord(actorRole, membership) {
  if (!membership) throw new Error('Membership not found.')
  if (membership.role === ROLES.OWNER) {
    throw new Error('The team Owner cannot be removed.')
  }
  if (!canRemoveMember(actorRole, membership.role)) {
    throw new Error(`Your role (${actorRole}) cannot remove a ${membership.role}.`)
  }

  return {
    ...membership,
    status: 'inactive',
  }
}

export function createTeamInvitationRecord(
  actorRole,
  inviterUserId,
  { teamId, email, role },
  { existingInvitations = readInvitations(), activeMembers = [] } = {},
) {
  if (!teamId) throw new Error('Team ID is required.')
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('Enter a valid email address.')
  }

  const normalizedRole = normalizeRole(role)
  if (normalizedRole === ROLES.OWNER) {
    throw new Error('Cannot invite a user as Owner.')
  }
  if (!canInviteRole(actorRole, normalizedRole)) {
    throw new Error(`Your role (${actorRole}) does not have permission to invite a ${normalizedRole}.`)
  }

  const duplicatePending = existingInvitations.some(
    (inv) => inv.teamId === teamId && inv.email.toLowerCase() === normalizedEmail && inv.status === 'pending',
  )
  if (duplicatePending) {
    throw new Error('A pending invitation already exists for this email in this team.')
  }

  const alreadyMember = activeMembers.some(
    (m) => m.email && m.email.toLowerCase() === normalizedEmail,
  )
  if (alreadyMember) {
    throw new Error('This user is already an active member of this team.')
  }

  const invitation = {
    id: `invite-${teamId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    teamId,
    email: normalizedEmail,
    role: normalizedRole,
    invitedBy: inviterUserId || '',
    status: 'pending',
    createdAt: new Date().toISOString(),
  }

  return invitation
}

export function cancelTeamInvitationRecord(actorRole, actorUserId, invitation) {
  if (!invitation) throw new Error('Invitation not found.')
  if (invitation.status !== 'pending') throw new Error('Only pending invitations can be cancelled.')

  const isOwner = actorRole === ROLES.OWNER
  const isCreator = actorUserId && actorUserId === invitation.invitedBy
  const isAdminManagingMember = actorRole === ROLES.ADMIN && (invitation.role === ROLES.MEMBER || invitation.role === ROLES.VIEWER)

  if (!isOwner && !isCreator && !isAdminManagingMember) {
    throw new Error('You do not have permission to cancel this invitation.')
  }

  return {
    ...invitation,
    status: 'cancelled',
    cancelledAt: new Date().toISOString(),
  }
}

export function acceptTeamInvitationRecord(invitation, currentUser, existingMemberships = readMemberships()) {
  if (!invitation) throw new Error('Invitation not found.')
  if (invitation.status !== 'pending') throw new Error('This invitation is no longer pending.')
  if (!currentUser || !currentUser.email) throw new Error('You must be signed in to accept an invitation.')

  const userEmail = currentUser.email.trim().toLowerCase()
  if (invitation.email.toLowerCase() !== userEmail) {
    throw new Error(`This invitation was sent to ${invitation.email}, but you are signed in as ${currentUser.email}.`)
  }

  const existing = existingMemberships.find(
    (m) => m.teamId === invitation.teamId && m.userId === currentUser.id,
  )

  let membership
  if (existing) {
    if (existing.status === 'active') {
      throw new Error('You are already an active member of this team.')
    }
    membership = { ...existing, role: invitation.role, status: 'active' }
  } else {
    membership = {
      id: `membership-${invitation.teamId}-${currentUser.id}-${Date.now()}`,
      teamId: invitation.teamId,
      userId: currentUser.id,
      role: invitation.role,
      status: 'active',
      joinedAt: new Date().toISOString(),
    }
  }

  const updatedInvitation = {
    ...invitation,
    status: 'accepted',
    acceptedAt: new Date().toISOString(),
  }

  return { membership, updatedInvitation }
}
