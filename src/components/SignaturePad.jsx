import { useRef, useEffect, useState, useCallback } from 'react'
import {
  Box, Button, Typography, Dialog, DialogTitle,
  DialogContent, DialogActions, useTheme, useMediaQuery,
} from '@mui/material'
import { Clear, Draw, Check, ZoomOutMap } from '@mui/icons-material'

function Canvas({ onChange, color = '#1B4F72', lineWidth = 2.5 }) {
  const canvasRef = useRef(null)
  const drawing   = useRef(false)
  const lastPos   = useRef(null)

  const resize = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect   = canvas.parentElement.getBoundingClientRect()
    const img    = canvas.toDataURL()
    canvas.width  = rect.width  * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    const ctx    = canvas.getContext('2d')
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    const image  = new Image()
    image.onload = () => ctx.drawImage(image, 0, 0, rect.width, rect.height)
    image.src    = img
  }, [])

  useEffect(() => {
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [resize])

  const getPos = (e) => {
    const canvas = canvasRef.current
    const rect   = canvas.getBoundingClientRect()
    const src    = e.touches ? e.touches[0] : e
    return { x: src.clientX - rect.left, y: src.clientY - rect.top }
  }

  const startDraw = (e) => {
    e.preventDefault()
    drawing.current = true
    const pos = getPos(e)
    lastPos.current = pos
    const ctx = canvasRef.current.getContext('2d')
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, lineWidth / 4, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
  }

  const draw = (e) => {
    if (!drawing.current) return
    e.preventDefault()
    const ctx = canvasRef.current.getContext('2d')
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = color
    ctx.lineWidth   = lineWidth
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
    ctx.stroke()
    lastPos.current = pos
  }

  const stopDraw = (e) => {
    if (!drawing.current) return
    e.preventDefault()
    drawing.current = false
    onChange(canvasRef.current.toDataURL())
  }

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height: '100%', cursor: 'crosshair', touchAction: 'none' }}
      onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
      onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
    />
  )
}

function SignatureDialog({ open, onClose, onConfirm, label }) {
  const [sig, setSig]     = useState('')
  const [hasDrawn, setHasDrawn] = useState(false)
  const canvasKey         = useRef(0)

  const handleChange = (data) => { setSig(data); setHasDrawn(true) }
  const handleClear  = () => { canvasKey.current += 1; setSig(''); setHasDrawn(false) }
  const handleConfirm = () => { onConfirm(sig); onClose() }

  return (
    <Dialog open={open} onClose={onClose} fullScreen PaperProps={{ sx: { bgcolor: '#f8fafc' } }}>
      <DialogTitle sx={{ background: 'linear-gradient(135deg, #1B4F72, #2980B9)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Draw />
          <Typography variant="h6" sx={{ color: '#fff', fontSize: { xs: 15, sm: 18 } }}>{label}</Typography>
        </Box>
        <Button onClick={onClose} sx={{ color: 'rgba(255,255,255,0.8)', minWidth: 0 }}>Annuler</Button>
      </DialogTitle>
      <DialogContent sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          Signez dans le cadre ci-dessous avec votre doigt ou le stylet
        </Typography>
        <Box sx={{ flex: 1, minHeight: 300, border: '2px dashed #2980B9', borderRadius: 3, bgcolor: '#fff', position: 'relative', overflow: 'hidden', boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.05)' }}>
          <Canvas key={canvasKey.current} onChange={handleChange} lineWidth={3} />
          {!hasDrawn && (
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <Draw sx={{ fontSize: 48, color: '#ddd', mb: 1 }} />
              <Typography variant="body2" sx={{ color: '#bbb' }}>Appuyez et glissez pour signer</Typography>
            </Box>
          )}
          <Box sx={{ position: 'absolute', bottom: '25%', left: '5%', right: '5%', height: '1px', bgcolor: '#e0e0e0', pointerEvents: 'none' }} />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1, bgcolor: '#fff', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
        <Button variant="outlined" color="error" startIcon={<Clear />} onClick={handleClear} sx={{ flex: 1 }}>Effacer</Button>
        <Button variant="contained" startIcon={<Check />} onClick={handleConfirm} disabled={!hasDrawn} sx={{ flex: 2 }}>Valider la signature</Button>
      </DialogActions>
    </Dialog>
  )
}

export default function SignaturePad({ label, value, onChange, disabled = false }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const theme    = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.75, display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 }}>
        <Draw sx={{ fontSize: 14 }} /> {label}
      </Typography>
      <Box
        onClick={() => !disabled && setDialogOpen(true)}
        sx={{
          border: '1.5px solid', borderColor: value ? 'primary.main' : '#d0d7de',
          borderRadius: 2, height: { xs: 80, sm: 90 },
          bgcolor: disabled ? '#f5f5f5' : (value ? 'rgba(27,79,114,0.03)' : '#fafafa'),
          cursor: disabled ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden', transition: 'all 0.2s',
          '&:hover': !disabled ? { borderColor: 'primary.main', bgcolor: 'rgba(27,79,114,0.05)', boxShadow: '0 0 0 3px rgba(27,79,114,0.1)' } : {},
        }}
      >
        {value ? (
          <>
            <img src={value} alt="signature" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', display: 'block' }} />
            {!disabled && (
              <Box sx={{ position: 'absolute', top: 4, right: 4, display: 'flex', gap: 0.5 }}>
                <Button size="small" variant="outlined" color="primary" onClick={(e) => { e.stopPropagation(); setDialogOpen(true) }} sx={{ minWidth: 0, px: 1, py: 0.25, fontSize: 11 }}>Modifier</Button>
                <Button size="small" variant="outlined" color="error" onClick={(e) => { e.stopPropagation(); onChange('') }} sx={{ minWidth: 0, px: 1, py: 0.25, fontSize: 11 }}><Clear sx={{ fontSize: 14 }} /></Button>
              </Box>
            )}
          </>
        ) : (
          <Box sx={{ textAlign: 'center', color: '#aaa' }}>
            <ZoomOutMap sx={{ fontSize: 28, mb: 0.5, display: 'block', mx: 'auto' }} />
            <Typography variant="caption" sx={{ color: '#aaa' }}>{isMobile ? 'Appuyer pour signer' : 'Cliquer pour signer'}</Typography>
          </Box>
        )}
      </Box>
      <SignatureDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onConfirm={(sig) => onChange(sig)} label={label} />
    </Box>
  )
}
