![HackTweet Banner](https://cdn3d.iconscout.com/3d/premium/thumb/group-chat-3d-icon-download-in-png-blend-fbx-gltf-file-formats--discussion-talk-pack-user-interface-icons-9656913.png?f=webp)
# HackTweet
**BRANCH MASTER**; LES AUTRES SONT DES PREVERSIONS


## Installation et démarrage du projet


1. Installez les dépendances nécessaires :
   ```bash
   npm install
   ```

2. Lancez le serveur de développement :
   ```bash
   npm run dev
   ```

## Configuration de l'environnement

Créez un fichier `.env` dans le dossier backend et ajoutez les variables suivantes :
```env
MONGO_URI=mongodb+srv://hacktweet:TzDnih4ggxsmFsEr@cluster0.cdawf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=ipssi_hackathon_2025
CLOUDINARY_CLOUD_NAME=dpu3cztng
CLOUDINARY_API_KEY=643196434225345
CLOUDINARY_API_SECRET=2Oq-UzAuZMTMQ3LGjwww5Z3nxuQ
```

Le fichier `.env` est essentiel pour stocker des informations sensibles comme les URI de base de données et les secrets JWT. Assurez-vous de ne pas partager ce fichier publiquement, surtout avec des informations sensibles telles que les identifiants MongoDB.

DB password  : 4VcvTx4x6gVtZkB8

# Emotion Detection API

## Prérequis

- Python 3.8+
- pip
- virtualenv (recommandé)

## Configuration de l'environnement

### 1. Cloner le dépôt

```bash
git clone https://github.com/votre-utilisateur/emotion-detection-api.git
cd emotion-detection-api
```

### 2. Créer un environnement virtuel

```bash
# Sur Windows
python -m venv venv
venv\Scripts\activate

# Sur macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Installer les dépendances

```bash
pip install -r requirements.txt
```

## Configuration des dépendances (requirements.txt)

```
flask==2.1.0
flask-cors==3.0.10
opencv-python-headless==4.5.5.64
numpy==1.22.3
tensorflow==2.8.0
Pillow==9.1.0
```

## Exécution de l'API

### Démarrer le serveur Flask

```bash
# Activer l'environnement virtuel si ce n'est pas déjà fait
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# Lancer l'API
python DetectEmotion.py
```

L'API sera accessible à l'adresse : `http://127.0.0.1:5001`

## Points d'API

### Détection d'émotion

- **URL**: `/detect-emotion`
- **Méthode**: POST
- **Paramètres**: 
  - `image`: Fichier image à analyser
- **Réponse succès**:
  ```json
  {
    "emotion": "Heureux",
    "confidence": 0.85
  }
  ```


## Déploiement

[Instructions spécifiques de déploiement]

## Licence

[IPSSI Hackathon 2025]

## Contributeurs

- [Chihab MEZRIGUI]
- [Nabila ROUAR]
- [Jules CAPEL]
- [Moustapha ABDI ALI]
- [Nail BENAMER]
- [Hajar BEN YAICH]
