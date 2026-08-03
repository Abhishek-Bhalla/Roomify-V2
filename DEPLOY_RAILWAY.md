# Deploy Backend to Railway + Frontend on Vercel

The free Render plan sleeps and that was making cron-driven emails slow/late.
Railway's $5/mo Hobby plan keeps the process alive, cron fires on time, and
Gmail SMTP (port 465) is allowed from Railway IPs.

## What I changed

1. `backend/utils/emailService.js` — Gmail SMTP via nodemailer is now the **primary** path; SendGrid is just a fallback if `SENDGRID_API_KEY` is set. The transporter is reused (`pool: true`) so cron-driven sends are fast.
2. `backend/server.js` — binds to `0.0.0.0` (Railway requirement). Already read `process.env.PORT`.
3. `railway.json` — Nixpacks build, `node backend/server.js` start, `/api/health` healthcheck.
4. `Procfile` — fallback if you ever switch builder.
5. `backend/.gitignore` — keeps `.env` out of git.

## 1. Pick an email provider

**Recommended: SendGrid API** — works reliably from Railway's cloud egress IPs
because it's HTTPS, not SMTP. Gmail SMTP from Railway is hit-or-miss because
Google throttles/shared-cloud IPs.

### Option A: SendGrid (default for production)

1. https://signup.sendgrid.com → sign up (free tier = 100 emails/day).
2. **Settings → Sender Authentication → Single Sender Verification** → add
   the Gmail address you want to send from. Click the verification email.
3. **Settings → API Keys → Create API Key** with Mail Send permission.
   Copy the `SG.…` key (shown once).
4. On Railway: set env vars:
   - `SENDGRID_API_KEY` = the `SG.…` key
   - `EMAIL_USER` = your verified sender address (used in the `from`)

### Option B: Gmail SMTP (often unreliable from cloud platforms)

1. Enable 2-Step Verification on the Gmail account.
2. https://myaccount.google.com/apppasswords → create one labelled `CampusSpace`.
3. On Railway: set `EMAIL_USER`, `EMAIL_PASS` (16-char App Password).
   Optionally `EMAIL_PORT=587` (default; `465` sometimes times out from Railway).

If both `SENDGRID_API_KEY` and `EMAIL_USER`/`EMAIL_PASS` are set, SendGrid is used.
Gmail is the fallback. The right way to think about it: set **one** path, not both.

## 2. Deploy backend on Railway

1. https://railway.com → New Project → Deploy from GitHub → pick this repo.
2. Railway auto-detects Node via `railway.json`.
3. Settings → Root Directory: leave **blank** (it must run from repo root so it finds `backend/`).
4. Add a MongoDB plugin → copy the connection string into `MONGO_URI`.
5. Set Variables (Settings → Variables):

| Key | Value | Notes |
| --- | --- | --- |
| `NODE_ENV` | `production` | |
| `PORT` | (auto) | Railway sets it, don't override |
| `MONGO_URI` | mongodb+srv://... | From Railway Mongo plugin or Atlas |
| `JWT_SECRET` | (random 32+ chars) | |
| `EMAIL_USER` | `you@gmail.com` | The Gmail address |
| `EMAIL_PASS` | (16-char App Password) | No spaces |
| `EMAIL_PORT` | `465` | 465 = SSL (recommended) |
| `FRONTEND_URL` | `https://your-app.vercel.app` | Used in feedback email links |
| `SENDGRID_API_KEY` | (leave unset) | Optional fallback |

6. Click Deploy. When the build succeeds, open the public URL it generated → hit `/api/health` to verify.

## 3. Point the Vercel frontend at the Railway backend

In `frontend` on Vercel → Settings → Environment Variables:

| Key | Value |
| --- | --- |
| `VITE_API_URL` | `https://<your-railway-service>.up.railway.app/api` |

Redeploy the frontend so the build picks up the new variable.

## 4. Allow the frontend to call Railway (CORS)

`backend/app.js` already allows `origin: '*'`, so no change is needed. If you want
to lock it down later, set the URL in `cors.origin`.

## 5. Verify emails are working on Railway

After Railway is live, run a real booking through the app. Watch the Railway logs —
you should see:

```
📧 Email sent via Gmail SMTP: bookingCreated to <you>@gmail.com (id=...)
```

Then check the Spam folder once; the first send from a new IP is often flagged.

## Using non-Gmail SMTP

If your college uses Google Workspace (so `EMAIL_USER` ends in your college
domain, not `@gmail.com`), the App Password still works as long as the
account has 2FA. For Outlook/Exchange, change `host` in `getSmtpTransporter`
to `smtp.office365.com` and `port` to `587` with `secure: false`.

## Why this fixes the issue you had

- Render Free → service spins down → crons don't fire → emails look "late"
- Railway Hobby → always-on process → `*/5 * * * *` and `*/10 * * * *` crons fire every minute as expected
- SMTP is now the primary path → no SendGrid throttling/queue delay
- Connection pooling → second email of the day reuses the open SMTP socket
