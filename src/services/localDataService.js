import { mockProjects, mockTasks } from '../data/mockData.js'

export const APP_STORAGE_KEY = 'flowboard-workspace-data'
export const TEAM_WORKSPACE_KEY_PREFIX = 'flowboard-team-workspace'

export function getTeamWorkspaceKey(teamId) {
  return `${TEAM_WORKSPACE_KEY_PREFIX}:${teamId}`
}

export function loadAndMigrateTeamWorkspace(teamId, legacyUserIds = []) {
  if (!teamId) return getEmptyWorkspace()
  const key = getTeamWorkspaceKey(teamId)
  let raw = null
  try {
    raw = JSON.parse(window.localStorage?.getItem(key) || 'null')
  } catch {
    raw = null
  }

  if (raw && isRecord(raw) && Array.isArray(raw.projects) && Array.isArray(raw.tasks)) {
    return normalizeWorkspaceData(raw)
  }

  if (teamId === 'team-flowboard-core') {
    const base = getDemoData()
    const legacyKeys = [
      'flowboard-workspace-data:owner-permanent-mohamed',
      'flowboard-workspace-data:anonymous',
      'flowboard-workspace-data',
      ...legacyUserIds.map((uid) => `flowboard-workspace-data:${uid}`),
    ]

    const existingProjectIds = new Set(base.projects.map((p) => p.id))
    const existingTaskIds = new Set(base.tasks.map((t) => t.id))

    for (const legacyKey of legacyKeys) {
      try {
        const legacyRaw = JSON.parse(window.localStorage?.getItem(legacyKey) || 'null')
        if (legacyRaw && isRecord(legacyRaw)) {
          const normalizedLegacy = normalizeWorkspaceData(legacyRaw)
          for (const proj of normalizedLegacy.projects) {
            if (!existingProjectIds.has(proj.id)) {
              base.projects.push(proj)
              existingProjectIds.add(proj.id)
            }
          }
          for (const task of normalizedLegacy.tasks) {
            if (!existingTaskIds.has(task.id) && existingProjectIds.has(task.projectId)) {
              base.tasks.push(task)
              existingTaskIds.add(task.id)
            }
          }
          if (Array.isArray(normalizedLegacy.notifications)) {
            const notifIds = new Set(base.notifications.map((n) => n.id))
            for (const notif of normalizedLegacy.notifications) {
              if (!notifIds.has(notif.id)) {
                base.notifications.push(notif)
                notifIds.add(notif.id)
              }
            }
          }
        }
      } catch {
      }
    }

    base.preferences.workspaceName = 'FlowBoard Team'
    try {
      window.localStorage?.setItem(key, JSON.stringify(base))
    } catch {
    }
    return base
  }

  const empty = getEmptyWorkspace()
  try {
    window.localStorage?.setItem(key, JSON.stringify(empty))
  } catch {
  }
  return empty
}

export function getEmptyWorkspace() {
  return {
    projects: [],
    tasks: [],
    notifications: [],
    preferences: {
      ...DEFAULT_PREFERENCES,
      notifications: { ...DEFAULT_PREFERENCES.notifications },
    },
  }
}

const TASK_STATUSES = new Set(['todo', 'inProgress', 'inReview', 'completed'])
const TASK_PRIORITIES = new Set(['low', 'medium', 'high', 'urgent'])
const PROJECT_STATUSES = new Set(['active', 'completed', 'onHold'])
const NOTIFICATION_TYPES = new Set(['taskAssigned', 'taskCompleted', 'upcomingDeadline', 'overdueTask', 'projectCreated'])

export const DEFAULT_PREFERENCES = {
  notifications: { taskAssigned: true, taskCompleted: true, deadlines: true, projectCreated: true },
  defaultTaskView: 'tasks',
  workspaceName: 'Personal workspace',
}

