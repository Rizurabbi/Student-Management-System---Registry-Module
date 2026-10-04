// Pure fee maths. Balance is always derived, never stored.

export type FeeState = {
  fee: number;
  paid: number;
  balance: number;
  overdue: boolean;
  daysOverdue: number;
  status: "PAID" | "OVERDUE" | "OUTSTANDING";
};

const DAY = 86_400_000;

export function computeFeeState(input: {
  feeAmount: number;
  dueDate: Date;
  paidTotal: number;
  now?: Date;
}): FeeState {
  const now = input.now ?? new Date();
  const balance = Math.max(input.feeAmount - input.paidTotal, 0);
  const overdue = balance > 0 && input.dueDate.getTime() < now.getTime();
  const daysOverdue = overdue ? Math.max(1, Math.floor((now.getTime() - input.dueDate.getTime()) / DAY)) : 0;
  return {
    fee: input.feeAmount,
    paid: input.paidTotal,
    balance,
    overdue,
    daysOverdue,
    status: balance === 0 ? "PAID" : overdue ? "OVERDUE" : "OUTSTANDING",
  };
}
