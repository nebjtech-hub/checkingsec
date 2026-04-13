import { useState, useEffect, useCallback } from 'react'
import {
  Box, Card, Typography, Chip, IconButton, Tooltip,
  Table, TableHead, TableRow, TableCell, TableBody,
  TableContainer, TablePagination, TextField, CircularProgress,
  InputAdornment, Button, Grid, MenuItem, Select,
  FormControl, InputLabel, Stack,
} from '@mui/material'
import { Search, Visibility, FileDownload, FilterAlt, Clear } from '@mui/icons-material'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import RecordDetailDialog from '../components/RecordDetailDialog'
import { exportToExcel } from '../lib/exportExcel'

const INITIAL_FILTERS = {
  dateFrom: '',
  dateTo:   '',
  search:   '',
  agent:    '',
}

export default function AdminRecordsPage() {
  const [rows, setRows]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [filters, setFilters]   = useState(INITIAL_FILTERS)
  const [agents, setAgents]     = useState([])
  const [page, setPage]         = useState(0)
  const [rowsPerPage]           = useState(15)
  const [total, setTotal]       = useState(0)
  const [selected, setSelected] = useState(null)
  const [exporting, setExporting] = useState(false)

  // Charger la liste des agents pour le filtre
  useEffect(() => {
    supabase.from('users').select('user_id, full_name').eq('role_id', 2).then(({ data }) => {
      if (data) setAgents(data)
    })
  }, [])

  const buildQuery = useCallback((q) => {
    if (filters.dateFrom) q = q.gte('date_entree', filters.dateFrom)
    if (filters.dateTo)   q = q.lte('date_entree', filters.dateTo)
    if (filters.agent)    q = q.eq('agent_user_id', filters.agent)
    if (filters.search)   q = q.or(`nom.ilike.%${filters.search}%,prenom.ilike.%${filters.search}%,service_personne_visitee.ilike.%${filters.search}%`)
    return q
  }, [filters])

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('registre')
      .select('*', { count: 'exact' })
      .order('date_entree', { ascending: false })
      .order('created_at', { ascending: false })
      .range(page * rowsPerPage, (page + 1) * rowsPerPage - 1)

    q = buildQuery(q)
    const { data, error, count } = await q
    if (!error) { setRows(data ?? []); setTotal(count ?? 0) }
    setLoading(false)
  }, [buildQuery, page, rowsPerPage])

  useEffect(() => { load() }, [load])

  const handleExport = async () => {
    setExporting(true)
    try {
      let q = supabase
        .from('registre')
        .select('*')
        .order('date_entree', { ascending: false })
      q = buildQuery(q)
      const { data } = await q
      await exportToExcel(data ?? [], 'registre_entrees')
    } finally {
      setExporting(false)
    }
  }

  const setFilter = (key) => (e) => {
    setFilters(f => ({ ...f, [key]: e.target.value }))
    setPage(0)
  }

  const clearFilters = () => { setFilters(INITIAL_FILTERS); setPage(0) }
  const hasFilters = Object.values(filters).some(Boolean)

  return (
    <Layout>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" sx={{ color: 'primary.main' }}>
          Tous les enregistrements
        </Typography>
        <Button
          variant="contained"
          startIcon={exporting ? <CircularProgress size={18} color="inherit" /> : <FileDownload />}
          onClick={handleExport}
          disabled={exporting}
          color="success"
        >
          Exporter Excel
        </Button>
      </Box>

      {/* Filtres */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <FilterAlt color="action" fontSize="small" />
          <Typography variant="subtitle2" fontWeight={700}>Filtres</Typography>
          {hasFilters && (
            <Chip label="Effacer" size="small" onDelete={clearFilters} deleteIcon={<Clear />} />
          )}
        </Stack>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth size="small" label="Date de début" type="date"
              value={filters.dateFrom} onChange={setFilter('dateFrom')}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth size="small" label="Date de fin" type="date"
              value={filters.dateTo} onChange={setFilter('dateTo')}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Agent</InputLabel>
              <Select value={filters.agent} onChange={setFilter('agent')} label="Agent">
                <MenuItem value="">Tous</MenuItem>
                {agents.map(a => (
                  <MenuItem key={a.user_id} value={a.user_id}>{a.full_name} ({a.user_id})</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth size="small" placeholder="Rechercher nom, prénom…"
              value={filters.search} onChange={setFilter('search')}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search color="action" fontSize="small" /></InputAdornment>,
              }}
            />
          </Grid>
        </Grid>
      </Card>

      <Card>
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          <Typography variant="body2" color="text.secondary">
            <b>{total}</b> enregistrement{total > 1 ? 's' : ''} trouvé{total > 1 ? 's' : ''}
          </Typography>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#F8FAFC' }}>
              <TableRow>
                {['Date', 'Entrée', 'Nom', 'Prénom', 'Service visité', 'Motif', 'Agent', 'Sortie', 'Statut', ''].map((h, i) => (
                  <TableCell key={i} sx={{ fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={10} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={10} align="center" sx={{ py: 4, color: 'text.secondary' }}>Aucun enregistrement</TableCell></TableRow>
              ) : rows.map(row => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{new Date(row.date_entree).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>{row.heure_entree}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{row.nom}</TableCell>
                  <TableCell>{row.prenom}</TableCell>
                  <TableCell sx={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.service_personne_visitee}</TableCell>
                  <TableCell sx={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.motif_visite}</TableCell>
                  <TableCell sx={{ fontSize: 11 }}>{row.agent_user_id}</TableCell>
                  <TableCell>{row.heure_sortie || '—'}</TableCell>
                  <TableCell>
                    <Chip
                      label={row.heure_sortie ? 'Sorti' : 'Présent'}
                      size="small"
                      color={row.heure_sortie ? 'default' : 'success'}
                      sx={{ fontSize: 11 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Voir détail">
                      <IconButton size="small" onClick={() => setSelected(row)}>
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[15]}
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
        />
      </Card>

      {selected && <RecordDetailDialog record={selected} onClose={() => setSelected(null)} />}
    </Layout>
  )
}
