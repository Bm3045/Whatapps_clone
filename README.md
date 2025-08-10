# WhatsApp Web Clone (Minimal Full-Stack)

This repo contains a minimal but complete WhatsApp Web-like clone:
- **Backend**: Node.js + Express + Mongoose (MongoDB)
- **Frontend**: React (Vite) + minimal CSS
- **Realtime**: Socket.IO used for notifying clients of new messages/status

## Structure
- `server/` — backend code
- `frontend/` — frontend code

## Quickstart (local)
1. Start MongoDB (or get an Atlas URI).
2. Backend:
   - `cd server`
   - copy `.env.example` to `.env` and update `MONGO_URI`
   - `npm install`
   - `npm run dev`
3. Frontend:
   - `cd frontend`
   - `npm install`
   - `npm run dev`
4. Open frontend at `http://localhost:5173` (Vite default). Backend default `http://localhost:4000`.

## Importing sample payloads
- Place sample JSON files in `server/payloads/`
- Run `cd server && npm run import`

## Deploy
- Deploy backend to Render/Heroku/ Railway (set `MONGO_URI`).
- Deploy frontend to Vercel (set `VITE_API_URL` and `VITE_WS_URL`).

## Notes & assumptions
- Messages grouped by `wa_id`.
- Demo "send" stores messages in DB but doesn't send to WhatsApp.
- Make sure CORS and socket URLs are configured when deploying.

