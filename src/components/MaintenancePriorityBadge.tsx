import type { MaintenancePriority } from '../types/database';

const styles: Record<MaintenancePriority, string> = {
  urgent: 'bg-rose-100 text-rose-800',
  high: 'bg-amber-100 text-amber-800',
  medium: 'bg-clay-soft text-clay',
  low: 'bg-cream text-ink-soft',
};

const labels: Record<MaintenancePriority, string> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export function MaintenancePriorityBadge({ priority }: { priority: MaintenancePriority }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${styles[priority]}`}>
      {labels[priority]}
    </span>
  );
}