export function getDemoData() {
  return {
    projects: mockProjects.map((project) => ({ ...project })),
    tasks: mockTasks.map((task) => ({ ...task })),
    notifications: [],
    preferences: {
      ...DEFAULT_PREFERENCES,
      notifications: { ...DEFAULT_PREFERENCES.notifications },
    },
  }
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function safeTimestamp(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? value : ''
}

function safeDateKey(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00`))
    ? value
    : ''
}

export function normalizeWorkspaceData(value) {
  const fallback = getEmptyWorkspace()
  if (!isRecord(value) || !Array.isArray(value.projects) || !Array.isArray(value.tasks)) return fallback

  const projects = value.projects
      .filter((project) => isRecord(project) && typeof project.id === 'string' && typeof project.name === 'string' && project.name.trim())
      .map((project) => ({
        id: project.id.slice(0, 120),
        name: project.name.trim().slice(0, 80),
        description: typeof project.description === 'string' ? project.description.slice(0, 240) : '',
        status: PROJECT_STATUSES.has(project.status) ? project.status : 'active',
        color: typeof project.color === 'string' && /^#[\da-f]{6}$/i.test(project.color) ? project.color : '#159D8A',
        createdAt: safeTimestamp(project.createdAt),
        startDate: safeDateKey(project.startDate),
        dueDate: safeDateKey(project.dueDate),
        ownerId: typeof project.ownerId === 'string' ? project.ownerId.slice(0, 120) : '',
        authorizedMemberIds: Array.isArray(project.authorizedMemberIds)
          ? project.authorizedMemberIds.filter((id) => typeof id === 'string').slice(0, 100)
          : [],
        authorizedTaskEditorIds: Array.isArray(project.authorizedTaskEditorIds)
          ? [...new Set(project.authorizedTaskEditorIds.filter((id) => typeof id === 'string'))].slice(0, 100)
          : [],
      }))
  const projectIds = new Set(projects.map((project) => project.id))
  const tasks = value.tasks
    .filter((task) => (
      isRecord(task)
      && typeof task.id === 'string'
      && typeof task.title === 'string'
      && task.title.trim()
      && typeof task.projectId === 'string'
      && projectIds.has(task.projectId)
      && TASK_STATUSES.has(task.status)
      && TASK_PRIORITIES.has(task.priority)
    )).map((task) => ({
      id: task.id.slice(0, 120),
      projectId: task.projectId.slice(0, 120),
      title: task.title.trim().slice(0, 160),
      description: typeof task.description === 'string' ? task.description.slice(0, 500) : '',
      status: task.status,
      priority: task.priority,
      dueDate: safeDateKey(task.dueDate),
      assignee: typeof task.assignee === 'string' ? task.assignee.slice(0, 80) : 'Unassigned',
      createdAt: safeTimestamp(task.createdAt),
      updatedAt: safeTimestamp(task.updatedAt),
      completedAt: safeTimestamp(task.completedAt) || null,
      ownerId: typeof task.ownerId === 'string' ? task.ownerId.slice(0, 120) : '',
      claimedById: typeof task.claimedById === 'string' ? task.claimedById.slice(0, 120) : null,
      claimedByName: typeof task.claimedByName === 'string' ? task.claimedByName.slice(0, 80) : null,
    }))

  const notifications = (Array.isArray(value.notifications) ? value.notifications : [])
    .filter((item) => isRecord(item) && typeof item.id === 'string' && NOTIFICATION_TYPES.has(item.type) && typeof item.title === 'string')
    .map((item) => ({
      id: item.id.slice(0, 160),
      type: item.type,
      title: item.title.slice(0, 120),
      description: typeof item.description === 'string' ? item.description.slice(0, 300) : '',
      createdAt: safeTimestamp(item.createdAt),
      read: item.read === true,
      taskId: typeof item.taskId === 'string' ? item.taskId.slice(0, 120) : '',
      projectId: typeof item.projectId === 'string' ? item.projectId.slice(0, 120) : '',
    }))
    .filter((item) => item.createdAt)
    .slice(0, 300)
  const rawPreferences = isRecord(value.preferences) ? value.preferences : {}
  const rawNotificationPreferences = isRecord(rawPreferences.notifications) ? rawPreferences.notifications : {}
  const preferences = {
    notifications: Object.fromEntries(Object.entries(DEFAULT_PREFERENCES.notifications).map(([key, defaultValue]) => [key, rawNotificationPreferences[key] !== false && defaultValue])),
    defaultTaskView: ['tasks', 'kanban', 'calendar'].includes(rawPreferences.defaultTaskView) ? rawPreferences.defaultTaskView : DEFAULT_PREFERENCES.defaultTaskView,
    workspaceName: typeof rawPreferences.workspaceName === 'string' && rawPreferences.workspaceName.trim()
      ? rawPreferences.workspaceName.trim().slice(0, 80)
      : DEFAULT_PREFERENCES.workspaceName,
  }

  return { projects, tasks, notifications, preferences }
}

export function validateWorkspaceImport(value) {
  if (!isRecord(value) || !Array.isArray(value.projects) || !Array.isArray(value.tasks)) {
    throw new Error('The file must contain project and task arrays exported by FlowBoard.')
  }
  if (value.notifications !== undefined && !Array.isArray(value.notifications)) throw new Error('Notifications data must be an array.')
  if (value.preferences !== undefined && !isRecord(value.preferences)) throw new Error('Preferences data is invalid.')
  const validDate = (date) => !date || safeDateKey(date) === date
  if (value.projects.some((project) => !isRecord(project)
    || typeof project.id !== 'string' || !project.id.trim()
    || typeof project.name !== 'string' || project.name.trim().length < 2
    || !PROJECT_STATUSES.has(project.status || 'active')
    || !validDate(project.startDate) || !validDate(project.dueDate))) {
    throw new Error('The file contains invalid project details or dates.')
  }
  if (value.tasks.some((task) => !isRecord(task)
    || typeof task.id !== 'string' || !task.id.trim()
    || typeof task.title !== 'string' || task.title.trim().length < 2
    || typeof task.projectId !== 'string' || !task.projectId
    || !TASK_STATUSES.has(task.status)
    || !TASK_PRIORITIES.has(task.priority)
    || !validDate(task.dueDate))) {
    throw new Error('The file contains invalid task details, statuses, priorities, or dates.')
  }
  const normalized = normalizeWorkspaceData(value)
  if (normalized.projects.length !== value.projects.length || normalized.tasks.length !== value.tasks.length
    || (value.notifications && normalized.notifications.length !== value.notifications.length)) {
    throw new Error('The file contains invalid projects, tasks, or project references.')
  }
  const projectIds = normalized.projects.map((item) => item.id)
  const taskIds = normalized.tasks.map((item) => item.id)
  if (new Set(projectIds).size !== projectIds.length || new Set(taskIds).size !== taskIds.length) {
    throw new Error('Project and task IDs must be unique.')
  }
  return normalized
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function createProject(input) {
  const name = typeof input?.name === 'string' ? input.name.trim() : ''
  if (name.length < 2 || name.length > 80) {
    throw new Error('Project name must be between 2 and 80 characters.')
  }

  return {
    id: createId(),
    name,
    description: typeof input.description === 'string' ? input.description.trim().slice(0, 240) : '',
    status: PROJECT_STATUSES.has(input?.status) ? input.status : 'active',
    color: typeof input?.color === 'string' && /^#[\da-f]{6}$/i.test(input.color) ? input.color : '#159D8A',
    createdAt: new Date().toISOString(),
    startDate: safeDateKey(input?.startDate),
    dueDate: safeDateKey(input?.dueDate),
    ownerId: typeof input?.ownerId === 'string' ? input.ownerId : '',
    authorizedMemberIds: Array.isArray(input?.authorizedMemberIds)
      ? input.authorizedMemberIds.filter((id) => typeof id === 'string')
      : [],
    authorizedTaskEditorIds: Array.isArray(input?.authorizedTaskEditorIds)
      ? [...new Set(input.authorizedTaskEditorIds.filter((id) => typeof id === 'string'))]
      : [],
  }
}

export function createTask(input) {
  const title = typeof input?.title === 'string' ? input.title.trim() : ''
  if (title.length < 2 || title.length > 160) throw new Error('Task title must be between 2 and 160 characters.')
  if (typeof input.projectId !== 'string' || !input.projectId) throw new Error('Choose a project for this task.')
  const status = TASK_STATUSES.has(input.status) ? input.status : 'todo'
  const now = new Date().toISOString()
  return {
    id: createId(), projectId: input.projectId, title,
    description: typeof input.description === 'string' ? input.description.trim().slice(0, 500) : '',
    status,
    priority: TASK_PRIORITIES.has(input.priority) ? input.priority : 'medium',
    dueDate: safeDateKey(input.dueDate), assignee: typeof input.assignee === 'string' ? input.assignee.trim().slice(0, 80) : '',
    createdAt: now, updatedAt: now, completedAt: status === 'completed' ? now : null,
    ownerId: typeof input.ownerId === 'string' ? input.ownerId : '',
    claimedById: null,
    claimedByName: null,
  }
}
