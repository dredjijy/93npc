# 🚀 93NPC — Guide de Déploiement Complet

> **Temps total estimé : 30 à 45 minutes**
> Aucune connaissance technique avancée requise — suis chaque étape dans l'ordre.

---

## 📋 CE QU'ON VA FAIRE

1. Créer la base de données sur **Supabase** (gratuit)
2. Configurer le stockage des images
3. Tester le site en local sur ton ordinateur
4. Mettre en ligne sur **Vercel** (gratuit)
5. Créer le compte administrateur

---

## ═══════════════════════════════════════
## ÉTAPE 1 — CRÉER UN COMPTE SUPABASE
## ═══════════════════════════════════════

### 1.1 — Créer le compte

1. Ouvre ton navigateur et va sur **https://supabase.com**
2. Clique sur le bouton **"Start your project"** (bouton vert en haut à droite)
3. Clique **"Sign up with GitHub"** *(recommandé)* ou **"Sign up with email"**
   - Si tu choisis email : entre ton adresse mail + un mot de passe + clique le lien de confirmation que tu reçois par mail
4. Une fois connecté, tu arrives sur le **Dashboard Supabase**

---

### 1.2 — Créer un nouveau projet

1. Sur le Dashboard, clique **"New project"**
2. Remplis le formulaire :
   - **Organization** : garde celle créée par défaut (ton pseudo)
   - **Name** : tape `93npc` *(ou ce que tu veux)*
   - **Database Password** : clique **"Generate a password"** → **COPIE ce mot de passe et sauvegarde-le** dans un fichier texte — tu en auras besoin plus tard
   - **Region** : choisis **"West EU (Ireland)"** ou **"Central EU (Frankfurt)"** pour la France
   - **Pricing Plan** : garde **"Free"**
3. Clique **"Create new project"**
4. ⏳ Attends 1 à 2 minutes que le projet se crée — une barre de progression s'affiche

---

## ═══════════════════════════════════════
## ÉTAPE 2 — CRÉER LES TABLES (SCHÉMA BDD)
## ═══════════════════════════════════════

> C'est ici qu'on crée toutes les tables de la plateforme (utilisateurs, jeux, groupes, forum, etc.)

### 2.1 — Ouvrir l'éditeur SQL

1. Dans ton projet Supabase, regarde la **barre de gauche**
2. Clique sur **"SQL Editor"** (icône qui ressemble à `</> `)
3. Une fenêtre de texte vide s'ouvre

### 2.2 — Coller le schéma

1. Sur ton ordinateur, ouvre le fichier **`supabase-schema.sql`** avec un éditeur de texte
   - Windows : clic droit → "Ouvrir avec" → Bloc-notes
   - Mac : double-clic → TextEdit
2. Fais **Ctrl+A** (ou Cmd+A sur Mac) pour tout sélectionner
3. Fais **Ctrl+C** (ou Cmd+C) pour copier
4. Retourne dans Supabase → SQL Editor
5. Clique dans la zone de texte blanche
6. Fais **Ctrl+V** (ou Cmd+V) pour coller

### 2.3 — Exécuter le schéma

1. Clique le bouton **"Run"** (bouton vert en bas à droite, ou appuie sur **Ctrl+Enter**)
2. Attends quelques secondes
3. Tu dois voir en bas : **"Success. No rows returned"** ou une liste de messages verts ✅
4. Si tu vois une erreur rouge → envoie-moi le message d'erreur

---

## ═══════════════════════════════════════
## ÉTAPE 3 — CONFIGURER LE STOCKAGE (IMAGES)
## ═══════════════════════════════════════

> Le stockage permet aux créateurs d'uploader des images de jeux.

### 3.1 — Créer le bucket d'images

1. Dans la barre gauche de Supabase, clique **"Storage"** (icône nuage)
2. Clique **"New bucket"**
3. Remplis :
   - **Name** : `covers`  *(exactement ce mot, en minuscules)*
   - **Public bucket** : **active le switch** (il devient bleu/vert)
4. Clique **"Save"**

### 3.2 — Vérifier le bucket

