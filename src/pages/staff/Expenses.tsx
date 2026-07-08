import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { expensesApi, exportApi } from '../../lib/api';
import { currentMonth, formatCurrency, formatDate } from '../../lib/utils';
import { StaffLayout } from '../../components/Layout';
import { Modal, ConfirmDialog } from '../../components/Modal';
import { PageHeader, EmptyState } from '../../components/ui';
import { ExportMenu } from '../../components/ExportMenu';
import { Banner } from '../../components/Banner';
import { EXPENSE_CATEGORIES } from '../../types/database';
import type { Expense, ExpenseCategory } from '../../types/database';

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [exportMsg, setExportMsg] = useState('');

  const [form, setForm] = useState({
    category: 'Other' as ExpenseCategory,
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    note: '',
  });

  const month = currentMonth();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const data = await expensesApi.list();
      setExpenses(data);
    } catch {
      // keep empty state
    }
    setLoading(false);
  }

  const monthTotal = expenses
    .filter((e) => e.date.startsWith(month))
    .reduce((s, e) => s + Number(e.amount), 0);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await expensesApi.create({
        category: form.category,
        amount: parseFloat(form.amount),
        date: form.date,
        note: form.note.trim() || null,
      });
      setAddOpen(false);
      setForm({ category: 'Other', amount: '', date: new Date().toISOString().slice(0, 10), note: '' });
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add expense');
    }
    setSubmitting(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setSubmitting(true);
    try {
      await expensesApi.delete(deleteId);
      setDeleteId(null);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete expense');
    }
    setSubmitting(false);
  }

  if (loading) {
    return <StaffLayout><p className="text-ink-soft">Loading…</p></StaffLayout>;
  }

  return (
    <StaffLayout>
      <PageHeader
        title="Expenses"
        subtitle={`This month: ${formatCurrency(monthTotal)}`}
        action={
          <div className="flex gap-2">
            <ExportMenu
              onExport={(format) => exportApi.expenses(format)}
              onSuccess={(format) => setExportMsg(`Exported expenses as ${format.toUpperCase()}.`)}
              onError={(err) => setError(err.message)}
            />
            <button className="btn-primary" onClick={() => setAddOpen(true)}>
              <Plus size={18} /> Add Expense
            </button>
          </div>
        }
      />

      {exportMsg && <Banner message={exportMsg} variant="info" onDismiss={() => setExportMsg('')} />}
      {error && !addOpen && <Banner message={error} variant="error" onDismiss={() => setError('')} />}

      {expenses.length === 0 ? (
        <EmptyState message="No expenses logged yet. Click + Add Expense to record one." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-cream/50">
                  <th className="text-left px-5 py-3 font-medium text-ink-soft">Date</th>
                  <th className="text-left px-5 py-3 font-medium text-ink-soft">Category</th>
                  <th className="text-left px-5 py-3 font-medium text-ink-soft">Amount</th>
                  <th className="text-left px-5 py-3 font-medium text-ink-soft">Note</th>
                  <th className="text-right px-5 py-3 font-medium text-ink-soft"></th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3 text-ink-soft">{formatDate(e.date)}</td>
                    <td className="px-5 py-3">{e.category}</td>
                    <td className="px-5 py-3 font-mono font-medium">{formatCurrency(Number(e.amount))}</td>
                    <td className="px-5 py-3 text-ink-soft">{e.note ?? '—'}</td>
                    <td className="px-5 py-3 text-right">
                      <button className="btn-ghost text-rose p-1" onClick={() => setDeleteId(e.id)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Expense">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })}>
              {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Amount (₹)</label>
            <input className="input font-mono" type="number" min="1" required value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" required value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className="label">Note (optional)</label>
            <textarea className="input resize-none" rows={2} value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </div>
          {error && <p className="text-rose text-sm">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? 'Saving…' : 'Add Expense'}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Expense"
        message="This expense will be removed from totals but kept in the activity log for your records."
        confirmLabel="Delete"
        loading={submitting}
      />
    </StaffLayout>
  );
}
