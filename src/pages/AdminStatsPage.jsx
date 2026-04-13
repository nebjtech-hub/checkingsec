import { useState, useEffect } from 'react'
import {
  Box, Card, CardContent, Typography, Grid,
  CircularProgress, TextField, Button,
} from '@mui/material'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { exportToExcel } from '../lib/exportExcel'
import { FileDownload } from '@mui/icons-material'

// Simple bar chart using SVG
function BarChart({ data, color = '#1B4F72', height = 180 }) {
  if (!data || data.length === 0) return <Typography variant="body2" color="text.secondary">Aucune donnée</Typography>
  const max = Math.max(...data.map(d => d.value), 1)
  const barW = Math.max(20, Math.floor(400 / data.length) - 6)

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${Math.max(400, data.length * (barW + 6))} ${height + 40}`} style={{ width: '100%', display: 'block' }}>
        {data.map((d, i) => {
          const bh  = Math.round((d.value / max) * height)
          const x   = i * (barW + 6) + 3
          const y   = height - bh
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={bh} rx={4} fill={color} opacity={0.85} />
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={11} fill="#333" fontWeight="bold">{d.value}</text>
              <text x={x + barW / 2} y={height + 14} textAnchor="middle" fontSize={9} fill="#666"
                transform={data.length > 7 ? `rotate(-35, ${x + barW / 2}, ${height + 14})` : undefined}>
                {d.label?.length > 8 ? d.label.slice(0, 8) + '…' : d.label}
              </text>
            </g>
          )
        })}
      </svg>
    </Box>
  )
}

// Simple pie/donut chart
function DonutChart({ data, size = 160 }) {
  if (!data || data.length === 0) return <Typography variant="body2" color="text.secondary">Aucune donnée</Typography>
  const COLORS = ['#1B4F72','#148F77','#D68910','#6C3483','#C0392B','#2980B9','#27AE60']
  const total  = data.reduce((s, d) => s + d.value, 0)
  const cx = size / 2, cy = size / 2, R = size * 0.38, r = size * 0.22
  let angle = -Math.PI / 2

  const slices = data.map((d, i) => {
    const a    = (d.value / total) * 2 * Math.PI
    const x1   = cx + R * Math.cos(angle)
    const y1   = cy + R * Math.sin(angle)
    const x2   = cx + R * Math.cos(angle + a)
    const y2   = cy + R * Math.sin(angle + a)
    const xi1  = cx + r * Math.cos(angle)
    const yi1  = cy + r * Math.sin(angle)
    const xi2  = cx + r * Math.cos(angle + a)
    const yi2  = cy + r * Math.sin(angle + a)
    const large = a > Math.PI ? 1 : 0
    const path  = `M ${xi1} ${yi1} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${r} ${r} 0 ${large} 0 ${xi1} ${yi1} Z`
    angle += a
    return { path, color: COLORS[i % COLORS.length], label: d.label, value: d.value, pct: Math.round(d.value / total * 100) }
  })

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
      <svg width={size} height={size} style={{ flexShrink: 0 }}>
        {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} />)}
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize={14} fontWeight="bold" fill="#333">{total}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize={10} fill="#666">total</text>
      </svg>
      <Box>
        {slices.map((s, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: s.color, flexShrink: 0 }} />
            <Typography variant="caption">{s.label} <b>({s.pct}%)</b></Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

export default function AdminStatsPage() {
  const [data, setData]       = useState(null)
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 10)
  })
  const [dateTo, setDateTo]   = useState(new Date().toISOString().slice(0, 10))
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const load = async () => {
      setData(null)
      let q = supabase.from('registre').select('*')
      if (dateFrom) q = q.gte('date_entree', dateFrom)
      if (dateTo)   q = q.lte('date_entree', dateTo)
      const { data: rows } = await q

      if (!rows) return

      // Par jour
      const byDay = {}
      rows.forEach(r => {
        const d = r.date_entree?.slice(0, 10) || 'N/A'
        byDay[d] = (byDay[d] || 0) + 1
      })
      const dailyData = Object.entries(byDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([label, value]) => ({ label: label.slice(5), value }))

      // Par motif
      const byMotif = {}
      rows.forEach(r => { const k = r.motif_visite?.trim() || 'N/A'; byMotif[k] = (byMotif[k] || 0) + 1 })
      const motifData = Object.entries(byMotif).sort((a, b) => b[1] - a[1]).slice(0, 7).map(([label, value]) => ({ label, value }))

      // Par agent
      const byAgent = {}
      rows.forEach(r => { byAgent[r.agent_user_id] = (byAgent[r.agent_user_id] || 0) + 1 })
      const agentData = Object.entries(byAgent).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }))

      // Présents vs sortis
      const presents = rows.filter(r => !r.heure_sortie).length
      const sortis   = rows.filter(r =>  r.heure_sortie).length

      // Pièce vérifiée
      const pieceOui = rows.filter(r => r.piece_identite_verifiee === 'Oui').length
      const pieceNon = rows.length - pieceOui

      setData({ dailyData, motifData, agentData, presents, sortis, pieceOui, pieceNon, total: rows.length, raw: rows })
    }
    load()
  }, [dateFrom, dateTo])

  const handleExport = async () => {
    if (!data?.raw) return
    setExporting(true)
    try { await exportToExcel(data.raw, 'statistiques_registre') }
    finally { setExporting(false) }
  }

  return (
    <Layout>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" sx={{ color: 'primary.main' }}>Statistiques</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField size="small" label="Du" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField size="small" label="Au" type="date" value={dateTo}   onChange={e => setDateTo(e.target.value)}   InputLabelProps={{ shrink: true }} />
          <Button variant="outlined" startIcon={exporting ? <CircularProgress size={16} /> : <FileDownload />} onClick={handleExport} disabled={exporting || !data}>
            Exporter
          </Button>
        </Box>
      </Box>

      {!data ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={3}>
          {/* Résumé */}
          <Grid item xs={12}>
            <Grid container spacing={2}>
              {[
                { label: 'Total entrées', value: data.total,    color: '#1B4F72' },
                { label: 'Encore présents', value: data.presents, color: '#D68910' },
                { label: 'Sortis', value: data.sortis,          color: '#148F77' },
                { label: 'Pièce vérifiée', value: data.pieceOui, color: '#6C3483' },
              ].map(s => (
                <Grid key={s.label} item xs={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h3" fontWeight={700} sx={{ color: s.color }}>{s.value}</Typography>
                      <Typography variant="body2" color="text.secondary">{s.label}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Entrées par jour */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Entrées par jour</Typography>
                <BarChart data={data.dailyData} color="#2980B9" />
              </CardContent>
            </Card>
          </Grid>

          {/* Présents vs sortis */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Statut des visiteurs</Typography>
                <DonutChart data={[
                  { label: 'Présents', value: data.presents },
                  { label: 'Sortis',   value: data.sortis   },
                ]} />
              </CardContent>
            </Card>
          </Grid>

          {/* Par agent */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Entrées par agent</Typography>
                <BarChart data={data.agentData} color="#148F77" />
              </CardContent>
            </Card>
          </Grid>

          {/* Par motif */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Motifs de visite</Typography>
                <DonutChart data={data.motifData} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Layout>
  )
}
