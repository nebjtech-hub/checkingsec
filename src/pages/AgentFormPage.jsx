import { useState } from 'react'
import {
  Box, Card, CardContent, CardHeader, Grid, TextField, Button,
  Alert, Snackbar, Typography, Divider, CircularProgress,
  FormControl, InputLabel, Select, MenuItem,
  Stepper, Step, StepLabel, MobileStepper,
  useTheme, useMediaQuery,
} from '@mui/material'
import { Send, Refresh, KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import SignaturePad from '../components/SignaturePad'
import TimePicker from '../components/TimePicker'
import Layout from '../components/Layout'

const INITIAL = {
  date_entree:              new Date().toISOString().slice(0, 10),
  heure_entree:             '',
  nom:                      '',
  prenom:                   '',
  societe_organisme:        '',
  service_personne_visitee: '',
  motif_visite:             '',
  piece_identite_verifiee:  'Non',
  numero_piece:             '',
  code_badge_remis:         '',
  signature_entree:         '',
  observations:             '',
  agent_securite:           '',
}

function getNearestSlot() {
  const d = new Date()
  const total   = d.getHours() * 60 + d.getMinutes()
  const rounded = Math.round(total / 15) * 15
  const h = Math.floor(rounded / 60) % 24
  const m = rounded % 60
  return `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`
}

const STEPS = ["Identité du visiteur", "Visite & Pièce d'identité", "Badge & Signature"]

// ── Field défini HORS du composant pour éviter la perte de focus ──
function Field({ name, label, required, type = 'text', form, errors, onChange, ...rest }) {
  return (
    <TextField
      fullWidth label={label}
      value={form[name]}
      onChange={onChange(name)}
      error={!!errors[name]}
      helperText={errors[name]}
      required={required}
      type={type}
      InputLabelProps={type === 'date' ? { shrink: true } : undefined}
      {...rest}
    />
  )
}

export default function AgentFormPage() {
  const { user }              = useAuth()
  const theme                 = useTheme()
  const isMobile              = useMediaQuery(theme.breakpoints.down('sm'))
  const [form, setForm]       = useState({ ...INITIAL, agent_securite: user?.fullName ?? '', heure_entree: getNearestSlot() })
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [snack, setSnack]     = useState({ open: false, msg: '', severity: 'success' })

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target?.value ?? e }))
    if (errors[field]) setErrors(er => { const n = { ...er }; delete n[field]; return n })
  }

  const validateStep = (step) => {
    const errs = {}
    if (step === 0) {
      if (!form.date_entree)   errs.date_entree  = 'Requis'
      if (!form.heure_entree)  errs.heure_entree = 'Requis'
      if (!form.nom.trim())    errs.nom           = 'Requis'
      if (!form.prenom.trim()) errs.prenom        = 'Requis'
    }
    if (step === 1) {
      if (!form.service_personne_visitee) errs.service_personne_visitee = 'Requis'
      if (!form.motif_visite)             errs.motif_visite             = 'Requis'
    }
    if (step === 2) {
      if (!form.agent_securite) errs.agent_securite = "Nom de l'agent requis"
    }
    return errs
  }

  const handleNext = () => {
    const errs = validateStep(activeStep)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setActiveStep(s => s + 1)
  }

  const handleBack = () => setActiveStep(s => s - 1)

  const handleSubmit = async () => {
    const errs = validateStep(activeStep)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      const { error } = await supabase.from('registre').insert({ ...form, agent_user_id: user.userId })
      if (error) throw error
      setSnack({ open: true, msg: 'Entrée enregistrée avec succès !', severity: 'success' })
      setForm({ ...INITIAL, agent_securite: user?.fullName ?? '', heure_entree: getNearestSlot() })
      setErrors({})
      setActiveStep(0)
    } catch (err) {
      setSnack({ open: true, msg: `Erreur : ${err.message}`, severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const fieldProps = { form, errors, onChange: set }

  const renderStep = () => {
    if (activeStep === 0) return (
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Field name="date_entree" label="Date d'entrée" type="date" required {...fieldProps} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TimePicker
            label="Heure d'entrée"
            value={form.heure_entree}
            onChange={v => set('heure_entree')({ target: { value: v } })}
            required
            error={!!errors.heure_entree}
            helperText={errors.heure_entree}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Field name="nom" label="Nom" required inputProps={{ style: { textTransform: 'uppercase' } }} {...fieldProps} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Field name="prenom" label="Prénom" required {...fieldProps} />
        </Grid>
        <Grid item xs={12}>
          <Field name="societe_organisme" label="Société / Organisme" {...fieldProps} />
        </Grid>
      </Grid>
    )
    if (activeStep === 1) return (
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Field name="service_personne_visitee" label="Service / Personne visitée" required {...fieldProps} />
        </Grid>
        <Grid item xs={12}>
          <Field name="motif_visite" label="Motif de la visite" required multiline rows={3} {...fieldProps} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Pièce d'identité vérifiée ?</InputLabel>
            <Select value={form.piece_identite_verifiee} onChange={set('piece_identite_verifiee')} label="Pièce d'identité vérifiée ?">
              <MenuItem value="Oui">Oui</MenuItem>
              <MenuItem value="Non">Non</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={8}>
          <Field name="numero_piece" label="Numéro de la pièce" {...fieldProps} />
        </Grid>
      </Grid>
    )
    if (activeStep === 2) return (
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Field name="code_badge_remis" label="Code du badge remis" {...fieldProps} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Field name="agent_securite" label="Agent de sécurité" required {...fieldProps} />
        </Grid>
        <Grid item xs={12}>
          <Field name="observations" label="Observations" multiline rows={2} {...fieldProps} />
        </Grid>
        <Grid item xs={12}>
          <SignaturePad
            label="Signature du visiteur à l'entrée"
            value={form.signature_entree}
            onChange={v => setForm(f => ({ ...f, signature_entree: v }))}
          />
        </Grid>
      </Grid>
    )
    return null
  }

  return (
    <Layout>
      <Typography variant="h5" sx={{ mb: 2, color: 'primary.main', fontSize: { xs: 18, sm: 24 } }}>
        Nouvelle entrée visiteur
      </Typography>

      {!isMobile && (
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {STEPS.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
        </Stepper>
      )}
      {isMobile && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Étape {activeStep + 1} / {STEPS.length} — <b>{STEPS[activeStep]}</b>
          </Typography>
        </Box>
      )}

      <Card>
        <CardHeader
          title={STEPS[activeStep]}
          titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
          sx={{ pb: 0 }}
        />
        <Divider sx={{ mx: 2, mt: 1 }} />
        <CardContent sx={{ pt: 2 }}>
          {renderStep()}
        </CardContent>
      </Card>

      {isMobile ? (
        <MobileStepper
          variant="dots" steps={STEPS.length} position="static"
          activeStep={activeStep} sx={{ mt: 2, bgcolor: 'transparent' }}
          nextButton={
            activeStep < STEPS.length - 1
              ? <Button size="small" onClick={handleNext} endIcon={<KeyboardArrowRight />}>Suivant</Button>
              : <Button size="small" variant="contained" onClick={handleSubmit} disabled={loading}>
                  {loading ? <CircularProgress size={18} color="inherit" /> : 'Enregistrer'}
                </Button>
          }
          backButton={
            <Button size="small" onClick={handleBack} disabled={activeStep === 0} startIcon={<KeyboardArrowLeft />}>
              Retour
            </Button>
          }
        />
      ) : (
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', mt: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => { setForm({ ...INITIAL, agent_securite: user?.fullName ?? '', heure_entree: getNearestSlot() }); setErrors({}); setActiveStep(0) }}
          >
            Réinitialiser
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" onClick={handleBack} disabled={activeStep === 0} startIcon={<KeyboardArrowLeft />}>
              Retour
            </Button>
            {activeStep < STEPS.length - 1
              ? <Button variant="contained" onClick={handleNext} endIcon={<KeyboardArrowRight />}>Suivant</Button>
              : <Button variant="contained" onClick={handleSubmit} disabled={loading} startIcon={loading ? null : <Send />} sx={{ minWidth: 160 }}>
                  {loading ? <CircularProgress size={22} color="inherit" /> : 'Enregistrer'}
                </Button>
            }
          </Box>
        </Box>
      )}

      <Snackbar open={snack.open} autoHideDuration={5000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))} sx={{ width: '100%' }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Layout>
  )
}
