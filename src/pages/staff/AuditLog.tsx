import { useEffect, useState } from 'react';
import { auditApi } from '../../lib/api';
import { formatDate, formatCurrency } from '../../lib/utils';
import { StaffLayout } from '../../components/Layout';
import { PageHeader, EmptyState } from '../../components/ui';
import type { AuditAction, AuditEntityType, StaffAuditLogEntry } from '../../types/database';

const actionLabels: Record<AuditAction, string> = {
  create: 'Created',
  delete: 'Deleted',
  move_out: 'Moved out',
};

const entityLabels: Record<AuditEntityType, string> = {
  payment: 'Payment',
  expense: 'Expense',
  tenant: 'Tenant',
};

function describeEntry(entry: StaffAuditLogEntry): string {
  const meta = entry.metadata;
  switch (entry.entity_type) {
    case 'payment':
      if (entry.action === 'create' || entry.action === 'delete') {
        return `${meta.for_month ?? ''} · ${formatCurrency(Number(meta.amount ?? 0))} · ${String(meta.mode ?? '')}`;
      }
      break;
    case 'expense':
      return `${meta.category ?? ''} · ${formatCurrency(Number(meta.amount ?? 0))}`;
    case 'tenant':
      return String(meta.name ?? meta.email ?? '');
  }
  return '';
}

export default function AuditLog() {
  const [logs, setLogs] = useState<StaffAuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        setLogs(await auditApi.list(50));
      } catch {
        setLogs([]);
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <StaffLayout>
      <PageHeader
        title="Activity Log"
        subtitle="Who changed payments, expenses, and tenants"
      />

      {loading ? (
        <p className="text-ink-soft">Loading…</p>
      ) : logs.length === 0 ? (
        <EmptyState message="No staff activity recorded yet." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-ink-soft">
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">Staff</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((entry) => (
                  <tr key={entry.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(entry.created_at)}</td>
                    <td className="px-4 py-3">{entry.staff_email || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {actionLabels[entry.action]} {entityLabels[entry.entity_type]}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{describeEntry(entry)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </StaffLayout>
  );
}
