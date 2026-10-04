"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { apiFetch } from "@/lib/client";

export function VoidPaymentButton({ paymentId, reference }: { paymentId: string; reference: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function confirm(reason: string) {
    try {
      await apiFetch(`/api/payments/${paymentId}/void`, { method: "POST", json: { reason } });
      toast.success(`Payment ${reference} voided`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not void payment");
      throw e;
    }
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Void
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={confirm}
        title="Void this payment?"
        message={`Payment ${reference} will stop counting towards the balance. It stays in the ledger as voided, and this cannot be undone.`}
        confirmLabel="Void payment"
        askReason
        danger
      />
    </>
  );
}
