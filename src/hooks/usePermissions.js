import { useContext, useMemo } from 'react'
import useAuth from './useAuth.js'
import AppContext from '../context/appContextValue.js'
import { getPermissions } from '../utils/permissions.js'

export default function usePermissions() {
  const appContext = useContext(AppContext)
  const { currentUser } = useAuth()
  return useMemo(() => {
    if (appContext?.permissions) {
      return appContext.permissions
    }
    const role = appContext?.currentTeamRole || currentUser?.role
    return getPermissions(role)
  }, [appContext?.permissions, appContext?.currentTeamRole, currentUser?.role])
}
