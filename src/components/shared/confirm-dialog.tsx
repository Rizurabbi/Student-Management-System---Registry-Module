"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";

// Confirmation before anything destructive. Optionally asks for a reason (used for voiding payments).
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  askReason = false,
  danger = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  askReason?: boolean;
  danger?: boolean;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      await onConfirm(reason);
      setReason("");
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-slate-600">{message}</p>
      {askReason && (
        <Textarea className="mt-3" placeholder="Reason (required)" value={reason} onChange={(e) => setReason(e.target.value)} />
      )}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant={danger ? "danger" : "primary"} onClick={run} disabled={busy || (askReason && reason.trim().length < 3)}>
          {busy ? "Working..." : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
