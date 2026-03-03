# Run and test locally with Docker Desktop

Use this to run the full stack (MongoDB + Backend + Frontend) in Docker and test the WhatsApp and reminder changes.

## Prerequisites

- **Docker Desktop** installed and running (Windows/Mac).
- A **`.env`** file in the project root with at least:
  - `MONGODB_URI` (overridden to local Mongo when using this compose)
  - `JWT_SECRET`
  - `PORT=3001`
  - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`
  - `TWILIO_WHATSAPP_TEMPLATE_SID`, `TWILIO_WHATSAPP_MARKETING_TEMPLATE_SID`

The compose file uses `.env` for the backend and forces `MONGODB_URI=mongodb://mongodb:27017/zubin-foundation` so the app uses the MongoDB container.

## 1. Start the stack

From the project root (where `docker-compose.yml` is):

```bash
docker compose up --build
```

First run may take a few minutes (build + pull). When you see the backend log line like `[REMINDER SERVICE] Reminder service started`, the stack is up.

- **Frontend:** http://localhost:3000  
- **Backend API:** http://localhost:3001  
- **MongoDB:** localhost:27018 (host port; container uses 27017 — avoids conflict with a local MongoDB on 27017)

## 2. Create admin and data (first time)

With the stack running, in another terminal:

```bash
# Create admin user (adjust if your create-admin script differs)
docker compose exec backend node scripts/create-admin.js
```

Or use the app’s registration flow and promote the first user to admin (see project docs). Then log in and create an event and a registration form, register a participant with a phone number, and (if applicable) join the Twilio sandbox so the number can receive WhatsApp.

## 3. Test today’s changes

### Send WhatsApp (marketing template only)

1. Log in as admin/staff.
2. Open an event that has at least one registered participant.
3. Go to **Manage registrations** (or equivalent).
4. Click **Send WhatsApp**.
5. In the dialog you should see only **Message (template variable 2)** (no subtitle).
6. Enter a short message and send.
7. Backend should log something like `[WhatsApp] Using marketing template` and no freeform `body`; check Twilio console for a message using the marketing template.

### Reminders (template-only, no freeform)

- Reminder cron runs at the **top of each hour** (Asia/Hong_Kong). To test without waiting:
  - Call `POST http://localhost:3001/api/reminders/trigger` (if that route is enabled and you’re authenticated as needed), or
  - Set an event’s reminder to e.g. “1 hour before” and ensure its start time is in the next 1–2 hours so the next :00 run will send.
- In backend logs you should see either the 8-var reminder template or the marketing template for reminders, and no freeform WhatsApp body.

### Subscribe webhook (still freeform by design)

- Sending **STOP** or **START** to the Twilio WhatsApp number should still get a freeform reply (e.g. “You have been unsubscribed…”). That’s intentional (reply inside the 24h window).

## 4. Stop and clean up

```bash
docker compose down
```

To remove the MongoDB data volume as well:

```bash
docker compose down -v
```

## Troubleshooting

- **Backend “Twilio client not initialized”**  
  Ensure `.env` has `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`.

- **Template / 21619 or 63016**  
  Ensure `.env` has `TWILIO_WHATSAPP_TEMPLATE_SID` and `TWILIO_WHATSAPP_MARKETING_TEMPLATE_SID` (same values as in Twilio Content Templates).

- **Frontend can’t reach API**  
  The frontend image is built with `VITE_API_URL=http://localhost:3001/api`. You must open the app at **http://localhost:3000** (not another host/port) so the browser can call `http://localhost:3001/api`.

- **Reminders not firing**  
  Reminders are checked every 5 minutes (Hong Kong time). Ensure the backend container is running and that events have `reminderTimes` and a start time in the correct window.
