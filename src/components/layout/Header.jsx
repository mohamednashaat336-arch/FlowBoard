import { Bell, ChevronDown, Menu, X } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import SearchInput from '../common/SearchInput.jsx'
import ThemeToggle from '../common/ThemeToggle.jsx'
import useApp from '../../hooks/useApp.js'
import useAuth from '../../hooks/useAuth.js'
import usePermissions from '../../hooks/usePermissions.js'

const pageTitles = [
  [/^\/dashboard\/?$/, 'Dashboard'],
  [/^\/projects\/?$/, 'Projects'],
  [/^\/projects\/[^/]+\/?$/, 'Project Details'],
  [/^\/kanban\/?$/, 'Kanban Board'],
  [/^\/calendar\/?$/, 'Calendar'],
  [/^\/team\/?$/, 'Team'],
  [/^\/analytics\/?$/, 'Analytics'],
  [/^\/notifications\/?$/, 'Notifications'],
  [/^\/settings\/?$/, 'Settings'],
]

function getPageTitle(pathname) {
  return pageTitles.find(([pattern]) => pattern.test(pathname))?.[1] ?? 'FlowBoard'
}

export default function Header({ isSidebarOpen, onMenuClick }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()
  const { role, roleLabel } = usePermissions()
  const { currentTeam, userTeams, activeTeamId, switchTeam } = useApp()
  const title = getPageTitle(pathname)
  const fullName = currentUser?.fullName || 'User'
  const initials = fullName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase()

  function exitDemo(event) {
    event.currentTarget.closest('details')?.removeAttribute('open')
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="fb-header">
      <div className="fb-header__heading">
        <button
          aria-controls="fb-sidebar"
          aria-expanded={isSidebarOpen}
          aria-label={`${isSidebarOpen ? 'Close' : 'Open'} navigation menu`}
          className="fb-icon-button fb-header__menu"
          onClick={onMenuClick}
          type="button"
        >
          {isSidebarOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
        <div>
          <div className="fb-header__eyebrow-row">
            <p className="fb-header__eyebrow">{currentTeam?.name || 'Workspace'}</p>
            {userTeams && userTeams.length > 1 && (
              <select
                aria-label="Switch active team"
                className="fb-header__team-select"
                onChange={(event) => switchTeam(event.target.value)}
                value={activeTeamId}
              >
                {userTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <h1 className="fb-header__title">{title}</h1>
        </div>
      </div>

      <div className="fb-header__actions">
        <SearchInput
          aria-label="Search (coming soon)"
          className="fb-header__search"
          disabled
          label="Search workspace"
          title="Search will be available in a later phase."
        />
        <Link aria-label="Notifications" className="fb-icon-button fb-header__notification" to="/notifications">
          <Bell aria-hidden="true" />
        </Link>
        <ThemeToggle />
        <details className="fb-profile-menu">
          <summary aria-label="Open profile menu" className="fb-profile-menu__trigger">
            <span aria-hidden="true" className="fb-avatar">{initials}</span>
            <span className="fb-profile-menu__name">{fullName}</span>
            <span className={`fb-role-badge fb-role-badge--${role}`}>{roleLabel}</span>
            <ChevronDown aria-hidden="true" className="fb-profile-menu__chevron" />
          </summary>
          <div className="fb-profile-menu__panel">
            <div className="fb-profile-menu__identity">
              <div className="fb-profile-menu__title-row">
                <strong>{fullName}</strong>
                <span className={`fb-role-badge fb-role-badge--${role}`}>{roleLabel}</span>
              </div>
              <span>{currentUser?.email}</span>
            </div>
            <Link onClick={(event) => event.currentTarget.closest('details')?.removeAttribute('open')} to="/settings">Profile settings</Link>
            <button onClick={exitDemo} type="button">Exit</button>
          </div>
        </details>
      </div>
    </header>
  )
}
