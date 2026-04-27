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

