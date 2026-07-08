import { X } from 'lucide-react';

type BannerVariant = 'success' | 'info' | 'error';

const styles: Record<BannerVariant, string> = {
  success: 'bg-sage/10 border-sage/30 text-ink',
  info: 'bg-rose-soft/50 border-rose/20 text-ink',
  error: 'bg-rose/10 border-rose/30 text-rose',
};

export function Banner({
  message,
  variant = 'info',
  onDismiss,
}: {
  message: string;
  variant?: BannerVariant;
  onDismiss?: () => void;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm mb-4 ${styles[variant]}`}
      role="status"
    >
      <p className="flex-1">{message}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 p-0.5 rounded hover:bg-black/5"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
