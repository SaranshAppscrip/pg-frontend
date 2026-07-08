import type { MaintenanceStatus } from '../types/database';

const styles: Record<MaintenanceStatus, string> = {
  open: 'bg-clay-soft text-clay',
  in_progress: 'bg-amber-100 text-amber-800',
  resolved: 'bg-sage-soft text-sage',
  closed: 'bg-cream text-ink-soft',
};

const labels: Record<MaintenanceStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

export function MaintenanceStatusBadge({ status }: { status: MaintenanceStatus }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
