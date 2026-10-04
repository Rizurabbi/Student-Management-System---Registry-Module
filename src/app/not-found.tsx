import Link from "next/link";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="text-5xl font-semibold text-brand-600">404</p>
      <h1 className="mt-3 text-lg font-semibold">We could not find that page</h1>
      <p className="mt-1 text-sm text-slate-500">It may have been removed, or you may not have access to it.</p>
      <Link href="/" className={buttonClass("primary", "md", "mt-6")}>
        Back to start
      </Link>
    </main>
  );
}
