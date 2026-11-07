# Login

A sign-up and sign-in app with a Vue frontend and an Express API backed by MongoDB.

The proxies `/users` requests to the API at [http://localhost:3000](http://localhost:3000). Start the backend first so sign-up, sign-in, and the home page can reach the API.

## Prerequisites

- [Node.js](https://nodejs.org/) 22.18 or later, or 24.12 or later (the frontend `engines` field)
- npm
- A MongoDB database ([MongoDB Atlas](https://www.mongodb.com/atlas))

## Backend

From the project root:

```sh
cd backend
npm install
```

Create `backend/.env` (this file is gitignored):

```
DB=mongodb+srv://<username>:<password>@<cluster-host>/Login
JWT_SECRET=<long-random-string>
```

- `DB` is the MongoDB connection string. The app reads this variable in `backend/index.js`.
- `JWT_SECRET` signs the login cookie. Use a long random value, for example the output of `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`.

Start the API:

```sh
npm start
```

When MongoDB connects, the server listens on [http://localhost:3000](http://localhost:3000). If the connection string is wrong, the process logs `MongoDB connection failed` and does not start listening.

## Frontend

In a second terminal, from the project root:

```sh
cd frontend
npm install
npm run dev
```

Open the url that the frontend runs at. The app redirects to `/signup`. Vite forwards requests that start with `/users` to `http://localhost:3000`, which is configured in `frontend/vite.config.js`.

Production build:

```sh
npm run build
npm run preview
```

The preview server does not include the dev proxy. Point the built app at the API yourself if you serve it outside `npm run dev`.
