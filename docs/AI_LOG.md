# AI usage log

> **Edit this file so it is true for you.** The reviewers score how you used AI and whether you can explain it (15%). Lines in [brackets] are for you to fill in from your own experience. Delete anything that did not happen.

## Tools

- Claude (Anthropic), used as a pairing partner for planning, schema design, code generation, tests and review.
- [Add any others: Copilot, ChatGPT, Cursor, and so on.]

## Where AI helped

| Area | What I asked for | What I did with it |
|------|------------------|--------------------|
| Planning | Read the brief line by line and list the hard constraints, edge cases and a day-by-day plan | Used it as a checklist. [what I changed] |
| Schema | Draft the Prisma schema | Kept the derived-balance and fee-snapshot ideas. [what I questioned or changed] |
| Services and API | Generate services, Zod validators and route handlers | [what I read, ran and changed] |
| UI | Generate pages and components in a simple, modern style | [what I adjusted after looking at it in the browser] |
| Tests | Write unit and integration tests for the risky rules | Ran them against my own Postgres. [anything that failed] |

## Where I did not trust it, and how I checked

- **Prisma setup.** [Describe it if it applies to you: the generated migration was written by hand, so I ran `npm run db:drift-check` to confirm it matches `schema.prisma`.]
- **Edge cases.** I re-read the brief and tested by hand: overdue flag, late flag, withheld result, duplicate payment reference, overpayment, unpublished grade not visible to a student.
- [Add one or two real moments where the AI was wrong, weak or too generic, and what you changed. Specific examples are the most convincing part of this file.]

## What I wrote or decided myself

- [For example: the Overdue-applies-to-Withdrawn call, the resubmission rule, which edge cases to seed.]

## How I verified the final result

- `npm test` (unit and database integration tests)
- `npm run lint`, `npm run typecheck`, `npm run build`
- A fresh clone followed from the README only, on [date].
