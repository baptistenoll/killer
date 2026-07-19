# Killer

Application web pour organiser une partie de **Killer** (jeu de l'assassin) : chaque joueur reçoit une cible et une mission à accomplir sur elle. Quand il y arrive, il envoie une demande de validation à l'admin ; une fois validée, il hérite automatiquement de la cible et de la mission de sa victime. Dernier joueur en vie, il gagne.

Deux interfaces :
- **Admin** — crée la partie, gère les joueurs, attribue cibles/missions, valide les kills.
- **Joueur** — accède via un code à 4 chiffres, voit sa cible, sa mission, son score, et signale ses kills.

## Stack technique

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vite.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [React Router](https://reactrouter.com/) pour le routing
- [Firebase](https://firebase.google.com/) — Firestore (données) + Authentication (admin par email/mot de passe, joueurs par code PIN via l'auth anonyme)

Les photos de joueurs sont stockées directement en base64 dans Firestore (pas de Firebase Storage, pour rester sur le forfait gratuit Spark).

## Architecture (MVVM)

```
src/
  models/         Types de domaine (Game, Player, Mission, KillClaim)
  repositories/    Accès Firestore par entité (CRUD, subscriptions temps réel)
  services/        Logique métier transverse (gameEngine, firebase, imageResize, playerSession)
  viewmodels/      Hooks/contexts exposant état + actions aux vues
  views/           Composants de présentation (admin/, player/)
  routes/          Routing et garde-fous d'accès (admin protégé par rôle, joueur par session)
```

- **Model** : `models/` (types) + `repositories/` (accès données Firestore).
- **ViewModel** : `viewmodels/` — hooks React qui encapsulent l'état et les actions, consommés par les vues.
- **View** : `views/` — composants React "bêtes", sans logique métier.
- Toute logique transactionnelle qui touche plusieurs entités à la fois (validation de kill, attribution de mission, suppression d'une partie...) vit dans `services/gameEngine.ts`.

## Prérequis

- Node.js 18+
- Un projet Firebase avec **Firestore** et **Authentication** activés (voir ci-dessous)

## Configuration Firebase

### 1. Créer le projet
Sur [console.firebase.google.com](https://console.firebase.google.com), crée un projet, puis enregistre une **Web App** (`</>`) pour obtenir les clés de config.

### 2. Activer Authentication
**Build → Authentication → Sign-in method**, active :
- **Email/Password** (connexion admin)
- **Anonymous** (connexion joueur par PIN)

### 3. Activer Firestore
**Build → Firestore Database → Créer une base de données**, démarrer en **mode production**.

### 4. Variables d'environnement
Copie `.env.example` vers `.env` et renseigne les 6 valeurs issues de la config de ton app web Firebase :

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Sans ces valeurs, l'app démarre quand même (bandeau d'avertissement affiché) mais aucune fonctionnalité liée à Firebase ne marche.

### 5. Déployer les règles de sécurité Firestore
Le fichier `firestore.rules` à la racine définit les permissions (lecture ouverte aux connectés, écriture admin sauf exceptions ciblées pour les joueurs). À déployer via la CLI :

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules --project <ton-project-id>
```

Ou en copiant/collant son contenu dans **Firestore → Rules** sur la console.

### 6. Créer ton compte admin
1. **Authentication → Users → Add user** → email + mot de passe.
2. Copie l'**User UID** généré.
3. Dans **Firestore → Data**, crée une collection `admins` avec un document dont l'**ID est exactement cet UID** (ajoute au moins un champ, ex. `createdAt: true`, sinon Firestore ne persiste pas de document réellement vide).

## Lancer le projet

```bash
npm install
npm run dev       # serveur de dev (http://localhost:5173)
npm run build     # build de production
npm run lint      # oxlint
```

## Utilisation

### Côté admin
1. Connexion sur `/admin/login`.
2. `/admin` liste les parties, permet d'en créer ou d'en supprimer.
3. Dans une partie (`/admin/games/<gameId>`) :
   - **Joueurs** : ajouter un joueur (génère un code à 4 chiffres), lui attribuer une photo, une cible et une mission (tant que la partie est en `setup`).
   - **Missions** : créer, modifier, supprimer les missions du pool.
   - **Démarrer la partie** : vérifie que chaque joueur a une cible et une mission, puis active la partie.
   - **Kills à valider** : approuver ou rejeter les demandes des joueurs — approuver transfère automatiquement la cible et la mission de la victime au tueur, incrémente son score, et termine la partie si plus personne à chasser.
   - **Terminer la partie** : force la fin à tout moment.

### Côté joueur
1. Ouvrir le lien `/play/<gameId>` communiqué par l'admin.
2. Entrer son code à 4 chiffres.
3. Voir sa cible (avec photo si renseignée), sa mission, son score.
4. Cliquer **"J'ai tué ma cible"** une fois la mission accomplie → passe en attente de validation admin.

## Limites connues

- Le bundle JS de production dépasse le seuil recommandé par Vite (~830 Ko) à cause du SDK Firebase ; du code-splitting pourrait être ajouté si besoin.
- L'authentification joueur repose sur l'auth anonyme Firebase + vérification du PIN côté client : suffisant pour un jeu entre amis/collègues, mais pas une sécurité de niveau bancaire (voir `firestore.rules` pour le détail des permissions).
- Les photos de joueurs sont limitées en résolution/qualité (redimensionnées à 200px, compressées en JPEG) pour rester dans la limite de taille d'un document Firestore (1 Mo).
