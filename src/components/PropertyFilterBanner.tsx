import { Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProperty } from '../contexts/PropertyContext';

export function PropertyFilterBanner() {
  const { selectedProperty, properties, loading } = useProperty();

  if (loading) return null;

  const label = selectedProperty?.name ?? 'All properties';

  return (
    <div className="flex items-center gap-2 text-sm text-ink-soft mb-4">
      <Building2 size={16} className="text-rose shrink-0" />
      <span>
        Showing data for <strong className="text-ink font-medium">{label}</strong>
        {properties.length === 0 && (
          <>
            {' '}—{' '}
            <Link to="/settings" className="text-rose hover:underline">
              add a property in Settings
            </Link>
          </>
        )}
      </span>
    </div>
  );
}
