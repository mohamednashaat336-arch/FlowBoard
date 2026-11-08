function dateOffset(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function timestampOffset(days, hour = 10) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(hour, 0, 0, 0)
  return date.toISOString()
}

export const mockProjects = [
  {
    id: 'project-atlas',
    name: 'Atlas Mobile App',
    description: 'A focused mobile experience for the Atlas customer portal.',
    status: 'active',
    createdAt: timestampOffset(-42),
    dueDate: dateOffset(21),
  },
  {
    id: 'project-northstar',
    name: 'Northstar Website',
    description: 'A clearer product story and updated marketing site.',
    status: 'active',
    createdAt: timestampOffset(-31),
    dueDate: dateOffset(16),
  },
  {
    id: 'project-fieldnotes',
    name: 'Fieldnotes Research',
    description: 'Research synthesis and an internal findings library.',
    status: 'active',
    createdAt: timestampOffset(-20),
    dueDate: dateOffset(28),
  },
  {
    id: 'project-summit',
    name: 'Summit Brand Refresh',
    description: 'A completed visual refresh for the Summit team.',
    status: 'completed',
    createdAt: timestampOffset(-57),
    dueDate: dateOffset(-8),
  },
]

export const mockTasks = [
  { id: 'task-101', projectId: 'project-atlas', title: 'Review onboarding prototype', status: 'inReview', priority: 'high', dueDate: dateOffset(2), assignee: 'Nina Patel', createdAt: timestampOffset(-23), updatedAt: timestampOffset(-1), completedAt: null },
  { id: 'task-102', projectId: 'project-atlas', title: 'Build welcome screen', status: 'completed', priority: 'medium', dueDate: dateOffset(-6), assignee: 'Alex Morgan', createdAt: timestampOffset(-34), updatedAt: timestampOffset(-7), completedAt: timestampOffset(-7) },
  { id: 'task-103', projectId: 'project-atlas', title: 'Map analytics events', status: 'inProgress', priority: 'medium', dueDate: dateOffset(6), assignee: 'Jordan Lee', createdAt: timestampOffset(-5), updatedAt: timestampOffset(-1), completedAt: null },
  { id: 'task-104', projectId: 'project-atlas', title: 'Prepare release checklist', status: 'todo', priority: 'low', dueDate: dateOffset(12), assignee: 'Nina Patel', createdAt: timestampOffset(-2), updatedAt: timestampOffset(-2), completedAt: null },
  { id: 'task-201', projectId: 'project-northstar', title: 'Approve homepage direction', status: 'inProgress', priority: 'high', dueDate: dateOffset(3), assignee: 'Alex Morgan', createdAt: timestampOffset(-10), updatedAt: timestampOffset(-1), completedAt: null },
  { id: 'task-202', projectId: 'project-northstar', title: 'Write product overview', status: 'todo', priority: 'medium', dueDate: dateOffset(9), assignee: 'Sam Rivera', createdAt: timestampOffset(-4), updatedAt: timestampOffset(-3), completedAt: null },
  { id: 'task-203', projectId: 'project-northstar', title: 'Audit current site content', status: 'completed', priority: 'low', dueDate: dateOffset(-3), assignee: 'Jordan Lee', createdAt: timestampOffset(-27), updatedAt: timestampOffset(-4), completedAt: timestampOffset(-4) },
  { id: 'task-301', projectId: 'project-fieldnotes', title: 'Synthesize interview notes', status: 'inProgress', priority: 'high', dueDate: dateOffset(5), assignee: 'Sam Rivera', createdAt: timestampOffset(-8), updatedAt: timestampOffset(-2), completedAt: null },
  { id: 'task-302', projectId: 'project-fieldnotes', title: 'Share research themes', status: 'todo', priority: 'medium', dueDate: dateOffset(14), assignee: 'Nina Patel', createdAt: timestampOffset(-3), updatedAt: timestampOffset(-3), completedAt: null },
  { id: 'task-401', projectId: 'project-summit', title: 'Deliver updated brand guide', status: 'completed', priority: 'medium', dueDate: dateOffset(-9), assignee: 'Alex Morgan', createdAt: timestampOffset(-39), updatedAt: timestampOffset(-10), completedAt: timestampOffset(-10) },
  { id: 'task-402', projectId: 'project-summit', title: 'Present final identity system', status: 'completed', priority: 'high', dueDate: dateOffset(-12), assignee: 'Sam Rivera', createdAt: timestampOffset(-46), updatedAt: timestampOffset(-13), completedAt: timestampOffset(-13) },
]

export const mockTeamMembers = [
  { id: 'member-alex', name: 'Alex Morgan', email: 'alex.morgan@example.test', role: 'Workspace Owner', status: 'Active' },
  { id: 'member-nina', name: 'Nina Patel', email: 'nina.patel@example.test', role: 'Designer', status: 'Active' },
  { id: 'member-jordan', name: 'Jordan Lee', email: 'jordan.lee@example.test', role: 'Engineer', status: 'Active' },
  { id: 'member-sam', name: 'Sam Rivera', email: 'sam.rivera@example.test', role: 'Researcher', status: 'Active' },
]
