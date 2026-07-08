import { useEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';

interface ExportMenuProps {
  onExport: (format: 'csv' | 'xlsx') => Promise<void>;
  disabled?: boolean;
  onSuccess?: (format: 'csv' | 'xlsx') => void;
  onError?: (error: Error) => void;
}

export function ExportMenu({ onExport, disabled, onSuccess, onError }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleExport(format: 'csv' | 'xlsx') {
    setExporting(true);
    setOpen(false);
    try {
      await onExport(format);
      onSuccess?.(format);
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error('Export failed'));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="btn-secondary"
        disabled={disabled || exporting}
        onClick={() => setOpen((v) => !v)}
      >
        <Download size={16} />
        {exporting ? 'Exporting…' : 'Export'}
      </button>
      {open && (
        <div className="absolute right-0 mt-1 z-20 min-w-[140px] rounded-lg border border-border bg-white shadow-lg py-1">
          <button
            type="button"
            className="w-full text-left px-4 py-2 text-sm hover:bg-cream"
            onClick={() => handleExport('csv')}
          >
            CSV
          </button>
          <button
            type="button"
            className="w-full text-left px-4 py-2 text-sm hover:bg-cream"
            onClick={() => handleExport('xlsx')}
          >
            Excel (.xlsx)
          </button>
        </div>
      )}
    </div>
  );
}
