import {
  BarChart3,
  Bell,
  CalendarDays,
  KanbanSquare,
  Layers2,
  LayoutDashboard,
  Settings,
  UsersRound,
  FolderKanban,
  ListTodo,
  X,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import useApp from '../../hooks/useApp.js'

const navigation = [
  { label: 'Dashboard', to: '/dashboard', Icon: LayoutDashboard },
  { label: 'Projects', to: '/projects', Icon: FolderKanban },
  { label: 'Tasks', to: '/tasks', Icon: ListTodo },
  { label: 'Kanban Board', to: '/kanban', Icon: KanbanSquare },
  { label: 'Calendar', to: '/calendar', Icon: CalendarDays },
  { label: 'Team', to: '/team', Icon: UsersRound },
  { label: 'Analytics', to: '/analytics', Icon: BarChart3 },
  { label: 'Notifications', to: '/notifications', Icon: Bell },
  { label: 'Settings', to: '/settings', Icon: Settings },
]

export default function Sidebar({ isOpen, onClose }) {
  const { workspace, currentTeam } = useApp()
  const taskViewPath = { tasks: '/tasks', kanban: '/kanban', calendar: '/calendar' }[workspace.preferences.defaultTaskView] || '/tasks'
  return (
    <>
      {isOpen && (
        <button
          aria-label="Close navigation menu"
          className="fb-sidebar-backdrop"
          onClick={onClose}
          type="button"
        />
      )}
      <aside
        aria-label="Main navigation"
        className={`fb-sidebar${isOpen ? ' fb-sidebar--open' : ''}`}
        id="fb-sidebar"
      >
        <div className="fb-sidebar__top">
          <NavLink aria-label="FlowBoard home" className="fb-brand" onClick={onClose} to="/dashboard">
            <span className="fb-brand__mark"><Layers2 aria-hidden="true" /></span>
            <span>FlowBoard</span>
          </NavLink>
          <button
            aria-label="Close navigation menu"
            className="fb-icon-button fb-sidebar__close"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" />
          </button>
        </div>

        <p className="fb-sidebar__label">Workspace</p>
        <nav className="fb-sidebar__nav">
          {navigation.map(({ label, to: initialTo, Icon }) => {
            const to = label === 'Tasks' ? taskViewPath : initialTo
            return (
            <NavLink
              className={({ isActive }) => `fb-nav-link${isActive ? ' is-active' : ''}`}
              end={to === '/dashboard'}
              key={to}
              onClick={onClose}
              to={to}
            >
              <Icon aria-hidden="true" className="fb-nav-link__icon" />
              <span>{label}</span>
            </NavLink>
            )
          })}
        </nav>

        <div className="fb-sidebar__footer">
          <span className="fb-sidebar__footer-mark" aria-hidden="true">F</span>
          <span className="fb-sidebar__footer-copy">
            <strong>{currentTeam?.name || workspace.preferences.workspaceName}</strong>
            <span>{workspace.preferences.workspaceName || currentTeam?.name || 'Workspace'}</span>
          </span>
        </div>
      </aside>
    </>
  )
}
