# SMS Registry

A focused **Student Management System, Registry module**, built for the PEN Global technical assessment. It covers the four workflows a Registry administrator uses every day: student enrolment, fees and payments, assessment submission, and marksheet and results.

**Stack:** Next.js 15 (App Router) · PostgreSQL · Prisma · TypeScript · Tailwind CSS · Zod · Vitest

> Reasoning behind every non-obvious choice is in [DECISIONS.md](./DECISIONS.md). How AI was used is in [docs/AI_LOG.md](./docs/AI_LOG.md) and summarised below. The data model is in [docs/ERD.md](./docs/ERD.md).

## A 3-minute reviewer tour

1. Open the app and choose "Registry staff". The dashboard shows overdue students, outstanding fees, late submissions, withheld results and ungraded work. Every card links to the list behind it.
2. Click "Overdue students", then open **Tanvir Hossain**. Record a payment: try an amount larger than the balance, then reuse a reference number. Both are refused with a clear message.
3. Open **Assessments, Programming Assignment 1, Open marksheet**. Farhan's work is flagged **Late**. Change a published score and watch it go back to **Withheld**.
4. Click **Switch role** and choose **Nusrat Jahan**. Her Management Case Study grade is graded but withheld, so her **Results** page is empty. Switch to **Maliha Karim** to see published results with classifications.
5. Choose **Imran Sheikh** (no fee assigned) and upload a PDF to **Database Design Report**. Replace it. Then try the closed assignment: it is accepted once, marked Late, and cannot be replaced.

## How to Run it locally

Prerequisites: Node 20.12 or newer, Docker (or installed PostgreSQL 14+).

```bash
git clone https://github.com/Rizurabbi/Student-Management-System---Registry-Module.git
cd Student-Management-System---Registry-Module
cp .env.example .env          # defaults match docker-compose.yml
docker compose up -d          # PostgreSQL on localhost:5432
npm install
npm run db:deploy             # applies the migration (tables + CHECK constraints)
npm run db:seed               # demo data
npm run build                 # for optimized production build
npm start                     # localhost:3000

```

### Environment variables (`.env.example`)

| Variable | Purpose | Default |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://sms:sms@localhost:5433/sms` |
| `UPLOAD_DIR` | Where uploaded files are stored on disk (never under `public/`) | `./uploads` |
| `NEXT_PUBLIC_APP_TIMEZONE` | Time zone used to display dates and read deadline inputs | `Asia/Dhaka` |

### Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` / `build` / `start` | Next.js dev server, production build, production server |
| `npm test` | Unit and database integration tests (needs the database running) |
| `npm run lint` / `typecheck` | ESLint and TypeScript |
| `npm run db:deploy` | Apply existing migrations |
| `npm run db:migrate` | Create a new migration after editing `schema.prisma` |
| `npm run db:seed` / `db:reset` | Reload demo data / drop and recreate the database |
| `npm run db:studio` | Browse the data in Prisma Studio |
| `npm run db:drift-check` | Confirm the migrations match `schema.prisma` (needs an empty `sms_shadow` database) |

## Demo guide

Roles are a simple toggle (no password). Each seeded student exists to show one edge case.

| Student | Shows |
|---------|-------|
| **Amina Rahman** (SMS-2025-0001) | Fully paid. On-time submission, **Distinction**. An open assessment she can still resubmit. |
| **Tanvir Hossain** | **Overdue** balance, plus a **voided** payment in the ledger. Submitted work that is **not graded yet**. |
| **Nusrat Jahan** | Grade entered but **withheld**: students must not see it. |
| **Farhan Ahmed** | **Late** submission, still graded (**Pass**). A balance that is *not* overdue yet. |
| **Sadia Islam** | **Deferred**: balance owed, cannot submit work. |
| **Rafiq Chowdhury** | **Withdrawn** but still owes, so flagged overdue on purpose. |
| **Zara Ali** | Failing grade (**Fail**), fee due soon with nothing paid. |
| **Imran Sheikh** | **No fee assigned**: the empty state and the "assign fee" flow. |
| **Maliha Karim** (SMS-2024-0001) | **Completed**, intake year 2024 (different ID series), results published (Merit, Distinction). |

## What was built

| Workflow | Highlights |
|----------|-----------|
| **Enrolment** | Create and edit students. Auto ID `SMS-YYYY-NNNN`, safe under concurrency. Search by name, ID or email; filter by programme and status. Filters live in the URL. Duplicate email, future or implausible date of birth, and status changes are handled. |
| **Fees and payments** | Fee snapshot from the programme price. Record payments (amount, date, unique reference). Live balance. Overdue flag on the dashboard and fees page. Void instead of delete. Overpayment blocked. CSV export. |
| **Assessments** | Staff create and edit assessments. Students upload PDF or DOCX. One submission per student, resubmission allowed before the deadline, late work accepted once and flagged. Staff see who has not submitted. |
| **Marksheet and results** | Grade grid with live classification. Publish or withhold per student, or in bulk. Students see only published results. Editing a published score re-withholds it. |

