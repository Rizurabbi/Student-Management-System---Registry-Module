"use client";

import { useRouter } from "next/navigation";
import { Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/client";

export function RoleSwitcher() {
  const router = useRouter();
  async function switchRole() {
    await apiFetch("/api/session", { method: "DELETE" });
    router.push("/");
    router.refresh();
  }
  return (
    <Button variant="secondary" size="sm" onClick={switchRole}>
      <Repeat className="h-3.5 w-3.5" /> Switch role
    </Button>
  );
}
