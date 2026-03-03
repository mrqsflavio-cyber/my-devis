# 🧾 Mydevis — Guide de déploiement

Application de création et gestion de devis professionnels.  
Stack : **React 18 + Vite** — Déploiement sur **Vercel** (gratuit).

---

## 📁 Structure du projet

```
mydevis/
├── index.html          ← Point d'entrée HTML (charge jsPDF + polices)
├── vite.config.js      ← Configuration Vite
├── vercel.json         ← Configuration Vercel (SPA routing)
├── package.json        ← Dépendances
├── .gitignore
└── src/
    ├── main.jsx        ← Point d'entrée React
    └── App.jsx         ← Application complète
```

---

## 🚀 Déploiement sur Vercel (méthode recommandée)

### Étape 1 — Installer les outils

Vous avez besoin de **Node.js** (version 18+) et **Git**.

- Télécharger Node.js : https://nodejs.org (choisir LTS)
- Télécharger Git : https://git-scm.com

Vérifier l'installation :
```bash
node -v    # doit afficher v18.x ou plus
npm -v     # doit afficher 9.x ou plus
git --version
```

---

### Étape 2 — Créer un compte GitHub

1. Aller sur https://github.com
2. Cliquer **Sign up** → créer un compte gratuit
3. Vérifier votre email

---

### Étape 3 — Mettre le projet sur GitHub

Ouvrir un terminal dans le dossier `mydevis/` :

```bash
# Initialiser Git
git init

# Ajouter tous les fichiers
git add .

# Premier commit
git commit -m "Initial commit - Mydevis"

# Créer le repo sur GitHub (remplacer VOTRE_USERNAME)
# 1. Aller sur https://github.com/new
# 2. Repository name : mydevis
# 3. Visibility : Private (recommandé) ou Public
# 4. NE PAS cocher "Initialize repository"
# 5. Cliquer "Create repository"

# Lier votre dossier local au repo GitHub (copier l'URL depuis GitHub)
git remote add origin https://github.com/VOTRE_USERNAME/mydevis.git

# Envoyer le code
git branch -M main
git push -u origin main
```

---

### Étape 4 — Déployer sur Vercel

1. Aller sur https://vercel.com
2. Cliquer **Sign up** → choisir **Continue with GitHub**
3. Autoriser Vercel à accéder à GitHub

4. Sur le tableau de bord Vercel, cliquer **Add New → Project**
5. Trouver votre repo `mydevis` → cliquer **Import**

6. Configuration du projet :
   - **Framework Preset** : Vite (détecté automatiquement)
   - **Build Command** : `npm run build` ✅
   - **Output Directory** : `dist` ✅
   - **Install Command** : `npm install` ✅

7. Cliquer **Deploy**

⏳ Le déploiement prend ~1 minute.

8. Vercel vous donne une URL du type : `https://mydevis-xxx.vercel.app`

---

### Étape 5 — Domaine personnalisé (optionnel)

Si vous avez un nom de domaine (ex: `www.monentreprise.fr`) :

1. Dans Vercel → votre projet → **Settings → Domains**
2. Cliquer **Add Domain**
3. Entrer votre domaine
4. Vercel vous indique les DNS à configurer chez votre registrar (OVH, Ionos, Gandi…)
5. Attendre 1-24h pour la propagation DNS

---

### Mise à jour du site

À chaque modification de vos fichiers :

```bash
git add .
git commit -m "Description de la modification"
git push
```

Vercel redéploie automatiquement en ~30 secondes. ✨

---

## 💾 Option Firebase (stockage cloud synchronisé)

> ⚠️ **Non nécessaire pour commencer** — L'application fonctionne parfaitement avec le localStorage du navigateur. Firebase est utile si vous voulez synchroniser vos devis entre plusieurs appareils ou navigateurs.

### Pourquoi Firebase ?
- Les données sont actuellement stockées dans le **localStorage** de votre navigateur
- Elles sont perdues si vous changez de navigateur ou d'appareil
- Firebase Firestore permet de les stocker dans le cloud

### Mise en place Firebase (optionnel)

#### 1. Créer un projet Firebase

1. Aller sur https://console.firebase.google.com
2. Cliquer **Ajouter un projet**
3. Nom : `mydevis`
4. Désactiver Google Analytics (optionnel)
5. Cliquer **Créer le projet**

#### 2. Activer Firestore

1. Dans le menu gauche → **Firestore Database**
2. Cliquer **Créer une base de données**
3. Choisir **Mode test** (pour commencer)
4. Région : `europe-west3` (Frankfurt, proche de la France)

#### 3. Configurer l'authentification (pour sécuriser)

1. Menu gauche → **Authentication → Commencer**
2. **Sign-in method** → Activer **Email/Password** ou **Google**

#### 4. Obtenir la configuration

1. Dans Firebase Console → ⚙️ **Paramètres du projet**
2. Sous **Vos applications** → cliquer **Web** (</>)
3. Nom : `mydevis-web` → **Enregistrer l'application**
4. Copier la configuration `firebaseConfig`

#### 5. Installer Firebase dans le projet

```bash
npm install firebase
```

#### 6. Créer src/firebase.js

```js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "mydevis-XXXXX.firebaseapp.com",
  projectId: "mydevis-XXXXX",
  storageBucket: "mydevis-XXXXX.appspot.com",
  messagingSenderId: "XXXXXXXXXX",
  appId: "1:XXXXXXXXXX:web:XXXXXXXXXXXX"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

> ⚠️ Ne jamais committer les clés API dans un repo public !  
> Utiliser des variables d'environnement Vercel (Settings → Environment Variables).

#### 7. Variables d'environnement Vercel

Dans Vercel → votre projet → **Settings → Environment Variables** :

```
VITE_FIREBASE_API_KEY=votre_api_key
VITE_FIREBASE_AUTH_DOMAIN=mydevis-xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=mydevis-xxx
VITE_FIREBASE_STORAGE_BUCKET=mydevis-xxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=xxxxx
VITE_FIREBASE_APP_ID=1:xxx:web:xxx
```

Puis dans `src/firebase.js` :
```js
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  // etc.
};
```

---

## 🛠️ Développement local

Pour travailler sur l'application en local :

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Ouvrir http://localhost:5173
```

```bash
# Construire pour la production
npm run build

# Prévisualiser le build
npm run preview
```

---

## ✅ Récapitulatif rapide

| Étape | Action | Temps |
|-------|--------|-------|
| 1 | Installer Node.js + Git | 5 min |
| 2 | Créer compte GitHub | 2 min |
| 3 | Pousser le code sur GitHub | 3 min |
| 4 | Connecter Vercel + déployer | 3 min |
| **Total** | **Site en ligne** | **~15 min** |

---

## 🆘 Problèmes courants

**`npm install` échoue** → Vérifier que Node.js 18+ est installé  
**`git push` demande un mot de passe** → Utiliser un token GitHub (Settings → Developer settings → Personal access tokens)  
**Le PDF ne se génère pas** → jsPDF est chargé depuis un CDN, vérifier la connexion internet  
**Les données disparaissent** → Normal avec localStorage, considérer Firebase pour la persistance cloud  

---

*Mydevis — Application de devis professionnels*
