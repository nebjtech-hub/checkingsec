import { useState, useEffect, useCallback } from 'react'
import {
  Box, Card, Typography, Chip, IconButton, Tooltip,
  Table, TableHead, TableRow, TableCell, TableBody,
  TableContainer, TablePagination, TextField, CircularProgress,
  InputAdornment, List, ListItem, ListItemText, ListItemButton,
  Divider, Avatar, useTheme, useMediaQuery,
} from '@mui/material'
import { Search, Visibility, AccessTime, ExitToApp } from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import RecordDetailDialog from '../components/RecordDetailDialog'

export default function AgentHistoryPage() {
  const { user }                = useAuth()
  const theme                   = useTheme()
  const isMobile                = useMediaQuery(theme.breakpoints.down('sm'))
  const [rows, setRows]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [page, setPage]         = useState(0)
  const rowsPerPage             = 15
  const [total, setTotal]       = useState(0)
  const [selected, setSelected] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('registre')
      .select('*', { count: 'exact' })
      .eq('agent_user_id', user.userId)
      .order('created_at', { ascending: false })
      .range(page * rowsPerPage, (page + 1) * rowsPerPage - 1)
    if (search) q = q.or(`nom.ilike.%${search}%,prenom.ilike.%${search}%,service_personne_visitee.ilike.%${search}%`)
    const { data, error, count } = await q
    if (!error) { setRows(data ?? []); setTotal(count ?? 0) }
    setLoading(false)
  }, [user.userId, page, rowsPerPage, search])

  useEffect(() => { load() }, [load])

  return (
    <Layout>
      <Typography variant="h5" sx={{ mb: 2, color: 'primary.main', fontSize: { xs: 18, sm: 24 } }}>
        Mon historique
      </Typography>

      <Card>
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          <TextField
            fullWidth size="small" placeholder="Rechercher par nom, prénom, service…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment>,
              sx: { borderRadius: 2 },
            }}
          />
        </Box>

        {/* Mobile: liste cards */}
        {isMobile ? (
          <Box>
            {loading ? (
              <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
            ) : rows.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">Aucun enregistrement</Typography>
              </Box>
            ) : (
              <List disablePadding>
                {rows.map((row, i) => (
                  <Box key={row.id}>
                    {i > 0 && <Divider />}
                    <ListItem disablePadding>
                      <ListItemButton onClick={() => setSelected(row)} sx={{ py: 1.5, px: 2 }}>
                        <Avatar sx={{ mr: 1.5, bgcolor: row.heure_sortie ? '#e0e0e0' : 'success.light', color: row.heure_sortie ? '#666' : 'success.dark', width: 40, height: 40, fontSize: 14, fontWeight: 700 }}>
                          {row.nom?.[0]}{row.prenom?.[0]}
                        </Avatar>
                        <ListItemText
                          primary={<Typography fontWeight={700}>{row.nom} {row.prenom}</Typography>}
                          secondary={
                            <Box component="span">
                              <Typography variant="caption" display="block" color="text.secondary">
                                {new Date(row.date_entree).toLocaleDateString('fr-FR')} · {row.service_personne_visitee}
                              </Typography>
                              <Box component="span" sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                                <Chip icon={<AccessTime sx={{ fontSize: '11px !important' }} />} label={row.heure_entree} size="small" sx={{ fontSize: 10 }} />
                                {row.heure_sortie && <Chip icon={<ExitToApp sx={{ fontSize: '11px !important' }} />} label={row.heure_sortie} size="small" sx={{ fontSize: 10 }} />}
                                <Chip label={row.heure_sortie ? 'Sorti' : 'Présent'} size="small" color={row.heure_sortie ? 'default' : 'success'} sx={{ fontSize: 10 }} />
                              </Box>
                            </Box>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  </Box>
                ))}
              </List>
            )}
          </Box>
        ) : (
          // Desktop: table
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  {['Date', 'Entrée', 'Nom', 'Prénom', 'Service visité', 'Sortie', 'Badge', 'Statut', ''].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
                ) : rows.length === 0 ? (
                  <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>Aucun enregistrement</TableCell></TableRow>
                ) : rows.map(row => (
                  <TableRow key={row.id} hover>
                    <TableCell>{new Date(row.date_entree).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell>{row.heure_entree}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{row.nom}</TableCell>
                    <TableCell>{row.prenom}</TableCell>
                    <TableCell sx={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.service_personne_visitee}</TableCell>
                    <TableCell>{row.heure_sortie || '—'}</TableCell>
                    <TableCell>{row.code_badge_remis || '—'}</TableCell>
                    <TableCell>
                      <Chip label={row.heure_sortie ? 'Sorti' : 'Présent'} size="small" color={row.heure_sortie ? 'default' : 'success'} sx={{ fontSize: 11 }} />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Voir détail">
                        <IconButton size="small" onClick={() => setSelected(row)}><Visibility fontSize="small" /></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <TablePagination
          component="div" count={total} page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage} rowsPerPageOptions={[15]}
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
        />
      </Card>

      {selected && <RecordDetailDialog record={selected} onClose={() => setSelected(null)} />}
    </Layout>
  )
}
