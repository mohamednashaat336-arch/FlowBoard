import { useCallback, useEffect, useMemo, useState } from 'react'
import useLocalStorage from '../hooks/useLocalStorage.js'
import {
  createProject,
  createTask,
  getDemoData,
  getEmptyWorkspace,
  getTeamWorkspaceKey,
  loadAndMigrateTeamWorkspace,
  normalizeWorkspaceData,
  validateWorkspaceImport,
} from '../services/localDataService.js'
import {
  DEFAULT_TEAM,
  acceptTeamInvitationRecord,
  addTeamMemberRecord,
  cancelTeamInvitationRecord,
  createTeamInvitationRecord,
  createTeamRecord,
  getTeamInvitations,
  getTeamMembers,
  getUserActiveTeams,
  getUserPendingInvitations,
  getUserTeamMembership,
  migrateTeamsAndMemberships,
  readActiveTeamId,
  readInvitations,
  readMemberships,
  readTeams,
  removeTeamMemberRecord,
  saveActiveTeamId,
  saveInvitations,
  saveMemberships,
  saveTeams,
  updateMemberRoleRecord,
} from '../services/teamService.js'
import { localDateKey } from '../utils/date.js'
import AppContext from './appContextValue.js'
import useAuth from '../hooks/useAuth.js'
import {
  assertPermission,
  canCreateProject,
  canCreateTask,
  canCreateTaskInProject,
  canManageProjectAuthorization,
  canDeleteProject,
  canDeleteTaskInProject,
  canEditProject,
  canEditTaskInProject,
  canImportData,
  canResetWorkspace,
  canReleaseTask,
  getPermissions,
  ROLES,
} from '../utils/permissions.js'

