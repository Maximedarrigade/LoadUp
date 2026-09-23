# LoadUp

Une appli de suivi de muscu et de nutrition que j'ai développée pour mes propres entraînements. Elle tourne sur iOS, Android et en version web.

Dedans, on peut :

- créer ses programmes (jours, exercices, séries, charges)
- piocher dans un catalogue d'exercices ou ajouter les siens
- enregistrer ses séances avec un minuteur de repos
- suivre sa progression et sa série de jours d'entraînement
- suivre ses repas et ses besoins caloriques, avec une recherche d'aliments via Open Food Facts

Côté technique : Expo / React Native pour l'app, Express + Prisma + PostgreSQL pour l'API, le tout en TypeScript.

## Installation

Il faut Node.js (20+) et PostgreSQL.

```bash
git clone https://github.com/Maximedarrigade/LoadUp.git
cd LoadUp
```

### Backend

```bash
cd BackEnd
npm install
```

Créer un fichier `.env` dans `BackEnd/` :

```env
DATABASE_URL="postgresql://user:password@localhost:5432/loadup"
JWT_SECRET="..."
ENCRYPTION_KEY="..."
FRONTEND_URL="http://localhost:8081"

# seulement utile pour le mot de passe oublié
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
```

Puis :

```bash
npx prisma db push
npm run sync:exercise-library
npm run dev
```

L'API tourne sur `http://localhost:3000`.

### App

```bash
cd FrontEnd
npm install
npx expo start
```