## Project structure

```
prisma/            schema.prisma, migrations, seed.ts
src/app/           pages (staff/, student/) and API route handlers (api/)
src/server/        db, session guard, API wrapper, storage, and services/ (all business rules)
src/lib/           pure, unit-tested logic: money, fees, classification, submission rules, validators
src/components/    ui/ primitives, layout/, and one folder per feature
tests/             unit + integration tests
docs/              ERD, AI log, screenshots
```

Route handlers stay thin: check the role, validate with Zod, call a service. Pages read through the same services, so a rule exists in exactly one place.

### API overview

| Method and path | Who | Purpose |
|-----------------|-----|---------|
| `POST/DELETE /api/session` | anyone | Set or clear the role |
| `GET/POST /api/students` | staff | Search and filter, create |
| `GET/PATCH /api/students/[id]` | staff | Read, update (including status) |
| `PUT /api/students/[id]/fee` | staff | Assign or adjust a fee |
| `GET /api/students/[id]/payments` | staff, or the student themself | Ledger |
| `POST /api/students/[id]/payments` | staff | Record a payment |
| `POST /api/payments/[id]/void` | staff | Void a payment |
| `GET/POST /api/assessments` | staff (all) / student (own programme) | List, create |
| `GET/PATCH /api/assessments/[id]` | staff | Read, update |
| `GET /api/assessments/[id]/submissions` | staff | Submissions and the not-submitted list |
| `POST /api/assessments/[id]/submissions` | student | Upload (multipart `file`) |
| `GET /api/submissions/[id]/file` | staff, or the owning student | Authorised download |
| `GET/PUT /api/assessments/[id]/grades` | staff | Marksheet, save grades |
| `POST /api/grades/[id]/publish` | staff | Publish or withhold one |
| `POST /api/assessments/[id]/publish` | staff | Publish or withhold all |
| `GET /api/me/results` | student | Published results only |
| `GET /api/dashboard`, `GET /api/fees/export` | staff | Dashboard data, CSV |

Errors always come back as `{ "error": "...", "issues": [...] }` with a sensible status (400 validation, 401 no role, 403 wrong role, 404, 409 conflict).

**Security and reliability**
- The role is enforced on the server in every API route, never only in the UI.
- Unpublished grades are filtered inside the database query and are never selected for students.
- Uploads are checked by extension and file signature, size-limited, stored outside `public/`, and served only through an authorised route.
- Every input is validated with Zod. The database adds `CHECK` rules, unique constraints and transactions (a locked counter for Student IDs, Serializable transactions for payments).
- Consistent JSON errors, error and not-found pages, empty states, seed data, `.env.example`, Docker Compose and a CI workflow.

## Testing

`npm test` runs 41 tests. The risky rules are covered on purpose:

| Rule | Test file |
|------|-----------|
| Unpublished grades never reach a student | `grades-visibility.test.ts` |
| Late flag and resubmission rules, file validation | `submissions.test.ts` |
| Overdue, balance, duplicate reference, overpayment, void | `fees.test.ts` |
| Student ID uniqueness under concurrency, rollback | `student-id.test.ts` |
| Classification boundaries, money maths | `classification.test.ts`, `money.test.ts` |

The integration tests create their own throwaway records and delete them, so the demo data is never touched.

## How I used AI

- **Tool:** Claude and GitHub Copilot

- **Used for:** Breaking down the assessment brief into implementation tasks, drafting the Prisma schema and service functions, generating Zod validators and API route handlers, suggesting tests for edge cases, and reviewing the code for potential gaps.

- **Where I took control:** I reviewed the generated code against the actual requirements instead of accepting it as-is. I kept API route handlers thin, with role checks and Zod validation, and centralized business rules in shared services to avoid duplication. For the database setup, I wrote the migration by hand rather than relying on generated migration code.

- **How I verified:** I ran `npm run db:drift-check` to check that the hand-written migration matched `schema.prisma`. I also verified the implementation using the project's available tests and development checks, including linting, type checking, and a production build.

## Known limitations

See the end of [DECISIONS.md](./DECISIONS.md). In short: the role toggle is a demo convenience and not security, files are stored on local disk, and there is no email, audit log or real authentication.

## Troubleshooting

- **`Can't reach database server`**: run `docker compose up -d` and check `DATABASE_URL`.
- **Port 5432 already in use**: stop your local Postgres, or change the port mapping in `docker-compose.yml` and `DATABASE_URL`.
- **Reset everything**: `npm run db:reset && npm run db:seed`.
- **Migration drift warning**: create an empty database named `sms_shadow`, then run `npm run db:drift-check`. It should print nothing.
