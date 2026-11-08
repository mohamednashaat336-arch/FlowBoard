export const ROLES = Object.freeze({
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
  VIEWER: 'viewer',
})

export const ROLE_LABELS = Object.freeze({
  [ROLES.OWNER]: 'Owner',
  [ROLES.ADMIN]: 'Admin',
  [ROLES.MEMBER]: 'Member',
  [ROLES.VIEWER]: 'Viewer',
})

export const ALL_ROLES = Object.freeze([
  ROLES.OWNER,
  ROLES.ADMIN,
  ROLES.MEMBER,
  ROLES.VIEWER,
])

export function normalizeRole(role) {
  if (typeof role !== 'string') return ROLES.MEMBER
  const normalized = role.trim().toLowerCase()
  return ALL_ROLES.includes(normalized) ? normalized : ROLES.MEMBER
}

export function getRoleLabel(role) {
  return ROLE_LABELS[normalizeRole(role)] || 'Member'
}

export function canViewProjects() {
  return true
}

export function canCreateProject(role) {
  const r = normalizeRole(role)
  return r === ROLES.OWNER || r === ROLES.ADMIN
}

export function canEditProject(role) {
  const r = normalizeRole(role)
  return r === ROLES.OWNER || r === ROLES.ADMIN
}

export function canDeleteProject(role) {
  const r = normalizeRole(role)
  return r === ROLES.OWNER || r === ROLES.ADMIN
}

export function canViewTasks() {
  return true
}

export function canCreateTask(role) {
  const r = normalizeRole(role)
  return r === ROLES.OWNER || r === ROLES.ADMIN || r === ROLES.MEMBER
}

export function canCreateTaskInProject(role, userId, project, activeMemberIds = []) {
  const r = normalizeRole(role)
  if (r === ROLES.VIEWER) return false
  if (r === ROLES.OWNER || r === ROLES.ADMIN) return true
  if (project?.ownerId && userId && project.ownerId === userId) return true
  if (r === ROLES.MEMBER) {
    const authorized = Array.isArray(project?.authorizedMemberIds) ? project.authorizedMemberIds : []
    const activeSet = new Set(activeMemberIds)
    return authorized.includes(userId) && activeSet.has(userId)
  }
  return false
}

export function canManageProjectAuthorization(role, userId, project) {
  const r = normalizeRole(role)
  if (r === ROLES.OWNER || r === ROLES.ADMIN) return true
  if (project?.ownerId && userId && project.ownerId === userId) return true
  return false
}

export function canManageProjectEditorAuthorization(role, userId, project) {
  return canManageProjectAuthorization(role, userId, project)
}

export function canEditTaskInProject(role, userId, project, activeMemberIds = []) {
  const r = normalizeRole(role)
  if (r === ROLES.VIEWER) return false
  if (r === ROLES.OWNER || r === ROLES.ADMIN) return true
  if (project?.ownerId && userId && project.ownerId === userId) return true
  if (r === ROLES.MEMBER) {
    const authorized = Array.isArray(project?.authorizedTaskEditorIds) ? project.authorizedTaskEditorIds : []
    const activeSet = new Set(activeMemberIds)
    return Boolean(userId && authorized.includes(userId) && (activeMemberIds.length === 0 || activeSet.has(userId)))
  }
  return false
}

export function canDeleteTaskInProject(role, userId, project) {
  const r = normalizeRole(role)
  if (r === ROLES.VIEWER) return false
  if (r === ROLES.OWNER || r === ROLES.ADMIN) return true
  if (project?.ownerId && userId && project.ownerId === userId) return true
  return false
}

export function canEditTask(role, userId, project, activeMemberIds) {
  if (project !== undefined || userId !== undefined) {
    return canEditTaskInProject(role, userId, project, activeMemberIds)
  }
  const r = normalizeRole(role)
  return r === ROLES.OWNER || r === ROLES.ADMIN
}

export function canDeleteTask(role, userId, project) {
  if (project !== undefined || userId !== undefined) {
    return canDeleteTaskInProject(role, userId, project)
  }
  const r = normalizeRole(role)
  return r === ROLES.OWNER || r === ROLES.ADMIN
}

export function canMoveKanbanTask(role, userId, project, activeMemberIds) {
  if (project !== undefined || userId !== undefined) {
    return canEditTaskInProject(role, userId, project, activeMemberIds)
  }
  const r = normalizeRole(role)
  return r === ROLES.OWNER || r === ROLES.ADMIN
}

export function canClaimTask(role, task, userId) {
  const r = normalizeRole(role)
  if (r === ROLES.VIEWER) return false
  if (task?.claimedById && task.claimedById !== userId) return false
  return true
}

export function canReleaseTask(role, task, userId) {
  const r = normalizeRole(role)
  if (!task?.claimedById) return false
  if (r === ROLES.OWNER || r === ROLES.ADMIN) return true
  return task.claimedById === userId
}

export function canViewTeam() {
  return true
}

