import { useState, useEffect, useRef } from 'react'
import {
  Box, TextField, InputAdornment, IconButton, Paper,
  Typography, Button, Tooltip, Chip,
} from '@mui/material'
import { AccessTime, MyLocation, ExpandMore } from '@mui/icons-material'

// Génère toutes les tranches horaires de la journée (00h00 → 23h45, pas de 15 min)
function generateSlots() {
  const slots = []
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      slots.push(`${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`)
    }
  }
  return slots
}

const ALL_SLOTS = generateSlots()

// Formate l'heure courante au format 00h00
function nowFormatted() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`
}

// Trouve le slot le plus proche de l'heure courante
function nearestSlot() {
  const now = new Date()
  const totalMins = now.getHours() * 60 + now.getMinutes()
  const rounded = Math.round(totalMins / 15) * 15
  const h = Math.floor(rounded / 60) % 24
  const m = rounded % 60
  return `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`
}

export default function TimePicker({ label, value, onChange, required, error, helperText, autoFillOnMount = false }) {
  const [open, setOpen]       = useState(false)
  const [filter, setFilter]   = useState('')
  const containerRef          = useRef(null)
  const listRef               = useRef(null)

  // Remplissage automatique à l'affichage si demandé
  useEffect(() => {
    if (autoFillOnMount && !value) {
      onChange(nearestSlot())
    }
  }, []) // eslint-disable-line

  // Fermer en cliquant ailleurs
  useEffect(() => {
    if (!open) return
    const handle = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    document.addEventListener('touchstart', handle)
    return () => {
      document.removeEventListener('mousedown', handle)
      document.removeEventListener('touchstart', handle)
    }
  }, [open])

  // Scroll vers le slot actif quand on ouvre
  useEffect(() => {
    if (!open || !listRef.current) return
    const active = listRef.current.querySelector('[data-active="true"]')
    if (active) active.scrollIntoView({ block: 'center' })
  }, [open])

  const filtered = filter
    ? ALL_SLOTS.filter(s => s.includes(filter.replace(':', 'h').replace('h', 'h')))
    : ALL_SLOTS

  const handleSelect = (slot) => {
    onChange(slot)
    setOpen(false)
    setFilter('')
  }

  const handleNow = (e) => {
    e.stopPropagation()
    onChange(nearestSlot())
    setOpen(false)
  }

  // Grouper par heure pour affichage en bloc
  const grouped = {}
  filtered.forEach(s => {
    const h = s.split('h')[0]
    if (!grouped[h]) grouped[h] = []
    grouped[h].push(s)
  })

  return (
    <Box ref={containerRef} sx={{ position: 'relative' }}>
      <TextField
        fullWidth
        label={label}
        value={value}
        required={required}
        error={error}
        helperText={helperText}
        placeholder="00h00"
        onClick={() => setOpen(o => !o)}
        onChange={(e) => {
          onChange(e.target.value)
          setFilter(e.target.value)
          setOpen(true)
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <AccessTime color={value ? 'primary' : 'action'} fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title="Heure actuelle">
                <IconButton size="small" onClick={handleNow} tabIndex={-1}>
                  <MyLocation fontSize="small" color="primary" />
                </IconButton>
              </Tooltip>
              <IconButton size="small" onClick={() => setOpen(o => !o)} tabIndex={-1}>
                <ExpandMore fontSize="small" sx={{ transform: open ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
              </IconButton>
            </InputAdornment>
          ),
          readOnly: false,
          sx: { cursor: 'pointer', userSelect: 'none' },
        }}
        inputProps={{ style: { cursor: 'pointer' } }}
      />

      {open && (
        <Paper
          elevation={8}
          sx={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0, right: 0,
            zIndex: 1400,
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid rgba(27,79,114,0.2)',
          }}
        >
          {/* Bouton heure actuelle */}
          <Box sx={{ p: 1.5, borderBottom: '1px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              size="small"
              variant="contained"
              startIcon={<MyLocation fontSize="small" />}
              onClick={handleNow}
              sx={{ flex: 1, fontSize: 12 }}
            >
              Maintenant — {nowFormatted()}
            </Button>
          </Box>

          {/* Liste scrollable groupée par heure */}
          <Box
            ref={listRef}
            sx={{ maxHeight: 260, overflowY: 'auto', p: 1 }}
          >
            {Object.entries(grouped).map(([hour, slots]) => (
              <Box key={hour} sx={{ mb: 0.5 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, px: 0.5, display: 'block', mb: 0.25 }}>
                  {hour}h
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {slots.map(slot => (
                    <Chip
                      key={slot}
                      label={slot}
                      size="small"
                      data-active={slot === value ? 'true' : 'false'}
                      onClick={() => handleSelect(slot)}
                      color={slot === value ? 'primary' : 'default'}
                      variant={slot === value ? 'filled' : 'outlined'}
                      sx={{
                        fontSize: 12, cursor: 'pointer', borderRadius: 1.5,
                        fontWeight: slot === value ? 700 : 400,
                        '&:hover': { bgcolor: 'primary.light', color: '#fff', borderColor: 'primary.light' },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  )
}
