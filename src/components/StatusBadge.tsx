import type { PaymentStatus } from '../types/database';

const config: Record<PaymentStatus, { label: string; className: string }> = {
  paid: { label: 'Paid', className: 'bg-sage-soft text-sage' },
  partial: { label: 'Partial', className: 'bg-clay-soft text-clay' },
  unpaid: { label: 'Unpaid', className: 'bg-rose-soft text-rose' },
};

interface StatusBadgeProps {
  status: PaymentStatus;
  dueAmount?: number;
}

export function PaymentStatusBadge({ status, dueAmount }: StatusBadgeProps) {
  const { label, className } = config[status];
  const text =
    status === 'partial' && dueAmount !== undefined
      ? `₹${dueAmount.toLocaleString('en-IN')} due`
      : label;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {text}
    </span>
  );
}

export function StockStatusBadge({ low }: { low: boolean }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        low ? 'bg-clay-soft text-clay' : 'bg-sage-soft text-sage'
      }`}
    >
      {low ? 'Low' : 'OK'}
    </span>
  );
}