1. Tu dois voir `covers` apparaître dans la liste
2. Clique dessus → clique **"Policies"** → tu dois voir des lignes de politique (créées automatiquement par le schéma SQL)
3. Si aucune politique n'existe, retourne à l'étape 2.3 et ré-exécute le schéma

---

## ═══════════════════════════════════════
## ÉTAPE 4 — RÉCUPÉRER LES CLÉS API
## ═══════════════════════════════════════

> Ces clés permettent à la plateforme de communiquer avec Supabase.
> **Tes clés sont déjà dans le fichier `supabase.js`** — vérifie juste qu'elles sont bonnes.

### 4.1 — Trouver tes clés

1. Dans Supabase, clique sur l'icône **engrenage ⚙️** en bas à gauche → **"Project Settings"**
2. Dans le menu qui s'ouvre, clique **"API"**
3. Tu vois deux informations importantes :
   - **Project URL** → ressemble à `https://xxxxxxxxxx.supabase.co`
   - **anon public** (sous "Project API keys") → longue chaîne de caractères

### 4.2 — Vérifier le fichier supabase.js

1. Ouvre le fichier **`supabase.js`** avec un éditeur de texte
2. Vérifie que ces deux lignes correspondent bien à ce que tu vois dans Supabase :
```js
const SUPABASE_URL  = "https://yfrtywzyjlkeldukzxxj.supabase.co";
const SUPABASE_ANON = "sb_publishable_nqNYbpb2c7_jNZmFzT2rvg_Hzn6lfz_";
```
3. Si c'est correct → rien à changer ✅
4. Si tu as créé un nouveau projet Supabase → remplace ces valeurs par les tiennes

---

## ═══════════════════════════════════════
## ÉTAPE 5 — CONFIGURER L'AUTHENTIFICATION
## ═══════════════════════════════════════

### 5.1 — Désactiver la confirmation email (pour les tests)

> Par défaut Supabase envoie un email de confirmation à chaque inscription. Pour tester facilement, on le désactive d'abord.

1. Dans Supabase, barre gauche → **"Authentication"**
2. Clique **"Providers"** → clique **"Email"**
3. Désactive **"Confirm email"** (switch devient gris)
4. Clique **"Save"**

### 5.2 — Configurer l'URL du site

> Nécessaire pour que les redirections après login fonctionnent correctement.

1. Dans Authentication → clique **"URL Configuration"**
2. **Site URL** : entre `http://localhost:3000` pour l'instant (on changera après déploiement)
3. **Redirect URLs** : clique **"Add URL"** → entre `http://localhost:3000/**`
4. Clique **"Save"**

---

## ═══════════════════════════════════════
## ÉTAPE 6 — INSTALLER NODE.JS (si pas déjà fait)
## ═══════════════════════════════════════

> Node.js est nécessaire pour faire tourner le projet en local.

### 6.1 — Vérifier si Node.js est installé

1. Ouvre un terminal :
   - **Windows** : Touche Windows → tape "cmd" → Entrée
   - **Mac** : Spotlight (Cmd+Space) → tape "Terminal" → Entrée
2. Tape : `node --version` → appuie sur Entrée
3. Si tu vois `v18.x.x` ou plus → Node.js est installé ✅ → passe à l'étape 7
4. Si tu vois une erreur → installe Node.js :
   - Va sur **https://nodejs.org**
   - Télécharge la version **"LTS"** (Long Term Support)
   - Lance l'installateur, clique "Next" partout
   - Redémarre ton terminal après l'installation

---

## ═══════════════════════════════════════
## ÉTAPE 7 — TESTER EN LOCAL
## ═══════════════════════════════════════

### 7.1 — Dézipper les fichiers

1. Crée un dossier sur ton bureau nommé `93npc`
2. Extrais le contenu du ZIP `gder-deploy.zip` dans ce dossier
3. Tu dois avoir cette structure :
```
93npc/
├── src/
│   ├── App.jsx
│   └── main.jsx
├── public/
│   ├── logo.png
│   ├── favicon.svg
│   └── manifest.json
├── supabase.js
├── supabase-schema.sql
├── package.json
├── vite.config.js
├── vercel.json
├── index.html
└── DEPLOY.md
```

