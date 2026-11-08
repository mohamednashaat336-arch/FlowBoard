import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { AppProvider } from './context/AppContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import useAuth from './hooks/useAuth.js'
import MainLayout from './components/layout/MainLayout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Projects from './pages/Projects.jsx'
import ProjectDetails from './pages/ProjectDetails.jsx'
import Tasks from './pages/Tasks.jsx'
import Kanban from './pages/Kanban.jsx'
import Calendar from './pages/Calendar.jsx'
import DemoAccess from './pages/DemoAccess.jsx'

const Team = lazy(() => import('./pages/Team.jsx'))
const Analytics = lazy(() => import('./pages/Analytics.jsx'))
const Notifications = lazy(() => import('./pages/Notifications.jsx'))
const Settings = lazy(() => import('./pages/Settings.jsx'))

function ProtectedWorkspace({ children }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  return isAuthenticated ? children : <Navigate replace state={{ from: location.pathname }} to="/login" />
}

function PublicDemoRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate replace to="/dashboard" /> : children
}

function WorkspaceProvider({ children }) {
  const { currentUser } = useAuth()
  return <AppProvider key={currentUser?.id || 'anonymous'}>{children}</AppProvider>
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WorkspaceProvider>
          <BrowserRouter>
            <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route element={<ProtectedWorkspace><MainLayout /></ProtectedWorkspace>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:projectId" element={<ProjectDetails />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/kanban" element={<Kanban />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/team" element={<Suspense fallback={<div aria-busy="true" className="fb-panel">Loading team…</div>}><Team /></Suspense>} />
              <Route path="/analytics" element={<Suspense fallback={<div aria-busy="true" className="fb-panel">Loading analytics…</div>}><Analytics /></Suspense>} />
              <Route path="/notifications" element={<Suspense fallback={<div aria-busy="true" className="fb-panel">Loading notifications…</div>}><Notifications /></Suspense>} />
              <Route path="/settings" element={<Suspense fallback={<div aria-busy="true" className="fb-panel">Loading settings…</div>}><Settings /></Suspense>} />
            </Route>
            <Route path="/login" element={<PublicDemoRoute><DemoAccess /></PublicDemoRoute>} />
            <Route path="/register" element={<PublicDemoRoute><DemoAccess mode="register" /></PublicDemoRoute>} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </WorkspaceProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
