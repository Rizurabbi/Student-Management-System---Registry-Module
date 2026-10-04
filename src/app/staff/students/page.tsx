import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { listProgrammes, listStudents } from "@/server/services/students";
import { studentQuerySchema } from "@/lib/validators/student";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import { StudentFilters } from "@/components/students/filters";
import { StudentTable } from "@/components/students/student-table";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/empty-state";

type SP = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function StudentsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const raw = { q: first(sp.q), programmeId: first(sp.programmeId), status: first(sp.status), page: first(sp.page) };
  // A bad value in the URL (for example ?status=abc) falls back to "no filter" instead of crashing.
  const parsed = studentQuerySchema.safeParse(raw);
  const query = parsed.success ? parsed.data : { page: 1 };
  const [data, programmes] = await Promise.all([listStudents(query), listProgrammes()]);
  const hasFilters = !!(query.q || query.programmeId || query.status);

  return (
    <>
      <PageHeader
        title="Students"
        description="Search the register by name, ID, email, programme or status."
        actions={
          <Link href="/staff/students/new" className={buttonClass("primary")}>
            <Plus className="h-4 w-4" /> New student
          </Link>
        }
      />
      <Card>
        <Suspense>
          <StudentFilters programmes={programmes.map((p) => ({ id: p.id, name: p.name }))} />
        </Suspense>
        {data.items.length === 0 ? (
          <EmptyState
            title={hasFilters ? "No students match these filters" : "No students yet"}
            description={hasFilters ? "Try a different search or clear the filters." : "Create the first student record to get started."}
            action={
              hasFilters ? (
                <Link href="/staff/students" className={buttonClass("secondary", "sm")}>
                  Clear filters
                </Link>
              ) : (
                <Link href="/staff/students/new" className={buttonClass("primary", "sm")}>
                  New student
                </Link>
              )
            }
          />
        ) : (
          <>
            <StudentTable rows={data.items} />
            <Pagination
              page={data.page}
              pageCount={data.pageCount}
              total={data.total}
              basePath="/staff/students"
              params={{ q: query.q, programmeId: query.programmeId, status: query.status }}
            />
          </>
        )}
      </Card>
    </>
  );
}
