# AGENTS.md

## Cursor Cloud specific instructions

### Architecture
- **Frontend**: React 18 + TypeScript + Vite (port 3000)
- **Backend**: Node.js + Express (port 3001)
- **Database**: MongoDB (port 27017, via Docker Compose at `backend/docker-compose.yml`)

### Running services

1. **MongoDB**: `sudo docker compose -f backend/docker-compose.yml up -d mongodb`
2. **Backend**: `cd backend && npm run dev` (nodemon auto-restarts on changes)
3. **Frontend**: `cd frontend && npm run dev` (Vite dev server with proxy to backend)

The frontend Vite config proxies `/api` requests to `http://localhost:3001`, so no CORS issues in dev mode.

### Environment files
- `backend/.env` must exist with at least `MONGODB_URI`, `JWT_SECRET`, and `PORT` set. See `README.md` for required vars.
- Twilio vars are optional; the reminder service gracefully disables itself if they're absent.

### Testing
- **Backend tests**: `cd backend && npm test` — uses `mongodb-memory-server` (no real DB needed). Pre-existing test failures exist due to mobile number E.164 validation mismatches in test fixtures.
- **Frontend tests**: `cd frontend && npx vitest run` — uses jsdom. Some pre-existing test failures exist in form-builder tests.
- **Frontend lint**: `cd frontend && npx eslint . --ext js,jsx,ts,tsx` — pre-existing warnings (`--max-warnings 0` will fail).
- **TypeScript check**: `cd frontend && npx tsc --noEmit` — pre-existing type errors in mock data and unused imports.

### Gotchas
- The first user registered via `POST /api/auth/register` automatically becomes admin. Subsequent users become participants.
- Events require a `registrationFormId` (create a registration form first via `POST /api/registration-forms`).
- Docker must be started with `sudo dockerd` in this environment (runs inside a Firecracker VM).
- The backend uses ES modules (`"type": "module"` in package.json).
- `TWILIO_WHATSAPP_NUMBER` can be set with or without the `whatsapp:` prefix (e.g. `+14155238886` or `whatsapp:+14155238886`); the backend normalizes it via `ensureWhatsAppPrefix()`.
- When restarting the backend, if `JWT_SECRET` is set both in `backend/.env` and as a shell env var, `dotenv` does NOT override the shell value. This can invalidate browser sessions if the secrets differ.
