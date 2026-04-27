# RealTimeChatApp (Localhost)

## Prerequisites

- Node.js (LTS recommended)
- MongoDB running locally on `mongodb://127.0.0.1:27017`

## Setup

Create env files from the examples:

- `Backend/.env` (copy from `Backend/.env.example`)
- `Frontend/.env` (copy from `Frontend/.env.example`)

Install dependencies:

```bash
cd RealTimeChatApp
npm install
npm --prefix Backend install
npm --prefix Frontend install
```

## Run locally

From `RealTimeChatApp/`:

```bash
npm run dev
```

- Backend: `http://localhost:5001` (health: `GET /health`)
- Frontend: Vite will print the URL (usually `http://localhost:5173`)

## Notes

- If your frontend runs on a different port, add it to `Backend/.env` in `CLIENT_ORIGIN`.

## Deploy (Render + Vercel)

### Backend (Render)

Set these environment variables on Render:

- `MONGODB_URI`: your production Mongo connection string
- `CLIENT_ORIGIN`: your Vercel frontend origin(s), comma-separated. Example:
  - `https://your-app.vercel.app,https://*.vercel.app`

### Frontend (Vercel)

Set these environment variables on Vercel (important: **must be present at build time**):

- `VITE_API_URL`: your Render backend base URL, e.g. `https://your-service.onrender.com`
- `VITE_SOCKET_URL`: same as above (or omit to reuse `VITE_API_URL`)

If `VITE_API_URL` is missing in production, the frontend will otherwise try calling `/api/*` on the Vercel domain and you'll see `404 /api/login`.

