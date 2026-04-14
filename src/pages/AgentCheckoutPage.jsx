import { useState, useCallback, useEffect } from 'react'
import {
  Box, Card, CardContent, Typography, TextField, Button,
  CircularProgress, Alert, Snackbar, Grid, Chip, Divider,
  InputAdornment, List, ListItem, ListItemButton, ListItemText,
  ListItemAvatar, Avatar, FormControl, InputLabel, Select,
  MenuItem, Fade, Paper, IconButton,
} from '@mui/material'
import {
  Search, ExitToApp, Person, AccessTime, Badge,
  ArrowBack, CheckCircle,
} from '@mui/icons-material'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import SignaturePad from '../components/SignaturePad'
import TimePicker from '../components/TimePicker'
import Layout from '../components/Layout'

function getNearestSlot() {
  const d = new Date()
  const total = d.getHours() * 60 + d.getMinutes()
  const rounded = Math.round(total / 15) * 15
  const h = Math.floor(rounded / 60) % 24
  const m = rounded % 60
  return `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`
}


const STEP_FORM   = 'form'
const STEP_DONE   = 'done'

export default function AgentCheckoutPage() {
  const { user }               = useAuth()
  const [step, setStep]        = useState(STEP_SEARCH)
  const [query, setQuery]      = useState('')
  const [results, setResults]  = useState([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected]= useState(null)
  const [loading, setLoading]  = useState(false)
  const [snack, setSnack]      = useState({ open: false, msg: '', severity: 'success' })

  // Champs de sortie
  const [heureSortie, setHeureSortie]              = useState('')
  const [signatureSortie, setSignatureSortie]      = useState('')
  const [remisePiece, setRemisePiece]              = useState('Non')
  const [observations, setObservations]            = useState('')
  const [errors, setErrors]                        = useState({})

  const search = useCallback(async (q) => {
    if (q.trim().length < 2) { setResults([]); return }
    setSearching(true)
    const { data } = await supabase
      .from('registre')
      .select('*')
      .is('heure_sortie', null)              // Seulement les visiteurs encore présents
      .eq('date_entree', new Date().toISOString().slice(0, 10))  // Aujourd'hui
      .or(`nom.ilike.%${q}%,prenom.ilike.%${q}%,code_badge_remis.ilike.%${q}%,service_personne_visitee.ilike.%${q}%`)
      .order('heure_entree', { ascending: false })
      .limit(10)
    setResults(data ?? [])
    setSearching(false)
  }, [])

  const handleQuery = (e) => {
    const v = e.target.value
    setQuery(v)
    search(v)
  }

  const selectVisitor = (record) => {
    setSelected(record)
    setObservations(record.observations || '')
    setRemisePiece('Non')
    setHeureSortie(getNearestSlot())   // Auto-rempli à l'heure actuelle
    setSignatureSortie('')
    setErrors({})
    setStep(STEP_FORM)
  }

  const validate = () => {
    const errs = {}
    if (!heureSortie) errs.heureSortie = "Heure de sortie requise"
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
          signature_sortie:      signatureSortie,
          remise_piece_identite: remisePiece,
          observations:          observations,
        })
        .eq('id', selected.id)
      if (error) throw error
      setStep(STEP_DONE)
    } catch (err) {
      setSnack({ open: true, msg: `Erreur : ${err.message}`, severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setStep(STEP_SEARCH)
    setQuery('')
    setResults([])
    setSelected(null)
    setErrors({})
  }

  return (
    <Layout>
      <Typography variant="h5" sx={{ mb: 2, color: 'primary.main', fontSize: { xs: 18, sm: 24 } }}>
        Enregistrement de sortie
      </Typography>

      {/* ÉTAPE 1 — Recherche */}
      {step === STEP_SEARCH && (
        <Fade in>
          <Box>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                  Recherchez le visiteur par son nom, prénom, badge ou service visité
                </Typography>
                <TextField
                  fullWidth
                  autoFocus
                  value={query}
                  onChange={handleQuery}
                  placeholder="Nom, prénom, numéro de badge…"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        {searching ? <CircularProgress size={20} /> : <Search color="action" />}
                      </InputAdornment>
                    ),
                    sx: { fontSize: { xs: 16, sm: 14 }, borderRadius: 2 },
                  }}
                  sx={{ '& input': { fontSize: { xs: 16, sm: 14 } } }}
                />
              </CardContent>
            </Card>

            {query.length >= 2 && !searching && results.length === 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Aucun visiteur présent trouvé pour « {query} » aujourd'hui.
              </Alert>
            )}

            {results.length > 0 && (
              <Card>
                <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                  <Box sx={{ px: 2, py: 1.5, bgcolor: '#F8FAFC', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      {results.length} visiteur{results.length > 1 ? 's' : ''} présent{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
                    </Typography>
                  </Box>
                  <List disablePadding>
                    {results.map((r, i) => (
                      <Box key={r.id}>
                        {i > 0 && <Divider />}
                        <ListItem disablePadding>
                          <ListItemButton onClick={() => selectVisitor(r)} sx={{ py: 1.5, px: 2 }}>
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: 'primary.light', width: 44, height: 44 }}>
                                {r.nom?.[0]}{r.prenom?.[0]}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography fontWeight={700} sx={{ fontSize: { xs: 15, sm: 14 } }}>
                                  {r.nom} {r.prenom}
                                </Typography>
                              }
                              secondary={
                                <Box component="span" sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                  <Chip icon={<AccessTime sx={{ fontSize: '12px !important' }} />} label={`Entré à ${r.heure_entree}`} size="small" sx={{ fontSize: 11 }} />
                                  <Chip icon={<Person sx={{ fontSize: '12px !important' }} />}    label={r.service_personne_visitee} size="small" sx={{ fontSize: 11, maxWidth: 160, overflow: 'hidden' }} />
                                  {r.code_badge_remis && <Chip icon={<Badge sx={{ fontSize: '12px !important' }} />} label={`Badge : ${r.code_badge_remis}`} size="small" color="primary" variant="outlined" sx={{ fontSize: 11 }} />}
                                </Box>
                              }
                            />
                            <IconButton size="small" color="primary" sx={{ ml: 1 }}>
                              <ExitToApp />
                            </IconButton>
                          </ListItemButton>
                        </ListItem>
                      </Box>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}

            {/* Visiteurs présents du jour si pas de recherche */}
            {query.length < 2 && <PresentVisitorsList onSelect={selectVisitor} />}
          </Box>
        </Fade>
      )}

      {/* ÉTAPE 2 — Formulaire de sortie */}
      {step === STEP_FORM && selected && (
        <Fade in>
          <Box>
            <Button startIcon={<ArrowBack />} onClick={reset} sx={{ mb: 2 }} size="small">
              Retour à la recherche
            </Button>

            {/* Récapitulatif visiteur */}
            <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'rgba(27,79,114,0.04)', borderColor: 'primary.light' }}>
              <Typography variant="caption" color="primary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
                Visiteur sélectionné
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48, fontSize: 18, fontWeight: 700 }}>
                  {selected.nom?.[0]}{selected.prenom?.[0]}
                </Avatar>
                <Box>
                  <Typography fontWeight={700} fontSize={18}>{selected.nom} {selected.prenom}</Typography>
                  <Typography variant="body2" color="text.secondary">{selected.service_personne_visitee}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                    <Chip label={`Entré à ${selected.heure_entree}`} size="small" color="info"    variant="outlined" />
                    <Chip label={selected.motif_visite}              size="small" color="default" variant="outlined" sx={{ maxWidth: 180, overflow: 'hidden' }} />
                    {selected.code_badge_remis && <Chip label={`Badge : ${selected.code_badge_remis}`} size="small" color="warning" variant="outlined" />}
                  </Box>
                </Box>
              </Box>
            </Paper>

            {/* Formulaire sortie */}
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, color: 'primary.main' }}>
                  Informations de sortie
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TimePicker
                      label="Heure de sortie"
                      value={heureSortie}
                      onChange={v => { setHeureSortie(v); if (errors.heureSortie) setErrors({}) }}
                      required
                      error={!!errors.heureSortie}
                      helperText={errors.heureSortie}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Remise de la pièce d'identité</InputLabel>
                      <Select value={remisePiece} onChange={e => setRemisePiece(e.target.value)} label="Remise de la pièce d'identité">
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
              </CardContent>
            </Card>

            <Box sx={{ display: 'flex', gap: 2, mt: 2, justifyContent: 'flex-end' }}>
              <Button variant="outlined" onClick={reset}>Annuler</Button>
              <Button
                variant="contained" color="success"
                startIcon={loading ? null : <ExitToApp />}
                onClick={handleSubmit}
                disabled={loading}
                sx={{ minWidth: 180 }}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Valider la sortie'}
              </Button>
            </Box>
          </Box>
        </Fade>
      )}

      {/* ÉTAPE 3 — Succès */}
      {step === STEP_DONE && (
        <Fade in>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, gap: 3 }}>
            <CheckCircle sx={{ fontSize: 80, color: 'success.main' }} />
            <Typography variant="h5" fontWeight={700} color="success.main" align="center">
              Sortie enregistrée !
            </Typography>
            <Typography variant="body1" color="text.secondary" align="center">
              {selected?.nom} {selected?.prenom} a quitté les locaux à {heureSortie}.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Button variant="contained" onClick={reset} startIcon={<Search />}>
                Nouvelle sortie
              </Button>
            </Box>
          </Box>
        </Fade>
      )}

      <Snackbar open={snack.open} autoHideDuration={5000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ width: '100%' }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Layout>
  )
}