function TeamWorkspaceProvider({
  activeTeam,
  activeTeamId,
  currentTeamRole,
  currentMembership,
  userTeams,
  teams,
  memberships,
  teamMembers,
  teamInvitations,
  userPendingInvitations,
  switchTeam,
  createTeam,
  addMember,
  updateMemberRole,
  removeMember,
  addInvitation,
  cancelInvitation,
  acceptInvitation,
  currentUser,
  children,
}) {
  const permissions = useMemo(() => getPermissions(currentTeamRole), [currentTeamRole])
  const storageKey = getTeamWorkspaceKey(activeTeamId)
  const [storedData, setStoredData] = useLocalStorage(storageKey, () => loadAndMigrateTeamWorkspace(activeTeamId))
  const [toast, setToast] = useState(null)

  const data = useMemo(() => {
    if (!currentMembership || currentMembership.status !== 'active') {
      return getEmptyWorkspace()
    }
    return normalizeWorkspaceData(storedData)
  }, [storedData, currentMembership])

  const makeNotification = useCallback((type, title, description, references = {}) => ({
    id: globalThis.crypto?.randomUUID?.() ?? `notification-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    title,
    description,
    createdAt: new Date().toISOString(),
    read: false,
    taskId: references.taskId || '',
    projectId: references.projectId || '',
  }), [])

  const addProject = useCallback((input) => {
    assertPermission(canCreateProject(currentTeamRole), 'You do not have permission to create projects.')
    const project = createProject({ ...input, ownerId: currentUser?.id || '' })
    const notification = data.preferences.notifications.projectCreated
      ? makeNotification('projectCreated', 'Project created', `${project.name} was added to ${activeTeam.name}.`, { projectId: project.id })
      : null
    setStoredData((currentData) => {
      const safeData = normalizeWorkspaceData(currentData)
      const notifications = notification ? [notification, ...safeData.notifications].slice(0, 300) : safeData.notifications
      return { ...safeData, projects: [project, ...safeData.projects], notifications }
    })
    return project
  }, [setStoredData, makeNotification, data.preferences.notifications.projectCreated, currentUser, currentTeamRole, activeTeam.name])

  const updateProject = useCallback((id, input) => {
    assertPermission(canEditProject(currentTeamRole), 'You do not have permission to edit projects.')
    const existing = data.projects.find((item) => item.id === id)
    if (!existing) return undefined
    const updated = { ...existing, ...createProject({ ...input, ownerId: existing.ownerId || currentUser?.id || '' }), id, createdAt: existing.createdAt }
    setStoredData((currentData) => {
      const safe = normalizeWorkspaceData(currentData)
      return { ...safe, projects: safe.projects.map((item) => item.id === id ? updated : item) }
    })
    return updated
  }, [setStoredData, data.projects, currentUser, currentTeamRole])

  const deleteProject = useCallback((id) => {
    assertPermission(canDeleteProject(currentTeamRole), 'You do not have permission to delete projects.')
    setStoredData((currentData) => {
      const safe = normalizeWorkspaceData(currentData)
      return { ...safe, projects: safe.projects.filter((item) => item.id !== id), tasks: safe.tasks.filter((task) => task.projectId !== id) }
    })
  }, [setStoredData, currentTeamRole])

  const updateProjectAuthorization = useCallback((projectId, memberId, grant) => {
    const project = data.projects.find((p) => p.id === projectId)
    if (!project) throw new Error('Project not found.')
    assertPermission(
      canManageProjectAuthorization(currentTeamRole, currentUser?.id, project),
      'You do not have permission to manage task creation permissions for this project.',
    )
    setStoredData((currentData) => {
      const safe = normalizeWorkspaceData(currentData)
      return {
        ...safe,
        projects: safe.projects.map((p) => {
          if (p.id !== projectId) return p
          const existing = new Set(Array.isArray(p.authorizedMemberIds) ? p.authorizedMemberIds : [])
          if (grant) existing.add(memberId)
          else existing.delete(memberId)
          return { ...p, authorizedMemberIds: [...existing] }
        }),
      }
    })
  }, [setStoredData, data.projects, currentTeamRole, currentUser?.id])

  const updateProjectTaskEditorAuthorization = useCallback((projectId, memberId, grant) => {
    const project = data.projects.find((p) => p.id === projectId)
    if (!project) throw new Error('Project not found.')
    assertPermission(
      canManageProjectAuthorization(currentTeamRole, currentUser?.id, project),
      'You do not have permission to manage task editing permissions for this project.',
    )
    if (grant) {
      const isActive = teamMembers.some((m) => {
        const uid = m.userId || m.id
        return (uid === memberId || m.id === memberId) && (m.status || '').toLowerCase() === 'active'
      })
      if (!isActive) throw new Error('Only active team members can be granted edit permissions.')
    }
    setStoredData((currentData) => {
      const safe = normalizeWorkspaceData(currentData)
      return {
        ...safe,
        projects: safe.projects.map((p) => {
          if (p.id !== projectId) return p
          const existing = new Set(Array.isArray(p.authorizedTaskEditorIds) ? p.authorizedTaskEditorIds : [])
          if (grant) existing.add(memberId)
          else {
            existing.delete(memberId)
            const matched = teamMembers.find((m) => (m.userId || m.id) === memberId || m.id === memberId)
            if (matched?.id) existing.delete(matched.id)
            if (matched?.userId) existing.delete(matched.userId)
          }
          return { ...p, authorizedTaskEditorIds: [...existing] }
        }),
      }
    })
  }, [setStoredData, data.projects, currentTeamRole, currentUser?.id, teamMembers])

  const addTask = useCallback((input) => {
    assertPermission(canCreateTask(currentTeamRole), 'You do not have permission to create tasks.')
    const project = data.projects.find((item) => item.id === input?.projectId)
    if (!project) throw new Error('Choose an existing project for this task.')
    const activeMemberIds = teamMembers
      .filter((m) => (m.status || '').toLowerCase() === 'active')
      .flatMap((m) => [m.userId, m.id].filter(Boolean))
    assertPermission(
      canCreateTaskInProject(currentTeamRole, currentUser?.id, project, activeMemberIds),
      'You are not authorized to create tasks in this project.',
    )
    const task = createTask({ ...input, ownerId: currentUser?.id || '' })
    const notifications = []
    if (task.assignee && data.preferences.notifications.taskAssigned) {
      notifications.push(makeNotification('taskAssigned', 'Task assigned', `${task.title} was assigned to ${task.assignee}.`, { taskId: task.id, projectId: task.projectId }))
    }
    if (task.status === 'completed' && data.preferences.notifications.taskCompleted) {
      notifications.push(makeNotification('taskCompleted', 'Task completed', `${task.title} was marked complete in ${project.name}.`, { taskId: task.id, projectId: task.projectId }))
    }
    setStoredData((currentData) => {
      const safe = normalizeWorkspaceData(currentData)
      if (!safe.projects.some((p) => p.id === task.projectId)) return safe
      return { ...safe, tasks: [task, ...safe.tasks], notifications: [...notifications, ...safe.notifications].slice(0, 300) }
    })
    return task
  }, [setStoredData, makeNotification, data.projects, data.preferences.notifications, currentUser, currentTeamRole, teamMembers])

  const updateTask = useCallback((id, input) => {
    const existing = data.tasks.find((item) => item.id === id)
    if (!existing) return undefined
    const project = data.projects.find((item) => item.id === existing.projectId)
    if (!project) return undefined
    const activeMemberIds = teamMembers
      .filter((m) => (m.status || '').toLowerCase() === 'active')
      .flatMap((m) => [m.userId, m.id].filter(Boolean))
    assertPermission(
      canEditTaskInProject(currentTeamRole, currentUser?.id, project, activeMemberIds),
      'You do not have permission to edit tasks in this project.',
    )
    if (!data.projects.some((item) => item.id === input.projectId)) return undefined
    if (input.projectId !== existing.projectId) {
      const destProject = data.projects.find((item) => item.id === input.projectId)
      if (!destProject) return undefined
      assertPermission(
        canEditTaskInProject(currentTeamRole, currentUser?.id, destProject, activeMemberIds),
        'You do not have permission to edit tasks in the destination project.',
      )
    }
    const updated = { ...createTask({ ...input, ownerId: existing.ownerId || currentUser?.id || '' }), id, createdAt: existing.createdAt, updatedAt: new Date().toISOString() }
    updated.completedAt = updated.status === 'completed' ? (existing.completedAt || updated.updatedAt) : null
    const notifications = []
    if (existing.status !== 'completed' && updated.status === 'completed' && data.preferences.notifications.taskCompleted) {
      notifications.push(makeNotification('taskCompleted', 'Task completed', `${updated.title} was marked complete in ${project?.name || 'your project'}.`, { taskId: id, projectId: updated.projectId }))
    }
    if (updated.assignee && updated.assignee !== existing.assignee && data.preferences.notifications.taskAssigned) {
      notifications.push(makeNotification('taskAssigned', 'Task assigned', `${updated.title} was assigned to ${updated.assignee}.`, { taskId: id, projectId: updated.projectId }))
    }
    setStoredData((currentData) => {
      const safe = normalizeWorkspaceData(currentData)
      return { ...safe, tasks: safe.tasks.map((item) => item.id === id ? updated : item), notifications: [...notifications, ...safe.notifications].slice(0, 300) }
    })
    return updated
  }, [setStoredData, data.tasks, data.projects, data.preferences.notifications, makeNotification, currentUser, currentTeamRole, teamMembers])

  const deleteTask = useCallback((id) => {
    const existing = data.tasks.find((item) => item.id === id)
    if (!existing) return undefined
    const project = data.projects.find((item) => item.id === existing.projectId)
    assertPermission(
      canDeleteTaskInProject(currentTeamRole, currentUser?.id, project),
      'You do not have permission to delete tasks in this project.',
    )
    setStoredData((currentData) => {
      const safe = normalizeWorkspaceData(currentData)
      return { ...safe, tasks: safe.tasks.filter((item) => item.id !== id) }
    })
  }, [setStoredData, data.tasks, data.projects, currentTeamRole, currentUser?.id])

  const claimTask = useCallback((taskId) => {
    const task = data.tasks.find((t) => t.id === taskId)
    if (!task) throw new Error('Task not found.')
    assertPermission(canCreateTask(currentTeamRole), 'Viewers cannot claim tasks.')
    if (task.claimedById && task.claimedById !== currentUser?.id) {
      const err = new Error(`This task is already claimed by ${task.claimedByName || 'another user'}.`)
      err.code = 'PERMISSION_DENIED'
      throw err
    }
    setStoredData((currentData) => {
      const safe = normalizeWorkspaceData(currentData)
      return {
        ...safe,
        tasks: safe.tasks.map((t) =>
          t.id === taskId
            ? { ...t, claimedById: currentUser?.id || '', claimedByName: currentUser?.name || currentUser?.email || '' }
            : t
        ),
      }
    })
  }, [setStoredData, data.tasks, currentTeamRole, currentUser])

  const releaseTask = useCallback((taskId) => {
    const task = data.tasks.find((t) => t.id === taskId)
    if (!task) throw new Error('Task not found.')
    assertPermission(canReleaseTask(currentTeamRole, task, currentUser?.id), 'You are not authorized to release this task.')
    setStoredData((currentData) => {
      const safe = normalizeWorkspaceData(currentData)
      return {
        ...safe,
        tasks: safe.tasks.map((t) =>
          t.id === taskId ? { ...t, claimedById: null, claimedByName: null } : t
        ),
      }
    })
  }, [setStoredData, data.tasks, currentTeamRole, currentUser])

  const updatePreferences = useCallback((patch) => setStoredData((currentData) => {
    const safe = normalizeWorkspaceData(currentData)
    const nextNotifications = patch.notifications
      ? { ...safe.preferences.notifications, ...patch.notifications }
      : safe.preferences.notifications
    return { ...safe, preferences: { ...safe.preferences, ...patch, notifications: nextNotifications } }
  }), [setStoredData])

  const markNotificationRead = useCallback((id) => setStoredData((currentData) => {
    const safe = normalizeWorkspaceData(currentData)
    return { ...safe, notifications: safe.notifications.map((item) => item.id === id ? { ...item, read: true } : item) }
  }), [setStoredData])

  const markAllNotificationsRead = useCallback(() => setStoredData((currentData) => {
    const safe = normalizeWorkspaceData(currentData)
    return { ...safe, notifications: safe.notifications.map((item) => ({ ...item, read: true })) }
  }), [setStoredData])

  const deleteNotification = useCallback((id) => setStoredData((currentData) => {
    const safe = normalizeWorkspaceData(currentData)
    return { ...safe, notifications: safe.notifications.filter((item) => item.id !== id) }
  }), [setStoredData])

  const replaceWorkspace = useCallback((input) => {
    assertPermission(canImportData(currentTeamRole), 'You do not have permission to import workspace data.')
    const validated = validateWorkspaceImport(input)
    const scoped = {
      ...validated,
      projects: validated.projects.map((project) => ({ ...project, ownerId: project.ownerId || currentUser?.id || '' })),
      tasks: validated.tasks.map((task) => ({ ...task, ownerId: task.ownerId || currentUser?.id || '' })),
    }
    setStoredData(scoped)
    return scoped
  }, [setStoredData, currentUser, currentTeamRole])

  const resetWorkspace = useCallback(() => {
    assertPermission(canResetWorkspace(currentTeamRole), 'You do not have permission to reset workspace data.')
    const fallback = activeTeamId === DEFAULT_TEAM.id ? getDemoData() : getEmptyWorkspace()
    setStoredData(fallback)
  }, [setStoredData, currentTeamRole, activeTeamId])

  useEffect(() => {
    if (!data.preferences.notifications.deadlines) return
    const today = new Date()
    today.setHours(12, 0, 0, 0)
    const todayKey = localDateKey(today)
    const deadlineEnd = new Date(today)
    deadlineEnd.setDate(deadlineEnd.getDate() + 3)
    const deadlineEndKey = localDateKey(deadlineEnd)
    const projectsById = new Map(data.projects.map((project) => [project.id, project]))
    const additions = data.tasks.flatMap((task) => {
      if (!task.dueDate || task.status === 'completed') return []
      const type = task.dueDate < todayKey ? 'overdueTask' : task.dueDate <= deadlineEndKey ? 'upcomingDeadline' : ''
      if (!type) return []
      const project = projectsById.get(task.projectId)
      const label = type === 'overdueTask' ? 'Task overdue' : 'Upcoming deadline'
      return [{
        id: `deadline:${type}:${task.id}:${task.dueDate}`,
        type,
        title: label,
        description: `${task.title} · ${project?.name || 'Project'}${type === 'overdueTask' ? '' : ` is due ${task.dueDate}`}.`,
        createdAt: new Date().toISOString(),
        read: false,
        taskId: task.id,
        projectId: task.projectId,
      }]
    })
    if (!additions.some((item) => !data.notifications.some((saved) => saved.id === item.id))) return
    setStoredData((currentData) => {
      const safe = normalizeWorkspaceData(currentData)
      const existingIds = new Set(safe.notifications.map((item) => item.id))
      const missing = additions.filter((item) => !existingIds.has(item.id))
      return missing.length ? { ...safe, notifications: [...missing, ...safe.notifications].slice(0, 300) } : currentData
    })
  }, [data.tasks, data.projects, data.notifications, data.preferences.notifications.deadlines, setStoredData])

  const showToast = useCallback((message, type = 'success') => {
    setToast({ id: Date.now(), message, type })
  }, [])

  const dismissToast = useCallback(() => setToast(null), [])

  const value = useMemo(() => ({
    currentTeam: activeTeam,
    activeTeamId,
    currentTeamRole,
    currentMembership,
    userTeams,
    teams,
    memberships,
    teamMembers,
    teamInvitations,
    userPendingInvitations,
    switchTeam,
    createTeam,
    addMember,
    updateMemberRole,
    removeMember,
    addInvitation,
    cancelInvitation,
    acceptInvitation,

    permissions,

    projects: data.projects,
    tasks: data.tasks,
    workspace: data,

    addProject,
    updateProject,
    deleteProject,
    updateProjectAuthorization,
    updateProjectTaskEditorAuthorization,
    updateProjectEditorAuthorization: updateProjectTaskEditorAuthorization,
    addTask,
    updateTask,
    deleteTask,
    claimTask,
    releaseTask,
    updatePreferences,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    replaceWorkspace,
    resetWorkspace,

    toast,
    showToast,
    dismissToast,
  }), [
    activeTeam,
    activeTeamId,
    currentTeamRole,
    currentMembership,
    userTeams,
    teams,
    memberships,
    teamMembers,
    teamInvitations,
    userPendingInvitations,
    switchTeam,
    createTeam,
    addMember,
    updateMemberRole,
    removeMember,
    addInvitation,
    cancelInvitation,
    acceptInvitation,
    permissions,
    data,
    addProject,
    updateProject,
    deleteProject,
    updateProjectAuthorization,
    updateProjectTaskEditorAuthorization,
    addTask,
    updateTask,
    deleteTask,
    claimTask,
    releaseTask,
    updatePreferences,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    replaceWorkspace,
    resetWorkspace,
    toast,
    showToast,
    dismissToast,
  ])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function AppProvider({ children }) {
  const { currentUser, users = [] } = useAuth()

  const [teams, setTeams] = useState(() => migrateTeamsAndMemberships(users).teams)
  const [memberships, setMemberships] = useState(() => migrateTeamsAndMemberships(users).memberships)
  const [invitations, setInvitations] = useState(readInvitations)

  const userTeams = useMemo(() => {
    return getUserActiveTeams(currentUser?.id, teams, memberships)
  }, [currentUser?.id, teams, memberships])

  const [selectedTeamId, setSelectedTeamId] = useState(() => {
    const saved = readActiveTeamId(currentUser?.id)
    return saved || userTeams[0]?.id || DEFAULT_TEAM.id
  })

  const activeTeamId = useMemo(() => {
    if (userTeams.some((t) => t.id === selectedTeamId)) return selectedTeamId
    return userTeams[0]?.id || DEFAULT_TEAM.id
  }, [userTeams, selectedTeamId])

  const currentTeam = useMemo(() => {
    return teams.find((t) => t.id === activeTeamId) || userTeams[0] || DEFAULT_TEAM
  }, [teams, activeTeamId, userTeams])

  const currentMembership = useMemo(() => {
    return getUserTeamMembership(currentUser?.id, currentTeam.id, memberships)
  }, [currentUser?.id, currentTeam.id, memberships])

  const currentTeamRole = useMemo(() => {
    if (currentUser?.id === currentTeam.ownerId) return ROLES.OWNER
    return currentMembership?.role || ROLES.VIEWER
  }, [currentMembership, currentUser?.id, currentTeam.ownerId])

  const teamMembers = useMemo(() => {
    return getTeamMembers(currentTeam.id, users, memberships)
  }, [currentTeam.id, users, memberships])

  const teamInvitations = useMemo(() => {
    return getTeamInvitations(currentTeam.id, invitations)
  }, [currentTeam.id, invitations])

  const userPendingInvitations = useMemo(() => {
    return getUserPendingInvitations(currentUser?.email, invitations)
  }, [currentUser?.email, invitations])

  const switchTeam = useCallback((teamId) => {
    const target = userTeams.find((t) => t.id === teamId)
    if (!target) throw new Error('You do not have an active membership in this team.')
    setSelectedTeamId(target.id)
    saveActiveTeamId(currentUser?.id, target.id)
  }, [userTeams, currentUser?.id])

  const createTeam = useCallback(({ name, description }) => {
    if (!currentUser?.id) throw new Error('You must be logged in to create a team.')
    const { team, ownerMembership } = createTeamRecord({ name, description, ownerId: currentUser.id })
    const nextTeams = [...readTeams().filter((t) => t.id !== team.id), team]
    const nextMemberships = [...readMemberships().filter((m) => m.id !== ownerMembership.id), ownerMembership]
    saveTeams(nextTeams)
    saveMemberships(nextMemberships)
    setTeams(nextTeams)
    setMemberships(nextMemberships)
    setSelectedTeamId(team.id)
    saveActiveTeamId(currentUser.id, team.id)
    return team
  }, [currentUser])

  const addMember = useCallback(({ teamId = currentTeam.id, userId, role }) => {
    const newMembership = addTeamMemberRecord(currentTeamRole, { teamId, userId, role })
    const currentList = readMemberships()
    const existingIndex = currentList.findIndex((m) => m.teamId === teamId && m.userId === userId)
    let nextList
    if (existingIndex >= 0) {
      if (currentList[existingIndex].status === 'active') {
        throw new Error('User is already an active member of this team.')
      }
      nextList = currentList.map((m, idx) => idx === existingIndex ? { ...m, role: newMembership.role, status: 'active' } : m)
    } else {
      nextList = [...currentList, newMembership]
    }
    saveMemberships(nextList)
    setMemberships(nextList)
    return newMembership
  }, [currentTeam.id, currentTeamRole])

  const updateMemberRole = useCallback(({ teamId = currentTeam.id, targetUserId, newRole }) => {
    const currentList = readMemberships()
    const target = currentList.find((m) => m.teamId === teamId && m.userId === targetUserId)
    if (!target) throw new Error('Member not found in this team.')
    const updated = updateMemberRoleRecord(currentTeamRole, target, newRole)
    const nextList = currentList.map((m) => (m.id === target.id ? updated : m))
    saveMemberships(nextList)
    setMemberships(nextList)
    return updated
  }, [currentTeam.id, currentTeamRole])

  const removeMember = useCallback(({ teamId = currentTeam.id, targetUserId }) => {
    const currentList = readMemberships()
    const target = currentList.find((m) => m.teamId === teamId && m.userId === targetUserId)
    if (!target) throw new Error('Member not found in this team.')
    const updated = removeTeamMemberRecord(currentTeamRole, target)
    const nextList = currentList.map((m) => (m.id === target.id ? updated : m))
    saveMemberships(nextList)
    setMemberships(nextList)
    return updated
  }, [currentTeam.id, currentTeamRole])

  const addInvitation = useCallback(({ email, role }) => {
    const currentInvites = readInvitations()
    const newInvite = createTeamInvitationRecord(
      currentTeamRole,
      currentUser?.id,
      { teamId: currentTeam.id, email, role },
      { existingInvitations: currentInvites, activeMembers: teamMembers },
    )
    const next = [...currentInvites, newInvite]
    saveInvitations(next)
    setInvitations(next)
    return newInvite
  }, [currentTeamRole, currentUser?.id, currentTeam.id, teamMembers])

  const cancelInvitation = useCallback((invitationId) => {
    const currentInvites = readInvitations()
    const target = currentInvites.find((i) => i.id === invitationId)
    const updated = cancelTeamInvitationRecord(currentTeamRole, currentUser?.id, target)
    const next = currentInvites.map((i) => i.id === invitationId ? updated : i)
    saveInvitations(next)
    setInvitations(next)
    return updated
  }, [currentTeamRole, currentUser?.id])

  const acceptInvitation = useCallback((invitationId) => {
    const currentInvites = readInvitations()
    const target = currentInvites.find((i) => i.id === invitationId)
    const currentMemberships = readMemberships()
    const { membership, updatedInvitation } = acceptTeamInvitationRecord(target, currentUser, currentMemberships)

    const nextInvites = currentInvites.map((i) => i.id === invitationId ? updatedInvitation : i)
    const existingIndex = currentMemberships.findIndex((m) => m.teamId === membership.teamId && m.userId === currentUser.id)
    const nextMemberships = existingIndex >= 0
      ? currentMemberships.map((m, idx) => idx === existingIndex ? membership : m)
      : [...currentMemberships, membership]

    saveInvitations(nextInvites)
    saveMemberships(nextMemberships)
    setInvitations(nextInvites)
    setMemberships(nextMemberships)

    setSelectedTeamId(membership.teamId)
    saveActiveTeamId(currentUser?.id, membership.teamId)

    return membership
  }, [currentUser])

  return (
    <TeamWorkspaceProvider
      key={`${currentUser?.id || 'anonymous'}:${currentTeam.id}`}
      activeTeam={currentTeam}
      activeTeamId={currentTeam.id}
      currentTeamRole={currentTeamRole}
      currentMembership={currentMembership}
      userTeams={userTeams}
      teams={teams}
      memberships={memberships}
      teamMembers={teamMembers}
      teamInvitations={teamInvitations}
      userPendingInvitations={userPendingInvitations}
      switchTeam={switchTeam}
      createTeam={createTeam}
      addMember={addMember}
      updateMemberRole={updateMemberRole}
      removeMember={removeMember}
      addInvitation={addInvitation}
      cancelInvitation={cancelInvitation}
      acceptInvitation={acceptInvitation}
      currentUser={currentUser}
    >
      {children}
    </TeamWorkspaceProvider>
  )
}
