import { Sidebar, type NavItem } from "./sidebar";
import { RoleSwitcher } from "./role-switcher";

export function AppShell({
  items,
  roleLabel,
  userLabel,
  children,
}: {
  items: NavItem[];
  roleLabel: string;
  userLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Sidebar items={items} roleLabel={roleLabel} userLabel={userLabel} />
      <div className="md:pl-60">
        <header className="hidden h-16 items-center justify-end border-b border-slate-200 bg-white/80 px-8 backdrop-blur md:flex">
          <RoleSwitcher />
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
          <div className="mb-4 flex justify-end md:hidden">
            <RoleSwitcher />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