// Sous-composant : liste des visiteurs présents du jour
function PresentVisitorsList({ onSelect }) {
  const [rows, setRows]       = useState(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const today = new Date().toISOString().slice(0, 10)
    const { data } = await supabase
      .from('registre')
      .select('*')
      .is('heure_sortie', null)
      .eq('date_entree', today)
      .order('heure_entree', { ascending: false })
    setRows(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <Card sx={{ mt: 2 }}>
      <Box sx={{ px: 2, py: 1.5, bgcolor: '#F8FAFC', borderBottom: '1px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          Visiteurs présents aujourd'hui
        </Typography>
        {rows !== null && <Chip label={rows.length} size="small" color={rows.length > 0 ? 'success' : 'default'} />}
      </Box>
      {loading || rows === null ? (
        <Box sx={{ py: 3, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
      ) : rows.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">Aucun visiteur présent pour le moment</Typography>
        </Box>
      ) : (
        <List disablePadding>
          {rows.map((r, i) => (
            <Box key={r.id}>
              {i > 0 && <Divider />}
              <ListItem disablePadding>
                <ListItemButton onClick={() => onSelect(r)} sx={{ py: 1.5, px: 2 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'success.light', color: 'success.dark', width: 40, height: 40, fontSize: 15, fontWeight: 700 }}>
                      {r.nom?.[0]}{r.prenom?.[0]}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography fontWeight={600}>{r.nom} {r.prenom}</Typography>}
                    secondary={
                      <Box component="span" sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.25 }}>
                        <Chip icon={<AccessTime sx={{ fontSize: '12px !important' }} />} label={r.heure_entree} size="small" sx={{ fontSize: 11 }} />
                        <Chip label={r.service_personne_visitee} size="small" sx={{ fontSize: 11, maxWidth: 160 }} />
                      </Box>
                    }
                  />
                  <Chip label="Sortie →" size="small" color="primary" variant="outlined" />
                </ListItemButton>
              </ListItem>
            </Box>
          ))}
        </List>
      )}
    </Card>
  )
}
