import { useState, useEffect } from 'react'
import {
  Box, Card, CardContent, Typography, Grid, Divider,
  CircularProgress, Table, TableHead, TableRow, TableCell,
  TableBody, LinearProgress, Chip,
} from '@mui/material'
import {
  People, PersonAdd, ExitToApp, TrendingUp,
  Today, CalendarMonth,
} from '@mui/icons-material'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

const StatCard = ({ icon, label, value, color, sub }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
      <Box sx={{
        width: 52, height: 52, borderRadius: 2.5, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `linear-gradient(135deg, ${color}22, ${color}44)`,
        color: color,
      }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="h4" fontWeight={700} sx={{ color, lineHeight: 1 }}>
          {value ?? <CircularProgress size={24} />}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{label}</Typography>
        {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
      </Box>
    </CardContent>
  </Card>
)

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    const load = async () => {
      const today     = new Date().toISOString().slice(0, 10)
      const monthStart = today.slice(0, 7) + '-01'

      const [total, todayR, present, monthR, byAgent, byMotif, recent] = await Promise.all([
        supabase.from('registre').select('id', { count: 'exact', head: true }),
        supabase.from('registre').select('id', { count: 'exact', head: true }).eq('date_entree', today),
        supabase.from('registre').select('id', { count: 'exact', head: true }).eq('date_entree', today).is('heure_sortie', null),
        supabase.from('registre').select('id', { count: 'exact', head: true }).gte('date_entree', monthStart),
        supabase.from('registre').select('agent_user_id').gte('date_entree', monthStart),
        supabase.from('registre').select('motif_visite').gte('date_entree', monthStart),
        supabase.from('registre').select('*').order('created_at', { ascending: false }).limit(5),
      ])

      // Agréger par agent
      const agentMap = {}
      ;(byAgent.data ?? []).forEach(r => {
        agentMap[r.agent_user_id] = (agentMap[r.agent_user_id] || 0) + 1
      })
      const agentRanking = Object.entries(agentMap)
        .map(([id, count]) => ({ id, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Agréger par motif
      const motifMap = {}
      ;(byMotif.data ?? []).forEach(r => {
        const key = r.motif_visite?.trim() || 'Non spécifié'
        motifMap[key] = (motifMap[key] || 0) + 1
      })
      const motifRanking = Object.entries(motifMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)

      setStats({
        total:    total.count   ?? 0,
        today:    todayR.count  ?? 0,
        present:  present.count ?? 0,
        month:    monthR.count  ?? 0,
        agentRanking,
        motifRanking,
        recent:   recent.data   ?? [],
        maxAgent: agentRanking[0]?.count || 1,
      })
    }
    load()
  }, [])

  return (
    <Layout>
      <Typography variant="h5" sx={{ mb: 3, color: 'primary.main' }}>
        Tableau de bord
      </Typography>

      {/* KPI cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<People />}     label="Total enregistrements"  value={stats?.total}   color="#1B4F72" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<Today />}      label="Entrées aujourd'hui"    value={stats?.today}   color="#148F77" sub="Aujourd'hui" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<PersonAdd />}  label="Visiteurs présents"     value={stats?.present} color="#D68910" sub="Sans heure de sortie" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<CalendarMonth />} label="Entrées ce mois"     value={stats?.month}   color="#6C3483" sub="Mois en cours" />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Top agents */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                Activité par agent (ce mois)
              </Typography>
              {!stats ? (
                <CircularProgress />
              ) : stats.agentRanking.length === 0 ? (
                <Typography color="text.secondary" variant="body2">Aucune donnée</Typography>
              ) : stats.agentRanking.map(({ id, count }) => (
                <Box key={id} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={600}>{id}</Typography>
                    <Typography variant="body2" color="primary.main" fontWeight={700}>{count}</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(count / stats.maxAgent) * 100}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Top motifs */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                Motifs de visite (ce mois)
              </Typography>
              {!stats ? (
                <CircularProgress />
              ) : stats.motifRanking.length === 0 ? (
                <Typography color="text.secondary" variant="body2">Aucune donnée</Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Motif</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: 12 }}>Entrées</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: 12 }}>%</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.motifRanking.map(([motif, count]) => (
                      <TableRow key={motif} hover>
                        <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{motif}</TableCell>
                        <TableCell align="right"><b>{count}</b></TableCell>
                        <TableCell align="right">{stats.month ? Math.round((count / stats.month) * 100) : 0}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Dernières entrées */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                5 dernières entrées
              </Typography>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    {['Date', 'Heure', 'Nom', 'Prénom', 'Service visité', 'Agent', 'Statut'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {!stats ? (
                    <TableRow><TableCell colSpan={7} align="center"><CircularProgress /></TableCell></TableRow>
                  ) : stats.recent.map(row => (
                    <TableRow key={row.id} hover>
                      <TableCell>{new Date(row.date_entree).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell>{row.heure_entree}</TableCell>
                      <TableCell fontWeight={600}>{row.nom}</TableCell>
                      <TableCell>{row.prenom}</TableCell>
                      <TableCell sx={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.service_personne_visitee}</TableCell>
                      <TableCell>{row.agent_user_id}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.heure_sortie ? 'Sorti' : 'Présent'}
                          size="small"
                          color={row.heure_sortie ? 'default' : 'success'}
                          sx={{ fontSize: 11 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Layout>
  )
}
