import { useEffect, useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { kitchenApi } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { StaffLayout } from '../../components/Layout';
import { Modal } from '../../components/Modal';
import { StockStatusBadge } from '../../components/StatusBadge';
import { PageHeader, EmptyState } from '../../components/ui';
import { KITCHEN_UNITS } from '../../types/database';
import type { KitchenItem, KitchenLogEntry, KitchenUnit, KitchenLogType } from '../../types/database';

interface LogRow extends KitchenLogEntry {
  item?: KitchenItem;
}

export default function KitchenStock() {
  const [items, setItems] = useState<KitchenItem[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [addItemOpen, setAddItemOpen] = useState(false);
  const [stockAction, setStockAction] = useState<{ item: KitchenItem; type: KitchenLogType } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [itemForm, setItemForm] = useState({
    name: '', qty: '', unit: 'kg' as KitchenUnit, reorder_threshold: '',
  });
  const [stockForm, setStockForm] = useState({
    qty: '', date: new Date().toISOString().slice(0, 10), note: '',
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [itemsData, logsData] = await Promise.all([
        kitchenApi.listItems(),
        kitchenApi.listLog(20),
      ]);
      setItems(itemsData);
      setLogs(logsData.map((l) => ({
        ...l,
        item: itemsData.find((i) => i.id === l.item_id),
      })));
    } catch {
      // keep empty state
    }
    setLoading(false);
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await kitchenApi.createItem({
        name: itemForm.name.trim(),
        qty: parseFloat(itemForm.qty),
        unit: itemForm.unit,
        reorder_threshold: parseFloat(itemForm.reorder_threshold),
      });
      setAddItemOpen(false);
      setItemForm({ name: '', qty: '', unit: 'kg', reorder_threshold: '' });
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item');
    }
    setSubmitting(false);
  }

  async function handleStockAction(e: React.FormEvent) {
    e.preventDefault();
    if (!stockAction) return;
    const qty = parseFloat(stockForm.qty);
    const currentQty = Number(stockAction.item.qty);

    if (stockAction.type === 'out' && qty > currentQty) {
      setError(`Cannot use more than current stock (${currentQty} ${stockAction.item.unit})`);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        qty,
        date: stockForm.date,
        note: stockForm.note.trim() || null,
      };
      if (stockAction.type === 'in') {
        await kitchenApi.stockIn(stockAction.item.id, payload);
      } else {
        await kitchenApi.useStock(stockAction.item.id, payload);
      }
      setStockAction(null);
      setStockForm({ qty: '', date: new Date().toISOString().slice(0, 10), note: '' });
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update stock');
    }
    setSubmitting(false);
  }

  if (loading) {
    return <StaffLayout><p className="text-ink-soft">Loading…</p></StaffLayout>;
  }

  return (
    <StaffLayout>
      <PageHeader
        title="Kitchen Stock"
        action={
          <button className="btn-primary" onClick={() => setAddItemOpen(true)}>
            <Plus size={18} /> Add Item
          </button>
        }
      />

      {items.length === 0 ? (
        <EmptyState message="No kitchen items yet. Click + Add Item to start tracking inventory." />
      ) : (
        <div className="card overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-cream/50">
                  <th className="text-left px-5 py-3 font-medium text-ink-soft">Item</th>
                  <th className="text-left px-5 py-3 font-medium text-ink-soft">Current Qty</th>
                  <th className="text-left px-5 py-3 font-medium text-ink-soft">Threshold</th>
                  <th className="text-left px-5 py-3 font-medium text-ink-soft">Status</th>
                  <th className="text-right px-5 py-3 font-medium text-ink-soft">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const low = Number(item.qty) <= Number(item.reorder_threshold);
                  return (
                    <tr key={item.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 font-medium">{item.name}</td>
                      <td className="px-5 py-3 font-mono">{item.qty} {item.unit}</td>
                      <td className="px-5 py-3 font-mono text-ink-soft">
                        {item.reorder_threshold} {item.unit}
                      </td>
                      <td className="px-5 py-3"><StockStatusBadge low={low} /></td>
                      <td className="px-5 py-3 text-right space-x-2">
                        <button
                          className="btn-ghost text-xs text-sage"
                          onClick={() => setStockAction({ item, type: 'in' })}
                        >
                          <Plus size={14} /> Stock In
                        </button>
                        <button
                          className="btn-ghost text-xs text-clay"
                          onClick={() => setStockAction({ item, type: 'out' })}
                        >
                          <Minus size={14} /> Use
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {logs.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="font-serif text-lg font-semibold">Recent Stock Movements</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-cream/50">
                  <th className="text-left px-5 py-3 font-medium text-ink-soft">Date</th>
                  <th className="text-left px-5 py-3 font-medium text-ink-soft">Item</th>
                  <th className="text-left px-5 py-3 font-medium text-ink-soft">Type</th>
                  <th className="text-left px-5 py-3 font-medium text-ink-soft">Qty</th>
                  <th className="text-left px-5 py-3 font-medium text-ink-soft">Note</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3 text-ink-soft">{formatDate(log.date)}</td>
                    <td className="px-5 py-3">{log.item?.name ?? '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium ${log.type === 'in' ? 'text-sage' : 'text-clay'}`}>
                        {log.type === 'in' ? 'Stock In' : 'Used'}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono">
                      {log.qty} {log.item?.unit}
                    </td>
                    <td className="px-5 py-3 text-ink-soft">{log.note ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={addItemOpen} onClose={() => setAddItemOpen(false)} title="Add Kitchen Item">
        <form onSubmit={handleAddItem} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input" required value={itemForm.name}
              onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Starting quantity</label>
            <input className="input font-mono" type="number" min="0" step="0.01" required value={itemForm.qty}
              onChange={(e) => setItemForm({ ...itemForm, qty: e.target.value })} />
          </div>
          <div>
            <label className="label">Unit</label>
            <select className="input" value={itemForm.unit}
              onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value as KitchenUnit })}>
              {KITCHEN_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Reorder threshold</label>
            <input className="input font-mono" type="number" min="0" step="0.01" required
              value={itemForm.reorder_threshold}
              onChange={(e) => setItemForm({ ...itemForm, reorder_threshold: e.target.value })} />
          </div>
          {error && <p className="text-rose text-sm">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? 'Adding…' : 'Add Item'}
          </button>
        </form>
      </Modal>

      <Modal
        open={!!stockAction}
        onClose={() => { setStockAction(null); setError(''); }}
        title={stockAction?.type === 'in' ? 'Stock In' : 'Use Stock'}
      >
        {stockAction && (
          <form onSubmit={handleStockAction} className="space-y-4">
            <p className="text-sm text-ink-soft">
              {stockAction.item.name} — current: {stockAction.item.qty} {stockAction.item.unit}
            </p>
            <div>
              <label className="label">Quantity</label>
              <input className="input font-mono" type="number" min="0.01" step="0.01" required
                value={stockForm.qty}
                onChange={(e) => setStockForm({ ...stockForm, qty: e.target.value })} />
            </div>
            <div>
              <label className="label">Date</label>
              <input className="input" type="date" required value={stockForm.date}
                onChange={(e) => setStockForm({ ...stockForm, date: e.target.value })} />
            </div>
            <div>
              <label className="label">Note (optional)</label>
              <input className="input" value={stockForm.note}
                onChange={(e) => setStockForm({ ...stockForm, note: e.target.value })} />
            </div>
            {error && <p className="text-rose text-sm">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? 'Saving…' : 'Confirm'}
            </button>
          </form>
        )}
      </Modal>
    </StaffLayout>
  );
}
