import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import NotificationToast from '../common/NotificationToast.jsx'
import useApp from '../../hooks/useApp.js'
import Header from './Header.jsx'
import Sidebar from './Sidebar.jsx'

export default function MainLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const { toast, dismissToast } = useApp()

  useEffect(() => {
    if (!isSidebarOpen) return undefined

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSidebarOpen(false)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isSidebarOpen])

  return (
    <div className="fb-app-shell">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="fb-app-main">
        <Header
          isSidebarOpen={isSidebarOpen}
          onMenuClick={() => setSidebarOpen((isOpen) => !isOpen)}
        />
        <main className="fb-page-content" id="main-content">
          <Outlet />
        </main>
      </div>
      <NotificationToast onDismiss={dismissToast} toast={toast} />
    </div>
  )
}
