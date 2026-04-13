-- ============================================================
-- SCHEMA COMPLET - Registre des Entrées Patients
-- À exécuter dans l'éditeur SQL de Supabase
-- ============================================================

-- 1. Table des rôles
CREATE TABLE IF NOT EXISTS roles (
  id   SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE  -- 'admin' | 'agent'
);

INSERT INTO roles (name) VALUES ('admin'), ('agent')
  ON CONFLICT (name) DO NOTHING;

-- 2. Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT NOT NULL UNIQUE,   -- Identifiant alphanumérique (login)
  password     TEXT NOT NULL,          -- Hash bcrypt (voir note ci-dessous)
  full_name    TEXT NOT NULL,
  role_id      INT  NOT NULL REFERENCES roles(id) DEFAULT 2,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Table du registre des entrées/sorties
CREATE TABLE IF NOT EXISTS registre (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_entree               DATE NOT NULL,
  heure_entree              TEXT NOT NULL,
  nom                       TEXT NOT NULL,
  prenom                    TEXT NOT NULL,
  societe_organisme         TEXT,
  service_personne_visitee  TEXT NOT NULL,
  motif_visite              TEXT NOT NULL,
  piece_identite_verifiee   TEXT NOT NULL DEFAULT 'Non',  -- 'Oui' | 'Non'
  numero_piece              TEXT,
  code_badge_remis          TEXT,
  signature_entree          TEXT,   -- base64 image
  heure_sortie              TEXT,
  signature_sortie          TEXT,   -- base64 image
  remise_piece_identite     TEXT NOT NULL DEFAULT 'Non',  -- 'Oui' | 'Non'
  observations              TEXT,
  agent_securite            TEXT NOT NULL,
  agent_user_id             TEXT NOT NULL REFERENCES users(user_id),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_registre_updated_at
  BEFORE UPDATE ON registre
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. DÉSACTIVER TOUTES LES RLS POLICIES
ALTER TABLE roles   DISABLE ROW LEVEL SECURITY;
ALTER TABLE users   DISABLE ROW LEVEL SECURITY;
ALTER TABLE registre DISABLE ROW LEVEL SECURITY;

-- 6. Donner accès public (anon key) à toutes les tables
GRANT ALL ON roles    TO anon, authenticated, service_role;
GRANT ALL ON users    TO anon, authenticated, service_role;
GRANT ALL ON registre TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 7. Comptes de démonstration
-- Mot de passe stocké en clair ici pour init — à changer en production
-- admin / Admin@2024
-- agent01 / Agent@2024
INSERT INTO users (user_id, password, full_name, role_id) VALUES
  ('admin',   'Admin@2024',  'Administrateur Système', 1),
  ('agent01', 'Agent@2024',  'Agent Wilfried CE',      2),
  ('agent02', 'Agent@2024',  'Agent Dupont Marie',     2)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- FIN DU SCRIPT
-- ============================================================
