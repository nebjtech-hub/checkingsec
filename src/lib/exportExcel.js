// Génère et télécharge un fichier Excel à partir des données du registre
export async function exportToExcel(rows, filename = 'export') {
  const ExcelJS = (await import('exceljs')).default
  const wb  = new ExcelJS.Workbook()
  const ws  = wb.addWorksheet('Registre', { views: [{ state: 'frozen', ySplit: 1 }] })

  // En-têtes
  ws.columns = [
    { header: 'Date',                         key: 'date_entree',              width: 14 },
    { header: "Heure d'entrée",               key: 'heure_entree',             width: 14 },
    { header: 'Nom',                           key: 'nom',                      width: 16 },
    { header: 'Prénom',                        key: 'prenom',                   width: 16 },
    { header: 'Société / Organisme',           key: 'societe_organisme',        width: 22 },
    { header: 'Service / Personne visitée',    key: 'service_personne_visitee', width: 26 },
    { header: 'Motif de la visite',            key: 'motif_visite',             width: 24 },
    { header: "Pièce d'identité vérifiée",     key: 'piece_identite_verifiee',  width: 22 },
    { header: 'Numéro de la pièce',            key: 'numero_piece',             width: 18 },
    { header: 'Code du badge remis',           key: 'code_badge_remis',         width: 18 },
    { header: 'Heure de sortie',               key: 'heure_sortie',             width: 14 },
    { header: "Remise de la pièce d'identité", key: 'remise_piece_identite',    width: 24 },
    { header: 'Observations',                  key: 'observations',             width: 30 },
    { header: 'Agent de sécurité',             key: 'agent_securite',           width: 20 },
    { header: 'ID Agent',                      key: 'agent_user_id',            width: 14 },
    { header: 'Enregistré le',                 key: 'created_at',               width: 20 },
  ]

  // Style en-tête
  const headerRow = ws.getRow(1)
  headerRow.eachCell(cell => {
    cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B4F72' } }
    cell.font   = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FF2980B9' } },
    }
  })
  headerRow.height = 30

  // Données
  rows.forEach((row, idx) => {
    const r = ws.addRow({
      date_entree:              row.date_entree ? new Date(row.date_entree).toLocaleDateString('fr-FR') : '',
      heure_entree:             row.heure_entree || '',
      nom:                      row.nom || '',
      prenom:                   row.prenom || '',
      societe_organisme:        row.societe_organisme || '',
      service_personne_visitee: row.service_personne_visitee || '',
      motif_visite:             row.motif_visite || '',
      piece_identite_verifiee:  row.piece_identite_verifiee || '',
      numero_piece:             row.numero_piece || '',
      code_badge_remis:         row.code_badge_remis || '',
      heure_sortie:             row.heure_sortie || '',
      remise_piece_identite:    row.remise_piece_identite || '',
      observations:             row.observations || '',
      agent_securite:           row.agent_securite || '',
      agent_user_id:            row.agent_user_id || '',
      created_at:               row.created_at ? new Date(row.created_at).toLocaleString('fr-FR') : '',
    })

    // Alternance de couleurs
    if (idx % 2 === 1) {
      r.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4F8' } }
      })
    }

    r.eachCell(cell => {
      cell.alignment = { vertical: 'middle', wrapText: false }
    })
  })

  // Filtre automatique
  ws.autoFilter = { from: 'A1', to: ws.getColumn(ws.columns.length).letter + '1' }

  // Téléchargement
  const buffer = await wb.xlsx.writeBuffer()
  const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url    = URL.createObjectURL(blob)
  const a      = document.createElement('a')
  a.href       = url
  a.download   = `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}
