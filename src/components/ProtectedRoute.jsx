import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Box, CircularProgress } from '@mui/material'

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/agent'} replace />
  }

  return children
}
