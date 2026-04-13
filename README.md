# Registre des Entrées Patients

Application web de gestion des registres d'entrées/sorties visiteurs, développée avec React + Vite + Material UI + Supabase.

---

## 🚀 Installation et démarrage

### 1. Cloner et installer les dépendances

```bash
# Installer les dépendances
npm install
```

### 2. Variables d'environnement

Le fichier `.env` est déjà configuré avec vos données Supabase :
```
VITE_SUPABASE_URL=https://ymmyiqmnipgwlfzxwjkb.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_bl0f3i1QHVwt3AjkuS7czA_ZBmOempt
```

### 3. Configurer la base de données Supabase

1. Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Ouvrez votre projet `ymmyiqmnipgwlfzxwjkb`
3. Allez dans **SQL Editor**
4. Copiez-collez le contenu du fichier `supabase_schema.sql`
5. Cliquez sur **Run**

Cela va créer :
- ✅ Table `roles` (admin, agent)
- ✅ Table `users` (avec comptes de démo)
- ✅ Table `registre` (tous les champs du formulaire)
- ✅ RLS désactivée sur toutes les tables
- ✅ Permissions accordées à `anon` et `authenticated`

### 4. Démarrer en développement

```bash
npm run dev
```

---

## 🔐 Comptes de démonstration

| Identifiant | Mot de passe | Rôle  |
|-------------|-------------|-------|
| `admin`     | `Admin@2024` | Admin |
| `agent01`   | `Agent@2024` | Agent |
| `agent02`   | `Agent@2024` | Agent |

---

## 📋 Fonctionnalités

### Rôle Agent
- **Formulaire de saisie** : tous les champs du registre papier (date, heure, nom, prénom, société, service visité, motif, pièce d'identité, badge, signatures entrée/sortie, observations, agent)
- **Signature numérique** : pad de signature tactile/souris pour entrée et sortie
- **Historique personnel** : consultation et recherche de ses propres enregistrements
- **Détail** : popup avec tous les détails d'un enregistrement

### Rôle Admin
- **Dashboard** : KPIs temps réel (total, aujourd'hui, présents, mois en cours)
- **Tous les enregistrements** : table complète avec filtres par date, agent, recherche
- **Statistiques** : graphiques barres et donuts (entrées par jour, par agent, motifs, statuts)
- **Export Excel** : extraction complète avec mise en forme professionnelle

---

## 🌐 Déploiement sur Netlify

### Option A — Via l'interface Netlify

1. Allez sur [https://app.netlify.com](https://app.netlify.com)
2. Cliquez **Add new site → Import an existing project**
3. Connectez votre repo Git (GitHub, GitLab, Bitbucket)
4. Configurez le build :
   - **Build command** : `npm run build`
   - **Publish directory** : `dist`
5. Ajoutez les variables d'environnement :
   - `VITE_SUPABASE_URL` = `https://ymmyiqmnipgwlfzxwjkb.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `sb_publishable_bl0f3i1QHVwt3AjkuS7czA_ZBmOempt`
6. Cliquez **Deploy site**

### Option B — Via Netlify CLI

```bash
npm install -g netlify-cli
netlify login
npm run build
netlify deploy --prod --dir=dist
```

> Le fichier `netlify.toml` est déjà configuré pour gérer les redirections SPA.

---

## 🗄️ Structure de la base de données

```
roles
  id, name ('admin' | 'agent')

users
  id (uuid), user_id (login), password, full_name, role_id, is_active, created_at

registre
  id (uuid)
  date_entree, heure_entree
  nom, prenom, societe_organisme
  service_personne_visitee, motif_visite
  piece_identite_verifiee, numero_piece
  code_badge_remis
  signature_entree (base64), signature_sortie (base64)
  heure_sortie
  remise_piece_identite
  observations
  agent_securite, agent_user_id
  created_at, updated_at
```

---

## 📁 Structure du projet

```
src/
├── contexts/
│   └── AuthContext.jsx       # Authentification (login/logout/session)
├── components/
│   ├── Layout.jsx             # Sidebar + AppBar partagés
│   ├── ProtectedRoute.jsx     # Garde de route par rôle
│   ├── SignaturePad.jsx       # Pad de signature numérique
│   └── RecordDetailDialog.jsx # Popup de détail d'un enregistrement
├── pages/
│   ├── LoginPage.jsx          # Page de connexion
│   ├── AgentFormPage.jsx      # Formulaire de saisie (agent)
│   ├── AgentHistoryPage.jsx   # Historique de l'agent
│   ├── AdminDashboardPage.jsx # Dashboard admin
│   ├── AdminRecordsPage.jsx   # Tous les enregistrements (admin)
│   └── AdminStatsPage.jsx     # Statistiques et graphiques
├── lib/
│   ├── supabase.js            # Client Supabase
│   └── exportExcel.js         # Export Excel avec ExcelJS
├── theme/
│   └── index.js               # Thème MUI personnalisé
├── App.jsx                    # Router principal
└── main.jsx                   # Point d'entrée React
```

---

## ⚠️ Notes de sécurité

- Les mots de passe sont actuellement stockés en clair dans la démo. Pour la production, il est recommandé d'utiliser l'authentification Supabase Auth native ou de hasher les mots de passe (bcrypt).
- Les RLS sont désactivées pour simplifier le développement. En production, activez-les et configurez des policies appropriées.