### 7.2 — Ouvrir le terminal dans le dossier

**Windows :**
1. Ouvre le dossier `93npc` dans l'Explorateur de fichiers
2. Clique dans la barre d'adresse en haut → tape `cmd` → Entrée
3. Un terminal s'ouvre directement dans le bon dossier

**Mac :**
1. Ouvre Terminal
2. Tape `cd ` (avec un espace après)
3. Fais glisser le dossier `93npc` dans le terminal → ça ajoute le chemin automatiquement
4. Appuie sur Entrée

### 7.3 — Installer les dépendances

Dans le terminal, tape :
```bash
npm install
```
⏳ Attends 1 à 2 minutes — tu vois beaucoup de texte défiler. C'est normal.

### 7.4 — Lancer le serveur de développement

```bash
npm run dev
```

Tu dois voir :
```
  ➜  Local:   http://localhost:3000/
```

Ouvre ton navigateur et va sur **http://localhost:3000**

🎉 La plateforme 93NPC doit s'afficher !

### 7.5 — Tester les fonctionnalités

1. **S'inscrire** → clique "Sign Up" → crée un compte test
2. **Admin** → connecte-toi avec `nvidia26@outlook.fr` / `Drgonn55g55Ranaroge`
3. **Créateur** → inscris un compte comme "Creator" → soumets un jeu de test
4. **Admin** → approuve le jeu depuis le Panel Admin

---

## ═══════════════════════════════════════
## ÉTAPE 8 — DÉPLOYER SUR VERCEL
## ═══════════════════════════════════════

> Vercel rend le site accessible à tout le monde sur Internet. C'est gratuit.

### 8.1 — Créer un compte Vercel

1. Va sur **https://vercel.com**
2. Clique **"Sign Up"**
3. Choisis **"Continue with GitHub"** *(recommandé)* ou email
4. Suis les étapes d'inscription

### 8.2 — Installer Vercel CLI

Dans ton terminal (dans le dossier 93npc) :
```bash
npm install -g vercel
```

### 8.3 — Se connecter à Vercel

```bash
vercel login
```

1. Il te demande ton email → entre l'email de ton compte Vercel
2. Vercel envoie un email de confirmation → ouvre l'email → clique le bouton "Verify"
3. Retourne au terminal → tu dois voir **"Logged in!"**

### 8.4 — Builder le projet

```bash
npm run build
```

⏳ Attend 30 secondes environ. Tu dois voir à la fin :
```
✓ built in Xs
```

Si tu vois une erreur → envoie-moi le message.

### 8.5 — Déployer en production

```bash
vercel --prod
```

Vercel va te poser plusieurs questions :
- **"Set up and deploy?"** → tape `Y` → Entrée
- **"Which scope?"** → garde ton nom → Entrée
- **"Link to existing project?"** → tape `N` → Entrée
- **"What's your project's name?"** → tape `93npc` → Entrée
- **"In which directory is your code located?"** → tape `.` → Entrée
- **"Want to modify these settings?"** → tape `N` → Entrée

⏳ Attends 1 minute. À la fin tu vois :
```
🔍  Inspect: https://vercel.com/...
✅  Production: https://93npc-xxx.vercel.app
```

**Copie cette URL** — c'est l'adresse de ton site !

---

## ═══════════════════════════════════════
## ÉTAPE 9 — METTRE À JOUR SUPABASE
## ═══════════════════════════════════════

> Maintenant que le site est en ligne, on dit à Supabase quelle est son adresse.

### 9.1 — Mettre à jour l'URL dans Supabase

1. Retourne dans Supabase → **Authentication** → **URL Configuration**
2. **Site URL** : remplace `http://localhost:3000` par ton URL Vercel (ex: `https://93npc-xxx.vercel.app`)
3. **Redirect URLs** : clique **"Add URL"** → ajoute `https://93npc-xxx.vercel.app/**`
4. Clique **"Save"**

---

## ═══════════════════════════════════════
## ÉTAPE 10 — CRÉER LE COMPTE ADMIN
## ═══════════════════════════════════════

### 10.1 — Créer l'utilisateur dans Supabase

