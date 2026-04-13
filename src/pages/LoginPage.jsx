import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Card, CardContent, TextField, Button,
  Typography, Alert, InputAdornment, IconButton, CircularProgress,
} from '@mui/material'
import {
  Visibility, VisibilityOff, LocalHospital, Security,
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const [userId, setUserId]     = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { login }               = useAuth()
  const navigate                = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const u = await login(userId.trim(), password)
      navigate(u.role === 'admin' ? '/admin' : '/agent')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(160deg, #0D2137 0%, #1B4F72 50%, #148F77 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decoration */}
      {[...Array(5)].map((_, i) => (
        <Box key={i} sx={{
          position: 'absolute',
          width: `${100 + i * 80}px`,
          height: `${100 + i * 80}px`,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.06)',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }} />
      ))}

      <Card sx={{
        width: '100%', maxWidth: 420,
        mx: 2,
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(20px)',
      }}>
        <CardContent sx={{ p: 5 }}>
          {/* Logo area */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{
              width: 64, height: 64, borderRadius: 3,
              background: 'linear-gradient(135deg, #1B4F72, #2980B9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mx: 'auto', mb: 2,
              boxShadow: '0 8px 24px rgba(27,79,114,0.35)',
            }}>
              <LocalHospital sx={{ color: '#fff', fontSize: 32 }} />
            </Box>
            <Typography variant="h4" sx={{ color: 'primary.main', lineHeight: 1.2 }}>
              Registre des Entrées
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Système de gestion des visiteurs
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth label="Identifiant" value={userId}
              onChange={e => setUserId(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Security color="action" />
                  </InputAdornment>
                ),
              }}
              required autoFocus
            />
            <TextField
              fullWidth label="Mot de passe" value={password}
              onChange={e => setPassword(e.target.value)}
              type={showPwd ? 'text' : 'password'}
              sx={{ mb: 3 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPwd(v => !v)} edge="end">
                      {showPwd ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              required
            />
            <Button
              type="submit" variant="contained" fullWidth size="large"
              disabled={loading}
              sx={{ height: 52, fontSize: 16 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Se connecter'}
            </Button>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 3 }}>
            © {new Date().getFullYear()} — Sécurité Hospitalière
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
