import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, Typography, Divider, Box, Chip,
} from '@mui/material'
import { Close } from '@mui/icons-material'

const Row = ({ label, value }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ mt: 0.25 }}>{value || '—'}</Typography>
  </Box>
)

export default function RecordDetailDialog({ record: r, onClose }) {
  if (!r) return null
  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Détail de l'entrée</span>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip label={r.heure_sortie ? 'Sorti' : 'Présent'} size="small" color={r.heure_sortie ? 'default' : 'success'} />
          <Button size="small" onClick={onClose} startIcon={<Close />}>Fermer</Button>
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12}><Typography variant="subtitle2" color="primary" fontWeight={700}>Identité du visiteur</Typography></Grid>
          <Grid item xs={6} sm={3}><Row label="Nom" value={r.nom} /></Grid>
          <Grid item xs={6} sm={3}><Row label="Prénom" value={r.prenom} /></Grid>
          <Grid item xs={6} sm={3}><Row label="Société / Organisme" value={r.societe_organisme} /></Grid>
          <Grid item xs={6} sm={3}><Row label="Service / Personne visitée" value={r.service_personne_visitee} /></Grid>

          <Grid item xs={12}><Divider /><Typography variant="subtitle2" color="primary" fontWeight={700} sx={{ mt: 2 }}>Entrée</Typography></Grid>
          <Grid item xs={6} sm={3}><Row label="Date" value={new Date(r.date_entree).toLocaleDateString('fr-FR')} /></Grid>
          <Grid item xs={6} sm={3}><Row label="Heure d'entrée" value={r.heure_entree} /></Grid>
          <Grid item xs={12} sm={6}><Row label="Motif de la visite" value={r.motif_visite} /></Grid>

          <Grid item xs={12}><Divider /><Typography variant="subtitle2" color="primary" fontWeight={700} sx={{ mt: 2 }}>Pièce d'identité & Badge</Typography></Grid>
          <Grid item xs={6} sm={3}><Row label="Pièce vérifiée" value={r.piece_identite_verifiee} /></Grid>
          <Grid item xs={6} sm={3}><Row label="Numéro de pièce" value={r.numero_piece} /></Grid>
          <Grid item xs={6} sm={3}><Row label="Code badge" value={r.code_badge_remis} /></Grid>
          <Grid item xs={6} sm={3}><Row label="Remise pièce" value={r.remise_piece_identite} /></Grid>

          <Grid item xs={12}><Divider /><Typography variant="subtitle2" color="primary" fontWeight={700} sx={{ mt: 2 }}>Sortie</Typography></Grid>
          <Grid item xs={6} sm={3}><Row label="Heure de sortie" value={r.heure_sortie} /></Grid>
          <Grid item xs={12} sm={9}><Row label="Observations" value={r.observations} /></Grid>

          <Grid item xs={12}><Divider /><Typography variant="subtitle2" color="primary" fontWeight={700} sx={{ mt: 2 }}>Agent de sécurité</Typography></Grid>
          <Grid item xs={6}><Row label="Agent" value={r.agent_securite} /></Grid>
          <Grid item xs={6}><Row label="ID Agent" value={r.agent_user_id} /></Grid>

          {/* Signatures */}
          {r.signature_entree && (
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Signature entrée</Typography>
              <Box sx={{ border: '1px solid #eee', borderRadius: 2, mt: 0.5, overflow: 'hidden' }}>
                <img src={r.signature_entree} alt="sig entrée" style={{ width: '100%', display: 'block' }} />
              </Box>
            </Grid>
          )}
          {r.signature_sortie && (
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Signature sortie</Typography>
              <Box sx={{ border: '1px solid #eee', borderRadius: 2, mt: 0.5, overflow: 'hidden' }}>
                <img src={r.signature_sortie} alt="sig sortie" style={{ width: '100%', display: 'block' }} />
              </Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fermer</Button>
      </DialogActions>
    </Dialog>
  )
}
