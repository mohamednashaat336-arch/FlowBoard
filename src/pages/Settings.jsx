import { useState } from 'react'
import { Settings2 } from 'lucide-react'
import useApp from '../hooks/useApp.js'
import useTheme from '../hooks/useTheme.js'

const preferenceLabels = [
  ['taskAssigned', 'Task assigned'],
  ['taskCompleted', 'Task completed'],
  ['deadlines', 'Upcoming or overdue deadlines'],
  ['projectCreated', 'Project created'],
]

export default function Settings() {
  const { workspace, updatePreferences } = useApp()
  const { theme, setTheme } = useTheme()
  const [workspaceNameDraft, setWorkspaceNameDraft] = useState(workspace.preferences.workspaceName)

  return <div className="fb-management-page fb-settings-page">
    <div className="fb-page-heading"><div><p className="fb-eyebrow">Workspace</p><h1>Settings</h1><p>Manage appearance, notifications, and workspace preferences.</p></div><Settings2 aria-hidden="true" className="fb-settings-heading-icon"/></div>
    <div className="row g-3">
      <div className="col-12 col-xl-7"><section className="fb-settings-panel"><div className="fb-settings-panel__heading"><h2>Appearance</h2><p>Choose the theme used throughout FlowBoard.</p></div><div className="fb-settings-control"><label htmlFor="settings-theme">Color theme</label><select id="settings-theme" className="fb-filter-select" onChange={event => setTheme(event.target.value)} value={theme}><option value="light">Light mode</option><option value="dark">Dark mode</option></select></div></section></div>
      <div className="col-12 col-xl-7"><section className="fb-settings-panel"><div className="fb-settings-panel__heading"><h2>Preferences</h2><p>These choices are saved in this browser.</p></div><label className="fb-settings-control"><span>Workspace name</span><input className="fb-settings-input" maxLength={80} onBlur={() => { const name = workspaceNameDraft.trim(); if (name) updatePreferences({ workspaceName: name }); else setWorkspaceNameDraft(workspace.preferences.workspaceName) }} onChange={event => setWorkspaceNameDraft(event.target.value)} value={workspaceNameDraft}/></label><div className="fb-settings-control"><label htmlFor="default-task-view">Default task view</label><select id="default-task-view" className="fb-filter-select" onChange={event => updatePreferences({ defaultTaskView: event.target.value })} value={workspace.preferences.defaultTaskView}><option value="tasks">Tasks list</option><option value="kanban">Kanban board</option><option value="calendar">Calendar</option></select></div><div className="fb-settings-panel__heading fb-settings-panel__subheading"><h3>In-app notifications</h3><p>Choose which local activity creates a notification.</p></div><div className="fb-settings-toggles">{preferenceLabels.map(([key, label]) => <label className="fb-settings-toggle" key={key}><span>{label}</span><input checked={workspace.preferences.notifications[key]} onChange={event => updatePreferences({ notifications: { [key]: event.target.checked } })} type="checkbox"/><span aria-hidden="true"/></label>)}</div></section></div>
    </div>
  </div>
}
