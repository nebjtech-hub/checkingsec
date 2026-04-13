import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box, AppBar, Toolbar, Typography, IconButton, Avatar,
  Menu, MenuItem, Divider, Drawer, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Tooltip, BottomNavigation,
  BottomNavigationAction, Paper, useTheme, useMediaQuery,
} from '@mui/material'
import {
  AppRegistration, History, Dashboard, BarChart,
  Logout, Menu as MenuIcon, LocalHospital, Person,
  TableChart, ExitToApp,
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'

const DRAWER_WIDTH = 240

export default function Layout({ children }) {
  const { user, logout }       = useAuth()
  const navigate               = useNavigate()
  const location               = useLocation()
  const [anchorEl, setAnchor]  = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const theme    = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const agentNav = [
    { label: 'Entrée',    icon: <AppRegistration />, path: '/agent' },
    { label: 'Sortie',    icon: <ExitToApp />,        path: '/agent/checkout' },
    { label: 'Historique',icon: <History />,           path: '/agent/history' },
  ]

  const adminNav = [
    { label: 'Dashboard',        icon: <Dashboard />,   path: '/admin' },
    { label: 'Enregistrements',  icon: <TableChart />,  path: '/admin/records' },
    { label: 'Statistiques',     icon: <BarChart />,    path: '/admin/stats' },
  ]

  const navItems = user?.role === 'admin' ? adminNav : agentNav

  const handleLogout = () => { logout(); navigate('/login') }

  const currentNavValue = navItems.findIndex(n => n.path === location.pathname)

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2.5, background: 'linear-gradient(135deg, #1B4F72, #2980B9)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <LocalHospital sx={{ color: '#fff', fontSize: 28 }} />
        <Box>
          <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1.2 }}>Registre</Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
            {user?.role === 'admin' ? 'Administration' : 'Agent de sécurité'}
          </Typography>
        </Box>
      </Box>
      <List sx={{ flex: 1, pt: 1 }}>
        {navItems.map(item => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => { navigate(item.path); setMobileOpen(false) }}
              sx={{
                mx: 1, my: 0.25, borderRadius: 2,
                '&.Mui-selected': {
                  background: 'linear-gradient(135deg, rgba(27,79,114,0.12), rgba(41,128,185,0.08))',
                  color: 'primary.main',
                  '& .MuiListItemIcon-root': { color: 'primary.main' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 38 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Connecté en tant que</Typography>
        <Typography variant="body2" fontWeight={600}>{user?.fullName}</Typography>
        <Typography variant="caption" color="primary.main" fontWeight={600}>{user?.userId}</Typography>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar desktop/tablet */}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: 0 }}>
        <Drawer
          variant="permanent"
          sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', border: 'none', boxShadow: '2px 0 20px rgba(0,0,0,0.08)' } }}
          open
        >{drawer}</Drawer>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
        >{drawer}</Drawer>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', pb: { xs: 7, md: 0 } }}>
        {/* AppBar */}
        <AppBar position="static" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: '1px solid rgba(0,0,0,0.08)', color: 'text.primary' }}>
          <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
            <IconButton sx={{ mr: 1, display: { md: 'none' } }} onClick={() => setMobileOpen(true)}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flex: 1, color: 'primary.main', fontSize: { xs: 15, sm: 20 } }}>
              {navItems.find(n => n.path === location.pathname)?.label ?? 'Registre des Entrées'}
            </Typography>
            <Tooltip title={user?.fullName}>
              <IconButton onClick={e => setAnchor(e.currentTarget)}>
                <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14 }}>
                  {user?.fullName?.[0]}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchor(null)}>
          <MenuItem disabled>
            <Person sx={{ mr: 1, fontSize: 20 }} />
            <Box>
              <Typography variant="body2" fontWeight={600}>{user?.fullName}</Typography>
              <Typography variant="caption" color="text.secondary">{user?.role === 'admin' ? 'Administrateur' : 'Agent'}</Typography>
            </Box>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
            <Logout sx={{ mr: 1, fontSize: 20 }} /> Se déconnecter
          </MenuItem>
        </Menu>

        <Box component="main" sx={{ flex: 1, overflow: 'auto', p: { xs: 1.5, sm: 2, md: 3 } }}>
          {children}
        </Box>
      </Box>

      {/* Bottom nav mobile uniquement */}
      {isMobile && (
        <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1100, borderTop: '1px solid rgba(0,0,0,0.1)' }} elevation={3}>
          <BottomNavigation
            value={currentNavValue >= 0 ? currentNavValue : false}
            onChange={(_, v) => navigate(navItems[v].path)}
            showLabels
            sx={{ height: 58 }}
          >
            {navItems.map(item => (
              <BottomNavigationAction
                key={item.path}
                label={item.label}
                icon={item.icon}
                sx={{ minWidth: 0, '& .MuiBottomNavigationAction-label': { fontSize: 10 } }}
              />
            ))}
          </BottomNavigation>
        </Paper>
      )}
    </Box>
  )
}
