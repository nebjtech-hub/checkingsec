import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import theme from './theme'
import ProtectedRoute from './components/ProtectedRoute'

import LoginPage           from './pages/LoginPage'
import AgentFormPage       from './pages/AgentFormPage'
import AgentCheckoutPage   from './pages/AgentCheckoutPage'
import AgentHistoryPage    from './pages/AgentHistoryPage'
import AdminDashboardPage  from './pages/AdminDashboardPage'
import AdminRecordsPage    from './pages/AdminRecordsPage'
import AdminStatsPage      from './pages/AdminStatsPage'

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'admin' ? '/admin' : '/agent'} replace />
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/"      element={<RootRedirect />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Agent */}
            <Route path="/agent"          element={<ProtectedRoute role="agent"><AgentFormPage     /></ProtectedRoute>} />
            <Route path="/agent/checkout" element={<ProtectedRoute role="agent"><AgentCheckoutPage /></ProtectedRoute>} />
            <Route path="/agent/history"  element={<ProtectedRoute role="agent"><AgentHistoryPage  /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin"          element={<ProtectedRoute role="admin"><AdminDashboardPage /></ProtectedRoute>} />
            <Route path="/admin/records"  element={<ProtectedRoute role="admin"><AdminRecordsPage   /></ProtectedRoute>} />
            <Route path="/admin/stats"    element={<ProtectedRoute role="admin"><AdminStatsPage     /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
