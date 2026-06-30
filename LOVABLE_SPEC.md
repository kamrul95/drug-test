# Drug Result System — Build Spec for Lovable

> Paste this whole document into Lovable as the project brief. It describes a role-based web app for recording and verifying drug-test results, looked up by national ID — used to check a person's history when they apply for a job.

---

## 1. One-paragraph build prompt

Build a responsive web app called **Drug Result System** with email/ID + password authentication and three roles (User, Admin, SuperAdmin). Citizens (Users) self-register and can view only their own drug-test results. Admins record test results and can look up any person's full history by national ID; if the person or the testing institution doesn't exist yet, it is created automatically when saving a result. SuperAdmins can do everything Admins can, plus manage admin accounts and institutions, view all results, correct or delete records, and view an audit log of every change. Use a clean, modern, warm design. Use Supabase for auth and the Postgres database.

---

## 2. Suggested tech stack (Lovable defaults are fine)

- React + Vite + Tailwind CSS + shadcn/ui components
- Supabase: Postgres database, Supabase Auth (email/password), Row Level Security
- Supabase Edge Functions only if needed for the auto-create logic (otherwise handle in the client with RLS-protected inserts)

---

## 3. Roles & permissions

| Capability | User | Admin | SuperAdmin |
|---|---|---|---|
| Self-register own account | ✅ | — | — |
| View own results | ✅ | — | — |
| Add a drug-test result | — | ✅ | ✅ |
| Auto-create a person while adding a result | — | ✅ | ✅ |
| Auto-create an institution while adding a result | — | ✅ | ✅ |
| Search people & view anyone's full history | — | ✅ | ✅ |
| Edit / delete (correct) a result | — | — | ✅ |
| Create / enable / disable admin accounts | — | — | ✅ |
| Manage institutions (add / enable / disable) | — | — | ✅ |
| View all results across institutions + audit log | — | — | ✅ |

**Important rule:** Admins can only **add** results (append-only). Only SuperAdmins can edit or delete them, and every correction is written to the audit log. Deletes are **soft deletes** (a `deleted_at` timestamp), so records are never truly lost.

---

## 4. Authentication & registration logic

- **Login** accepts **either an email or a national ID** plus password.
- **Self-registration (User):** fields = Full Name, National ID (NID or Birth Certificate number), Email (optional), Mobile (optional), Password.
- **Claim flow:** if an Admin already created a person profile (national ID exists but has no password / never logged in), and someone self-registers with that same national ID, they "claim" that existing profile by setting a password — rather than creating a duplicate.
- Passwords hashed by Supabase Auth. Sessions handled by Supabase.

---

## 5. Screens / pages

1. **Login** — email-or-national-ID + password. Two-panel layout: branded accent panel on the left, form on the right (form only on mobile).
2. **Register** — the self-registration form above.
3. **Dashboard (role-aware):**
   - *User:* greeting, their national ID, a "latest result" chip, and a table of their own test history.
   - *Admin/SuperAdmin:* stat cards (total people, total tests, positive count, tests entered by me), quick actions (Add Result, Search), and a table of the 10 most recent results.
4. **Add Result** (Admin/SuperAdmin) — form with:
   - **National ID** — a **searchable combobox**: typing live-searches existing people; selecting one auto-fills and locks their name; if no match, a new person profile will be created on save.
   - **Person's Name** (auto-filled if existing person selected)
   - **Kit Serial Number**
   - **Institution** — a **searchable combobox**: live-searches existing institutions; selecting one uses it; if the typed name doesn't exist, a new institution is created on save (show a "new institution will be created" hint).
   - **Result** — dropdown: Negative / Positive
   - **Test Date** — date picker (cannot be in the future)
   - **Notes** — optional
5. **Search** (Admin/SuperAdmin) — search people by national ID, name, or mobile; results link to the person's history.
6. **Person History** (Admin/SuperAdmin) — `/people/{nationalId}/history`: a person card (name, national ID, mobile, email) + latest-result chip + a chronological table of every test (date, result badge, kit serial, institution, recorded-by, notes). Includes a **Print / Save-as-PDF** button (this is the page shown during a hiring check). SuperAdmin also sees **Edit** and **Delete** actions per row.
7. **Edit Result** (SuperAdmin) — correct a result; banner notes the change is logged.
8. **Manage Admins** (SuperAdmin) — list admin/superadmin accounts with enable/disable toggles; a form to create a new admin (name, national ID, email, mobile, role, institution, password). A SuperAdmin cannot disable their own account.
9. **Manage Institutions** (SuperAdmin) — list institutions with test counts and enable/disable toggles; a form to add an institution (name, address).
10. **All Reports** (SuperAdmin) — every result across institutions, filterable by result, institution, and date range.
11. **Audit Log** (SuperAdmin) — chronological log of every create/update/delete with actor, action, subject, and a summary of changes.

