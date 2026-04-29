import { useState, useEffect, useCallback } from 'react'
import {
  Box, Card, Typography, Chip, IconButton, Tooltip,
  Table, TableHead, TableRow, TableCell, TableBody,
  TableContainer, TablePagination, TextField, CircularProgress,
  InputAdornment, List, ListItem, ListItemText, ListItemButton,
  Divider, Avatar, useTheme, useMediaQuery,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, FormControl, InputLabel, Select, MenuItem,
  Paper, Alert, Snackbar,
} from '@mui/material'
import {
  Search, Visibility, AccessTime, ExitToApp, Close, CheckCircle,
} from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import RecordDetailDialog from '../components/RecordDetailDialog'
import SignaturePad from '../components/SignaturePad'
import TimePicker from '../components/TimePicker'

// ─── Helpers ────────────────────────────────────────────────────────────────

function getNearestSlot() {
  const d = new Date()
  const total   = d.getHours() * 60 + d.getMinutes()
  const rounded = Math.round(total / 15) * 15
  const h = Math.floor(rounded / 60) % 24
  const m = rounded % 60
  return `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`
}

// ─── Dialog de sortie ────────────────────────────────────────────────────────

function CheckoutDialog({ record, onClose, onSuccess }) {
  const [heureSortie, setHeureSortie]         = useState(getNearestSlot())
  const [remisePiece, setRemisePiece]         = useState('Non')
  const [observations, setObservations]       = useState(record?.observations || '')
  const [signatureSortie, setSignatureSortie] = useState('')
  const [loading, setLoading]                 = useState(false)
  const [errors, setErrors]                   = useState({})

  if (!record) return null

  const validate = () => {
    const errs = {}
    if (!heureSortie) errs.heureSortie = 'Heure de sortie requise'
    return errs
  }

  const handleSubmit = async () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      const { error } = await supabase
        .from('registre')
        .update({
          heure_sortie:          heureSortie,
          signature_sortie:      signatureSortie || null,
          remise_piece_identite: remisePiece,
          observations:          observations,
        })
        .eq('id', record.id)
      if (error) throw error
      onSuccess({ ...record, heure_sortie: heureSortie, remise_piece_identite: remisePiece, observations })
    } catch (err) {
      setErrors({ submit: err.message })
    } finally {
      setLoading(false)
    }
  }

  const isRetroactive = record.date_entree !== new Date().toISOString().slice(0, 10)

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #1B4F72, #2980B9)', color: '#fff',
        py: 1.5,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ExitToApp />
          <Typography variant="h6" sx={{ color: '#fff', fontSize: { xs: 15, sm: 18 } }}>
            Enregistrer la sortie
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'rgba(255,255,255,0.8)' }} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2.5 }}>
        {/* Récap visiteur */}
        <Paper variant="outlined" sx={{
          p: 2, mb: 3, borderRadius: 2,
          bgcolor: 'rgba(27,79,114,0.04)', borderColor: 'primary.light',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44, fontSize: 16, fontWeight: 700 }}>
              {record.nom?.[0]}{record.prenom?.[0]}
            </Avatar>
            <Box>
              <Typography fontWeight={700}>{record.nom} {record.prenom}</Typography>
              <Typography variant="body2" color="text.secondary">{record.service_personne_visitee}</Typography>
              <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                <Chip
                  icon={<AccessTime sx={{ fontSize: '11px !important' }} />}
                  label={`Entré à ${record.heure_entree}`}
                  size="small" color="info" variant="outlined" sx={{ fontSize: 11 }}
                />
                {record.code_badge_remis && (
                  <Chip label={`Badge : ${record.code_badge_remis}`} size="small" color="warning" variant="outlined" sx={{ fontSize: 11 }} />
                )}
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Avertissement si sortie rétroactive */}
        {isRetroactive && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Entrée du {new Date(record.date_entree).toLocaleDateString('fr-FR')} — vous enregistrez une sortie différée.
          </Alert>
        )}

        {errors.submit && (
          <Alert severity="error" sx={{ mb: 2 }}>{errors.submit}</Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TimePicker
              label="Heure de sortie"
              value={heureSortie}
              onChange={(v) => { setHeureSortie(v); if (errors.heureSortie) setErrors(e => ({ ...e, heureSortie: undefined })) }}
              required
              error={!!errors.heureSortie}
              helperText={errors.heureSortie}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Remise de la pièce d'identité</InputLabel>
              <Select
                value={remisePiece}
                onChange={e => setRemisePiece(e.target.value)}
                label="Remise de la pièce d'identité"
              >
                <MenuItem value="Oui">Oui</MenuItem>
                <MenuItem value="Non">Non</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth label="Observations (sortie)"
              value={observations}
              onChange={e => setObservations(e.target.value)}
              multiline rows={2}
            />
          </Grid>
          <Grid item xs={12}>
            <SignaturePad
              label="Signature du visiteur à la sortie"
              value={signatureSortie}
              onChange={setSignatureSortie}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button variant="outlined" onClick={onClose} disabled={loading}>
          Annuler
        </Button>
        <Button
          variant="contained" color="success"
          startIcon={loading ? null : <CheckCircle />}
          onClick={handleSubmit}
          disabled={loading}
          sx={{ minWidth: 160 }}
        >
          {loading ? <CircularProgress size={22} color="inherit" /> : 'Valider la sortie'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Page principale ─────────────────────────────────────────────────────────

export default function AgentHistoryPage() {
  const { user }                    = useAuth()
  const theme                       = useTheme()
  const isMobile                    = useMediaQuery(theme.breakpoints.down('sm'))
  const [rows, setRows]             = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [page, setPage]             = useState(0)
  const rowsPerPage                 = 15
  const [total, setTotal]           = useState(0)
  const [selected, setSelected]     = useState(null)   // pour RecordDetailDialog
  const [checkoutRow, setCheckoutRow] = useState(null) // pour CheckoutDialog
  const [snack, setSnack]           = useState({ open: false, msg: '', severity: 'success' })

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

  // Met à jour la ligne en local après une sortie réussie (évite un rechargement complet)
  const handleCheckoutSuccess = (updatedRecord) => {
    setRows(prev => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r))
    setCheckoutRow(null)
    setSnack({ open: true, msg: `Sortie de ${updatedRecord.nom} ${updatedRecord.prenom} enregistrée.`, severity: 'success' })
  }

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

        {/* ── Mobile : liste cards ── */}
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
                    <ListItem
                      disablePadding
                      secondaryAction={
                        !row.heure_sortie && (
                          <Tooltip title="Enregistrer la sortie">
                            <IconButton
                              edge="end"
                              color="warning"
                              onClick={(e) => { e.stopPropagation(); setCheckoutRow(row) }}
                              sx={{ mr: 0.5 }}
                            >
                              <ExitToApp />
                            </IconButton>
                          </Tooltip>
                        )
                      }
                    >
                      <ListItemButton onClick={() => setSelected(row)} sx={{ py: 1.5, px: 2, pr: !row.heure_sortie ? 7 : 2 }}>
                        <Avatar sx={{
                          mr: 1.5,
                          bgcolor: row.heure_sortie ? '#e0e0e0' : 'success.light',
                          color: row.heure_sortie ? '#666' : 'success.dark',
                          width: 40, height: 40, fontSize: 14, fontWeight: 700,
                        }}>
                          {row.nom?.[0]}{row.prenom?.[0]}
                        </Avatar>
                        <ListItemText
                          primary={<Typography fontWeight={700}>{row.nom} {row.prenom}</Typography>}
                          secondary={
                            <Box component="span">
                              <Typography variant="caption" display="block" color="text.secondary">
                                {new Date(row.date_entree).toLocaleDateString('fr-FR')} · {row.service_personne_visitee}
                              </Typography>
                              <Box component="span" sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                                <Chip icon={<AccessTime sx={{ fontSize: '11px !important' }} />} label={row.heure_entree} size="small" sx={{ fontSize: 10 }} />
                                {row.heure_sortie && <Chip icon={<ExitToApp sx={{ fontSize: '11px !important' }} />} label={row.heure_sortie} size="small" sx={{ fontSize: 10 }} />}
                                <Chip
                                  label={row.heure_sortie ? 'Sorti' : 'Présent'}
                                  size="small"
                                  color={row.heure_sortie ? 'default' : 'success'}
                                  sx={{ fontSize: 10 }}
                                />
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
          // ── Desktop : table ──
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
                      <Chip
                        label={row.heure_sortie ? 'Sorti' : 'Présent'}
                        size="small"
                        color={row.heure_sortie ? 'default' : 'success'}
                        sx={{ fontSize: 11 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Voir détail">
                          <IconButton size="small" onClick={() => setSelected(row)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {!row.heure_sortie && (
                          <Tooltip title="Enregistrer la sortie">
                            <IconButton size="small" color="warning" onClick={() => setCheckoutRow(row)}>
                              <ExitToApp fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
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

      {/* Dialog détail */}
      {selected && <RecordDetailDialog record={selected} onClose={() => setSelected(null)} />}

      {/* Dialog sortie */}
      {checkoutRow && (
        <CheckoutDialog
          record={checkoutRow}
          onClose={() => setCheckoutRow(null)}
          onSuccess={handleCheckoutSuccess}
        />
      )}

      <Snackbar
        open={snack.open}
        autoHideDuration={5000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ width: '100%' }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Layout>
  )
}
