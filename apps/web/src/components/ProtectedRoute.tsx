import { Navigate } from 'react-router-dom'

type AccountRole = 'USER' | 'ADMIN' | 'MENTOR'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: AccountRole[]
}

export default function ProtectedRoute({
  children,
  allowedRoles = ['USER', 'ADMIN']
}: ProtectedRouteProps) {
  const token = localStorage.getItem('token')

  if (!token) {
    return <Navigate to="/login" replace />
  }

  let role: AccountRole | undefined
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (['USER', 'ADMIN', 'MENTOR'].includes(user.role)) {
      role = user.role
    }
  } catch {
    return <Navigate to="/login" replace />
  }

  if (!role) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={role === 'MENTOR' ? '/mentor' : '/'} replace />
  }

  return <>{children}</>
}