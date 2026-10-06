# AI usage log

## Tools

- Claude (Anthropic), used as a pairing partner for planning, schema design.
- Copilot, used for testing and review.

## Where AI helped

| Area | What I asked for | What I did with it |
|------|------------------|--------------------|
| Planning | AI assistance was used to help break the Registry requirements into smaller implementation tasks and consider how enrolment, fees, assessment submissions, and results relate to one another, and a day-by-day plan | Used it as a checklist. AI-assisted reasoning helped me to organize the application into route handlers, services, reusable business logic, database access, and UI components. |
| Schema | Draft the Prisma schema | I took help to minimize the time required in planning the prisma schema and database connections |
| Services and API | Generate services, Zod validators and route handlers | Reviewed and adapted the generated code to fit the project structure. Checked that request data was validated with Zod, role checks were handled in route handlers, and business rules remained centralized in services instead of being duplicated across endpoints  |

## Where I did not trust it, and how I checked

- **Prisma setup.** the generated migration was written by hand, so I ran `npm run db:drift-check` to confirm it matches `schema.prisma`.
- **Edge cases.** I re-read the brief and tested by hand: overdue flag, late flag, withheld result, duplicate payment reference, overpayment, unpublished grade not visible to a student.
- **Validation.** AI suggested basic Zod validation for payment amounts or grades, but validating the data type alone wasn't enough. I made sure the application also enforced business constraints, such as rejecting invalid grades and handling overpayments according to the intended fee rules.