---

## 6. Core business logic

- **Auto-create person:** when saving a result, look up the national ID. If found, attach the result to that person (warn if the typed name differs from the stored name, but don't block). If not found, create a new person (role = user, no password) and attach the result.
- **Find-or-create institution:** if a matching institution id is selected, use it. Otherwise match by name (case-insensitive); if none, create a new institution.
- **Append-only for Admins; corrections by SuperAdmin only**, all corrections audit-logged.
- **Soft delete** results via `deleted_at`; exclude soft-deleted rows from all normal queries and counts.
- **Audit log entry** written on: person auto-create, institution auto-create, result create, result update (store before/after), result delete, admin create, admin enable/disable.

---

## 7. Database tables (Postgres / Supabase)

> The original app used MongoDB; below is the equivalent relational schema for Supabase. Use UUID primary keys.

### `profiles` (people + staff accounts)
Extends Supabase `auth.users` (link by `id`). Holds everyone: citizens, admins, superadmins.

| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | matches `auth.users.id` for accounts that can log in |
| name | text | required |
| national_id | text | **unique**, indexed — NID or Birth Certificate number; the master lookup key |
| email | text | nullable, unique when present |
| mobile | text | nullable |
| role | text | enum: `user` \| `admin` \| `superadmin`; default `user` |
| institution_id | uuid | nullable, FK → institutions.id (which institution an admin belongs to) |
| is_active | boolean | default true |
| created_by | uuid | nullable, FK → profiles.id |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | |

> Note: a person auto-created by an Admin has a `profiles` row but **no** `auth.users` login until they self-register (claim). If easier in Lovable/Supabase, keep two concepts: a `people` table for everyone, and use Supabase Auth only for those who log in — but a single `profiles` table with a nullable auth link is preferred.

### `institutions`

| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| name | text | required |
| address | text | nullable |
| is_active | boolean | default true |
| created_at | timestamptz | default now() |

### `drug_tests`

| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| person_id | uuid | FK → profiles.id, indexed (the tested person) |
| serial_number | text | required (kit serial number) |
| institution_id | uuid | FK → institutions.id |
| result | text | enum: `positive` \| `negative` |
| test_date | date | required, not in the future |
| notes | text | nullable |
| recorded_by | uuid | FK → profiles.id (admin who entered it) |
| deleted_at | timestamptz | nullable (soft delete) |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | |

### `audit_logs`

| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| actor_id | uuid | nullable, FK → profiles.id |
| actor_name | text | denormalized name snapshot |
| action | text | `created` \| `updated` \| `deleted` |
| subject_type | text | `DrugTest` \| `Profile` \| `Institution` |
| subject_id | uuid | nullable |
| changes | jsonb | before/after or summary |
| created_at | timestamptz | default now() |

**Relationships summary:** a profile has many drug_tests (as person) and many drug_tests (as recorder); an institution has many drug_tests; audit_logs reference an actor profile.

---

## 8. Row Level Security (Supabase) — intended rules

- **profiles:** a user can read/update their own row; admins & superadmins can read all profiles; admins/superadmins can insert person profiles; only superadmins can create admin/superadmin profiles or toggle `is_active`.
- **drug_tests:** a user can read only rows where `person_id = auth.uid()`; admins & superadmins can read all and insert; only superadmins can update or set `deleted_at`.
- **institutions:** all staff can read active ones and insert; only superadmins can toggle `is_active`.
- **audit_logs:** insert allowed for any authenticated staff action; read restricted to superadmins.

(Use a helper that reads the caller's role from their `profiles` row.)

---

## 9. Design direction

Modern, warm, calm — inspired by a Claude-style aesthetic.

- **Background:** warm off-white `#faf9f5`
- **Accent:** terracotta `#d97757`, hover `#c45f3f`
- **Text:** stone/near-black `#292524`; muted text in stone-500
- **Borders:** soft warm gray `#e7e2d8`
- **Cards:** white, rounded-2xl, subtle soft shadow
- **Result badges:** Negative = green (emerald) pill; Positive = red pill
- Generous spacing, clean sans-serif, rounded inputs/buttons, sticky light top nav with a brand mark (🧪 Drug Results) and a user avatar/initial.

---

## 10. Seed data

- One **SuperAdmin** account (email + password set at setup).
- One sample **Admin** account.
- One sample **Institution** (e.g. "Central Diagnostic Lab").

---

## 11. Acceptance checks

1. A citizen can register, log in, and see only their own results.
2. An admin can add a result for a brand-new national ID and the person profile is created automatically.
3. Typing an institution name that doesn't exist creates it on save; an existing one is reused.
4. The person-history page shows the full chronological record and prints cleanly.
5. An admin cannot edit/delete results; a superadmin can, and the change appears in the audit log.
6. A superadmin can create an admin and disable an account (but not their own).
