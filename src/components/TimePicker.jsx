import { useState, useEffect, useRef } from 'react'
import {
  Box, TextField, InputAdornment, IconButton, Paper,
  Typography, Button, Chip, Tooltip,
} from '@mui/material'
import { AccessTime, MyLocation, ExpandMore } from '@mui/icons-material'

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

function nowFormatted() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}h${String(d.getMinutes()).padStart(2, '0')}`
}

function nearestSlot() {
  const d = new Date()
  const total   = d.getHours() * 60 + d.getMinutes()
  const rounded = Math.round(total / 15) * 15
  const h = Math.floor(rounded / 60) % 24
  const m = rounded % 60
  return `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`
}

export default function TimePicker({ label, value, onChange, required, error, helperText }) {
  const [open, setOpen]     = useState(false)
  const [filter, setFilter] = useState('')
  const containerRef        = useRef(null)
  const listRef             = useRef(null)

  // Fermer au clic extérieur
  useEffect(() => {
    if (!open) return
    const handle = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        setFilter('')
      }
    }
    document.addEventListener('mousedown', handle)
    document.addEventListener('touchstart', handle)
    return () => {
      document.removeEventListener('mousedown', handle)
      document.removeEventListener('touchstart', handle)
    }
  }, [open])

  // Scroll vers le slot actif à l'ouverture
  useEffect(() => {
    if (!open || !listRef.current) return
    setTimeout(() => {
      const active = listRef.current?.querySelector('[data-active="true"]')
      if (active) active.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }, 50)
  }, [open])

  const filtered = filter
    ? ALL_SLOTS.filter(s => s.includes(filter))
    : ALL_SLOTS

  // Grouper par heure
  const grouped = {}
  filtered.forEach(s => {
    const h = s.split('h')[0]
    if (!grouped[h]) grouped[h] = []
    grouped[h].push(s)
  })

  const handleSelect = (slot) => {
    onChange(slot)
    setOpen(false)
    setFilter('')
  }

  const handleNow = (e) => {
    e.stopPropagation()
    onChange(nearestSlot())
    setOpen(false)
    setFilter('')
  }

  const handleInputChange = (e) => {
    const v = e.target.value
    onChange(v)
    setFilter(v)
    setOpen(true)
  }

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
        onChange={handleInputChange}
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
                <ExpandMore
                  fontSize="small"
                  sx={{ transform: open ? 'rotate(180deg)' : 'none', transition: '0.2s' }}
                />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      {open && (
        <Paper elevation={8} sx={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0, right: 0,
          zIndex: 1400,
          borderRadius: 2,
          overflow: 'hidden',
          border: '1px solid rgba(27,79,114,0.2)',
        }}>
          {/* Bouton Maintenant */}
          <Box sx={{ p: 1.5, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
            <Button
              size="small" fullWidth
              variant="contained"
              startIcon={<MyLocation fontSize="small" />}
              onClick={handleNow}
              sx={{ fontSize: 12 }}
            >
              Maintenant — {nowFormatted()}
            </Button>
          </Box>

          {/* Liste scrollable groupée */}
          <Box ref={listRef} sx={{ maxHeight: 260, overflowY: 'auto', p: 1 }}>
            {Object.keys(grouped).length === 0 ? (
              <Typography variant="caption" color="text.secondary" sx={{ p: 1 }}>
                Aucun créneau trouvé
              </Typography>
            ) : Object.entries(grouped).map(([hour, slots]) => (
              <Box key={hour} sx={{ mb: 0.75 }}>
                <Typography variant="caption" sx={{
                  color: 'text.secondary', fontWeight: 700,
                  px: 0.5, display: 'block', mb: 0.25,
                }}>
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
                        '&:hover': { bgcolor: 'primary.main', color: '#fff' },
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
