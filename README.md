# Drug Result System (Next.js + MongoDB)

Role-based system for recording and verifying drug-test results, looked up by national ID — for checking a job applicant's history.

Built with the Next.js App Router, MongoDB (via Mongoose), and self-contained auth (bcrypt password hashing + JWT session cookie). No PHP, no Docker.

## Roles
- **User** — self-registers (Name, National ID, optional Email/Mobile); sees only their own results.
- **Admin** — records results; if the National ID is new, the person profile is created automatically. Looks up anyone's full history. Cannot edit/delete (append-only).
- **SuperAdmin** — all Admin powers, plus: manage admins, manage institutions, view all reports, correct/delete results, and view the audit log.

## Prerequisites
- **Node.js 18+** (you have it if `node -v` works)
- A free **MongoDB Atlas** cluster — https://www.mongodb.com/cloud/atlas (no local database to install)

## Setup

### 1. Get a MongoDB Atlas connection string
Create a free cluster, add a database user, allow your IP (or `0.0.0.0/0` for testing), then **Connect → Drivers** and copy the `mongodb+srv://…` string. Add the database name before the `?`, e.g. `…mongodb.net/drug_results?retryWrites=true&w=majority`.

### 2. Configure `.env`
A `.env` file is already in this folder — open it and fill in:
```
MONGODB_URI="your-atlas-string-here"
AUTH_SECRET="a-long-random-secret"     # generate: openssl rand -base64 32
```
(The `SUPERADMIN_*` values seed your first login — change the password.)

### 3. Install dependencies
```bash
npm install
```

### 4. Seed the first SuperAdmin (and a sample Admin)
```bash
npm run seed
```

### 5. Run
```bash
npm run dev
```
Open http://localhost:3000 and log in.

## Default logins (from the seeder)
| Role | Login (email or national ID) | Password |
|---|---|---|
| SuperAdmin | `super@admin.test` | value of `SUPERADMIN_PASSWORD` |
| Admin | `admin@admin.test` | `password` |

Change these before any real use.

## Key flows
- **Self-register:** `/register` — a citizen creates their account and views their own results. If an Admin already created their profile (no password yet), registering with the same National ID claims it.
- **Add result (Admin):** `/results/new` — Name, National ID, Kit Serial, Institution, Result, Test date, Notes. Auto-creates the person if new; written to the audit log.
- **History (Admin/SuperAdmin):** search at `/search`, then `/people/{nationalId}/history` — full record with a Print / Save-PDF button for the hiring check.
- **Corrections (SuperAdmin):** edit/delete from the history page; every change is audit-logged. Deletes are soft (recoverable via the `deletedAt` field).

## Project structure
```
src/
  app/
    login, register, dashboard, results/new, search,
    people/[nationalId]/history,
    admin/{admins, institutions, reports, audit, results/[id]/edit}
    actions/            # server actions: auth, results, admin
  components/           # Nav, forms, small UI helpers
  lib/
    db.js               # Mongoose connection (cached)
    auth.js             # bcrypt + session helpers (server only)
    jwt.js              # edge-safe JWT sign/verify (used by middleware)
    models/             # User, Institution, DrugTest, AuditLog
  middleware.js         # route protection + role gating
scripts/seed.mjs        # seeds SuperAdmin / sample data
```

## Security notes
- Admins can only **add** results; only SuperAdmins can correct them, and every correction is logged — important for HR/legal use.
- Passwords are bcrypt-hashed; sessions are signed JWTs in an httpOnly cookie.
- Soft deletes mean records are never truly lost.
- Use a strong `AUTH_SECRET`, restrict your Atlas network access, and serve over HTTPS in production. Drug-test results are sensitive personal data.

## Deploy
Works on Vercel out of the box: push to a repo, import in Vercel, set the same `.env` variables in the project settings, and run the seed once (locally against the same Atlas DB, or via a one-off script).