1. Dans Supabase, barre gauche → **"Authentication"**
2. Clique **"Users"** (en haut)
3. Clique **"Add user"** → **"Create new user"**
4. Remplis :
   - **Email** : `nvidia26@outlook.fr`
   - **Password** : `Drgonn55g55Ranaroge`
   - **Auto Confirm User** : ✅ active cette case
5. Clique **"Create User"**

### 10.2 — Lui donner le rôle admin

1. Dans Supabase → **SQL Editor**
2. Efface tout ce qui est dans l'éditeur
3. Colle ce code :
```sql
SELECT seed_admin();
```
4. Clique **"Run"**
5. Tu dois voir : **"Success"**

### 10.3 — Vérifier que ça fonctionne

1. Ouvre ton site en ligne (URL Vercel)
2. Connecte-toi avec `nvidia26@outlook.fr` / `Drgonn55g55Ranaroge`
3. Tu dois voir **"Admin"** dans le menu et accéder au Panel Admin

---

## ═══════════════════════════════════════
## ÉTAPE 11 — AJOUTER UN NOM DE DOMAINE (optionnel)
## ═══════════════════════════════════════

> Si tu as acheté un domaine (ex: 93npc.com), voici comment le connecter.

### 11.1 — Connecter le domaine dans Vercel

1. Va sur **https://vercel.com** → ton projet → **"Settings"** → **"Domains"**
2. Clique **"Add"** → entre ton domaine (ex: `93npc.com`)
3. Vercel t'affiche des **enregistrements DNS** à ajouter :
   - Un **"A record"** pointant vers une IP
   - Un **"CNAME record"**
4. Va chez ton registrar (Namecheap, OVH, Cloudflare…) → DNS Settings → ajoute ces enregistrements
5. Attends 10 à 30 minutes que la propagation DNS se fasse
6. Vercel affiche ✅ quand c'est bon

### 11.2 — Mettre à jour Supabase avec le vrai domaine

1. Supabase → Authentication → URL Configuration
2. Remplace l'URL Vercel par ton vrai domaine :
   - Site URL : `https://93npc.com`
   - Redirect URL : `https://93npc.com/**`
3. Clique **"Save"**

---

## ═══════════════════════════════════════
## ✅ CHECKLIST FINALE
## ═══════════════════════════════════════

Avant de partager le lien à tes utilisateurs, vérifie :

- [ ] Le schéma SQL a été exécuté sans erreur
- [ ] Le bucket "covers" existe et est public
- [ ] Les clés Supabase sont dans `supabase.js`
- [ ] `npm run build` fonctionne sans erreur
- [ ] Le site est accessible à l'URL Vercel
- [ ] L'URL est ajoutée dans Supabase → Authentication → URL Config
- [ ] Le compte admin `nvidia26@outlook.fr` est créé dans Supabase Auth
- [ ] `SELECT seed_admin();` a été exécuté
- [ ] Test : s'inscrire, se connecter, soumettre un jeu, approuver depuis l'admin

---

## ⚠️ PROBLÈMES COURANTS

### "Error: relation does not exist"
→ Le schéma SQL n'a pas été exécuté. Retourne à l'étape 2.

### La page blanche après login
→ L'URL n'est pas dans Supabase. Retourne à l'étape 9.

### "Invalid API key"
→ Les clés dans `supabase.js` ne correspondent pas. Retourne à l'étape 4.

### "npm: command not found"
→ Node.js n'est pas installé. Retourne à l'étape 6.

### Les images ne s'uploadent pas
→ Le bucket "covers" n'existe pas ou n'est pas public. Retourne à l'étape 3.

---

## 💰 COÛTS

| Service | Gratuit | Notes |
|---------|---------|-------|
| Supabase | ✅ Gratuit | 500MB BDD, 1GB stockage, 50k requêtes/mois |
| Vercel | ✅ Gratuit | 100GB bande passante/mois |
| Domaine | ~12€/an | Optionnel — pas obligatoire pour lancer |

**Coût total pour démarrer : 0€** (ou ~12€/an si tu veux un vrai domaine)

---

*Guide créé pour la plateforme 93NPC — PLAY • CREATE • CONNECT*