export function canManageMembers(role) {
  const r = normalizeRole(role)
  return r === ROLES.OWNER || r === ROLES.ADMIN
}

export function canInvite(actorRole) {
  const r = normalizeRole(actorRole)
  return r === ROLES.OWNER || r === ROLES.ADMIN
}

export function getInvitableRoles(actorRole) {
  const r = normalizeRole(actorRole)
  if (r === ROLES.OWNER) {
    return [ROLES.ADMIN, ROLES.MEMBER, ROLES.VIEWER]
  }
  if (r === ROLES.ADMIN) {
    return [ROLES.MEMBER, ROLES.VIEWER]
  }
  return []
}

export function canInviteRole(actorRole, targetRole) {
  const valid = getInvitableRoles(actorRole)
  return valid.includes(normalizeRole(targetRole))
}

export function canRemoveMember(actorRole, targetMemberRole) {
  const actor = normalizeRole(actorRole)
  const target = normalizeRole(targetMemberRole)
  if (target === ROLES.OWNER) return false
  if (actor === ROLES.OWNER) {
    return target === ROLES.ADMIN || target === ROLES.MEMBER || target === ROLES.VIEWER
  }
  if (actor === ROLES.ADMIN) {
    return target === ROLES.MEMBER || target === ROLES.VIEWER
  }
  return false
}

export function getAssignableRoles(actorRole, currentTargetRole) {
  const actor = normalizeRole(actorRole)
  const current = normalizeRole(currentTargetRole)
  if (current === ROLES.OWNER) return []
  if (actor === ROLES.OWNER) {
    return [ROLES.ADMIN, ROLES.MEMBER, ROLES.VIEWER]
  }
  if (actor === ROLES.ADMIN) {
    if (current === ROLES.ADMIN) return []
    return [ROLES.MEMBER, ROLES.VIEWER]
  }
  return []
}

export function canChangeMemberRole(actorRole, currentTargetRole, newTargetRole) {
  const actor = normalizeRole(actorRole)
  const current = normalizeRole(currentTargetRole)
  const next = normalizeRole(newTargetRole)
  if (current === ROLES.OWNER || next === ROLES.OWNER) return false
  if (current === next) return false
  const assignable = getAssignableRoles(actor, current)
  return assignable.includes(next)
}

export function canManageTeamSettings(role) {
  return normalizeRole(role) === ROLES.OWNER
}

export function canResetWorkspace(role) {
  return normalizeRole(role) === ROLES.OWNER
}

export function canImportData(role) {
  return normalizeRole(role) === ROLES.OWNER
}

export function assertPermission(allowed, message = 'You do not have permission to perform this action.') {
  if (!allowed) {
    const error = new Error(message)
    error.code = 'PERMISSION_DENIED'
    throw error
  }
}

export function getPermissions(role) {
  const r = normalizeRole(role)
  return {
    role: r,
    roleLabel: getRoleLabel(r),
    isOwner: r === ROLES.OWNER,
    isAdmin: r === ROLES.ADMIN,
    isMember: r === ROLES.MEMBER,
    isViewer: r === ROLES.VIEWER,

    canViewProjects: canViewProjects(r),
    canCreateProject: canCreateProject(r),
    canEditProject: canEditProject(r),
    canDeleteProject: canDeleteProject(r),

    canViewTasks: canViewTasks(r),
    canCreateTask: canCreateTask(r),
    canEditTask: canEditTask(r),
    canDeleteTask: canDeleteTask(r),
    canMoveKanbanTask: canMoveKanbanTask(r),
    canCreateTaskInProject: (userId, project, activeMemberIds) => canCreateTaskInProject(r, userId, project, activeMemberIds),
    canEditTaskInProject: (userId, project, activeMemberIds) => canEditTaskInProject(r, userId, project, activeMemberIds),
    canDeleteTaskInProject: (userId, project) => canDeleteTaskInProject(r, userId, project),
    canManageProjectAuthorization: (userId, project) => canManageProjectAuthorization(r, userId, project),
    canManageProjectEditorAuthorization: (userId, project) => canManageProjectEditorAuthorization(r, userId, project),
    canClaimTask: (task, userId) => canClaimTask(r, task, userId),
    canReleaseTask: (task, userId) => canReleaseTask(r, task, userId),

    canViewTeam: canViewTeam(r),
    canManageMembers: canManageMembers(r),
    canInvite: canInvite(r),
    invitableRoles: getInvitableRoles(r),
    canInviteRole: (targetRole) => canInviteRole(r, targetRole),
    canRemoveMember: (targetRole) => canRemoveMember(r, targetRole),
    canChangeMemberRole: (currentRole, nextRole) => canChangeMemberRole(r, currentRole, nextRole),
    getAssignableRoles: (targetRole) => getAssignableRoles(r, targetRole),

    canManageTeamSettings: canManageTeamSettings(r),
    canResetWorkspace: canResetWorkspace(r),
    canImportData: canImportData(r),
  }
}
