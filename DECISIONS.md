# Product decisions

The brief says it cares more about how I think than how much I build. This is the reasoning behind the choices that were not spelled out. Each row says what I chose, what else I considered, and what I would change in production.

## How I assumed a Registry team works

A Registry reconciles money against bank statements, never rewrites history, and must be able to answer "who saw what, and when". Most decisions below follow from that.

| # | Area | Decision | Alternatives I considered | Why | In production |
|---|------|----------|---------------------------|-----|---------------|
| 1 | Roles | A role toggle stored in httpOnly cookies. **Every API route and service re-checks the role on the server.** | Real auth (NextAuth) | The brief says auth is optional. The risk that matters is a student calling a staff endpoint, so enforcement is server-side even without passwords. | Real SSO login with signed sessions. |
| 2 | Money | Integer minor units (cents), formatted only at the edge. | `Decimal`, floats | Floats drift (0.1 + 0.2). Integers make sums and `CHECK` constraints exact. | Add a currency column per programme. |
| 3 | Balance | Never stored. `fee - sum(non-voided payments)`, computed on read. | A cached `balance` column | "Real time" is true by construction and can never go out of sync. | Fine at this scale. At large scale, a materialised view. |
| 4 | Fee | Programme has a default price. When assigned, the amount is **copied** into `StudentFee` with its own due date. | Read the programme price live | Changing next year's price must not change what current students owe. Staff can still adjust one student (scholarship) and cannot go below what was already paid. | Multiple fee lines and instalments. |
| 5 | Overdue | `balance > 0 AND dueDate < now`. It applies to **every status**, including Withdrawn and Deferred. | Skip withdrawn students | The money is still owed. The dashboard shows the status badge next to it so Registry can decide (chase or write off). | A write-off action with its own audit entry. |
| 6 | Payments | Append-only ledger. Wrong entries are **voided** (with a reason), never deleted. `reference` is unique and upper-cased. | Edit or delete | Auditability, and one bank receipt cannot be recorded twice. | Add who voided it, from the real user. |
| 7 | Overpayment | Blocked, and the error shows the exact remaining balance. Checked inside a Serializable transaction. | Store as credit | Simplest correct behaviour. Serializable stops two simultaneous payments both passing the check. | A credit or refund workflow. |
| 8 | Student ID | `SMS-<intake year>-<0001>` from a per-year counter row, incremented **inside the same transaction** that creates the student. | `max(id)+1`, UUID | Postgres locks the counter row, so concurrent creates never collide. A failed create rolls the counter back, so errors leave no gaps. A test creates 12 IDs concurrently. | Same. |
| 9 | Late work | The **server clock** decides. First submission after the deadline is accepted and flagged Late. Resubmission is allowed only before the deadline. | Block late work, allow unlimited late resubmits | Matches the brief ("accepted but visually flagged") and stops a late file being swapped repeatedly. | Per-assessment late policy and penalties. |
| 10 | Deadline change | Moving a deadline re-evaluates the Late flag for existing submissions. | Leave the old flag | The badge must never disagree with the deadline shown on the page. | Notify affected students. |
| 11 | Uploads | Extension **and** file signature (magic bytes) checked, 10 MB cap. Stored outside `public/` under a random name. Served only through an authorised route (staff, or the owning student). | Trust the MIME type | A browser-supplied type or filename is easy to fake. A file in `public/` is reachable by anyone with the URL. | S3 with signed URLs and virus scanning. Only `server/storage.ts` changes. |
| 12 | Who can submit | Only **Enrolled** students in the assessment's programme. | Anyone | A Deferred or Withdrawn student should not be handing in new work. Cross-programme uploads are refused. | Same. |
| 13 | Grades | Separate from submissions. Classification is **computed**, with a Fail band under 40 (the brief names none, but it is needed). A `CHECK` constraint enforces 0 to 100 in the database as well as in Zod. | Store classification | Staff can grade work that was never uploaded. Changing boundaries later cannot leave stale data. | Configurable grade boundaries per module. |
| 14 | Result visibility | Students read grades through **one function** that filters `published = true` inside the database query and selects only safe columns. A test proves unpublished grades never come back. | Filter in the UI | The UI can be wrong. The query cannot leak. | Same, plus an audit log of publish events. |
| 15 | Editing after publish | Changing the score of a published grade moves it back to **Withheld**. Staff are warned and must republish. | Silent overwrite | A student must never see a number that was changed without a second look. Feedback-only edits keep it published. | Version history of grade changes. |
| 16 | Programme change | Allowed only while a student has no payments, submissions or grades. Then the fee re-snapshots. | Always allow | After activity a silent change would rewrite history. It should be a deliberate manual adjustment. | A proper transfer workflow. |
| 17 | Time zones | Dates display in `NEXT_PUBLIC_APP_TIMEZONE`, and deadline inputs are read in that same zone. Stored as UTC. | Browser time zone | Server and browser rendering never disagree, and "17:00 deadline" means the same to everyone. | Per-institution setting. |
| 18 | Architecture | Rules live in `src/server/services`. Route handlers are thin (auth, validate, call a service). Pages read through the same services. | Logic inside routes | One place per rule means one place to test. | Same. |
| 19 | Prisma client | Prisma's Rust-free client with the `pg` driver adapter. | Default engine | No native query-engine binary to download, so it works in locked-down networks. | Same. |

## Deliberately not built

Real authentication and password reset, S3 storage, email notifications, an audit log table, multi-currency, instalment plans, pagination on the fees page (it computes balances for everyone, which is fine for a few thousand students), and rate limiting. Each is a real need, and each would bury the decisions above in this time box.

## Known limitations

- The role toggle is not secure. Anyone can pick any role. It exists so both views can be demonstrated.
- The fees page loads all students and computes balances in memory.
- Uploaded files live on local disk, so a multi-server deployment needs shared storage.
