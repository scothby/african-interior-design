# 🏛️ African Interior Designer

Application complète de design d'intérieur africain avec base de données de 169 styles et génération d'images par IA.

## ✨ Fonctionnalités

### 📚 Base de Données des Styles Africains
- **169 styles** de 5 régions africaines
- 8 familles de styles (Terres & Banco, Textiles Royaux, Côtier Swahili, etc.)
- Palettes de couleurs, matériaux, motifs et prompts prêts à l'emploi

### 🎨 Générateur de Design d'Intérieur
- Upload de photos de pièces
- Sélection de style africain
- Génération d'images par IA (**Google Gemini 2.0 Flash**)
- Comparaison avant/après

## 📁 Structure du Projet

```
files/
├── backend/                  # API Node.js/Express
│   ├── package.json
│   ├── server.js            # Serveur API
│   ├── .env.example         # Variables d'environnement
│   └── .env                 # Vos clés API (à créer)
├── src/
│   ├── App.jsx              # Application principale (Base de données)
│   ├── InteriorDesignApp.jsx # Application Designer
│   ├── App.css              # Styles CSS
│   └── african-styles-db.json # Base de données
├── public/
└── package.json             # Dépendances React
```

## 🚀 Installation et Lancement

### 1. Backend API

```bash
cd backend
npm install
```

Créer le fichier `.env` :
```bash
cp .env.example .env
# Éditer .env avec votre clé Google AI
```

Dans `.env` :
```
GOOGLE_API_KEY=votre_clé_api_google
PORT=5000
```

Lancer le backend :
```bash
npm start
# ou
npm run dev  # avec nodemon
```

Le serveur démarre sur `http://localhost:5000`

### 2. Frontend React

```bash
# Dans le dossier principal (files/)
npm install
npm start
```

L'application démarre sur `http://localhost:3000`

## 🎯 Utilisation

### Base de Données
1. Ouvrez l'application sur `http://localhost:3000`
2. Explorez les 169 styles africains
3. Filtrez par région ou famille
4. Copiez les prompts pour les utiliser dans d'autres outils

### Designer d'Intérieur
1. Cliquez sur **"🎨 Designer d'Intérieur"** en haut à droite
2. Upload une photo de votre pièce
3. Choisissez un style africain (filtres disponibles)
4. Cliquez sur **"Générer le design"**
5. Téléchargez le résultat !

## 🔧 Technologies

### Backend
- **Node.js** + **Express**
- **Multer** - Upload de fichiers
- **Google Gemini API** - Génération d'images (gemini-2.0-flash-exp-image-generation)
- **CORS** - Communication frontend/backend

### Frontend
- **React 18** - UI components
- **CSS inline** - Styling
- **Fetch API** - HTTP requests

## 📝 API Endpoints

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/health` | GET | Vérification serveur |
| `/api/upload` | POST | Upload d'image |
| `/api/generate` | POST | Générer design stylisé |
| `/api/styles` | GET | Liste des styles |

## 🔑 Obtenir une clé Google AI (Gemini)

1. Créez un compte sur [makersuite.google.com](https://makersuite.google.com)
2. Allez dans **Get API Key**
3. Générez une nouvelle clé
4. Collez-la dans `backend/.env`

**⚠️ Important** : Vérifiez les quotas et limites de l'API Gemini. Le modèle image generation est en preview.

## 🐛 Dépannage

### Erreur "Module not found"
```bash
cd backend && npm install
cd .. && npm install
```

### Erreur CORS
Vérifiez que le backend tourne sur le port 5000 et que le frontend sur 3000.

### Erreur Google API
Vérifiez votre clé API dans `backend/.env` et les quotas Gemini.

### Port déjà utilisé
```bash
# Backend
npx kill-port 5000

# Frontend
npx kill-port 3000
```

## 📊 Statistiques des Styles

| Région | Styles |
|--------|--------|
| Afrique de l'Ouest | 25+ |
| Afrique de l'Est | 20+ |
| Afrique du Nord | 15+ |
| Afrique Centrale | 10+ |
| Afrique Australe | 15+ |

## 📄 License

MIT License - Open Source

---

**Projet créé avec ❤️ pour célébrer la richesse du design africain**
