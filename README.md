# Taku

Two projects in this folder.

- `web` is the phone app. It keeps data on the device and uploads a backup when a server URL is saved in Settings.
- `backend` is one Vercel Node function. Postgres is an external service. Set `DATABASE_URL` to that service's pooled connection string. The app does not run a database.

## Web

```bash
cd web
npm install
npm run dev
```

## Backend

Copy `backend/.env.example` to `backend/.env` and set `DATABASE_URL` and `API_TOKEN`.

```bash
cd backend
npm install
npm run dev
```

The local server listens on `http://127.0.0.1:3000`. In the app Settings, use that URL and the same token.

Deploy the `backend` directory to Vercel. The function is `api/[...path].ts`. Rewrites expose `/meta`, `/activities`, and `/entries` on the deployment origin. Put the same `DATABASE_URL` and `API_TOKEN` in the Vercel project env. In Settings, the server URL is the deployment origin, for example `https://your-backend.vercel.app`.
