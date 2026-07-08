import { useEffect, useState } from 'react';
import { roomsApi, tenantsApi, paymentsApi, expensesApi, kitchenApi } from '../../lib/api';
import { currentMonth, formatCurrency } from '../../lib/utils';
import { StaffLayout } from '../../components/Layout';
import { RoomMap } from '../../components/RoomMap';
import { StatCard, PageHeader } from '../../components/ui';
import { StockStatusBadge } from '../../components/StatusBadge';
import { PropertyFilterBanner } from '../../components/PropertyFilterBanner';
import { ExportMenu } from '../../components/ExportMenu';
import { Banner } from '../../components/Banner';
import { useProperty } from '../../contexts/PropertyContext';
import { exportApi } from '../../lib/api';
import type { Room, Tenant, Payment, Expense, KitchenItem } from '../../types/database';

export default function Dashboard() {
  const { selectedPropertyId, selectedProperty } = useProperty();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [kitchenItems, setKitchenItems] = useState<KitchenItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportMsg, setExportMsg] = useState('');
  const [exportErr, setExportErr] = useState('');

  const month = currentMonth();

  useEffect(() => {
    loadData();
  }, [selectedPropertyId]);

  async function loadData() {
    setLoading(true);
    try {
      const [roomsData, tenantsData, paymentsData, expensesData, kitchenData] = await Promise.all([
        roomsApi.list(selectedPropertyId),
        tenantsApi.list(selectedPropertyId),
        paymentsApi.list(selectedPropertyId),
        expensesApi.list(),
        kitchenApi.listItems(),
      ]);
      setRooms(roomsData);
      setTenants(tenantsData);
      setPayments(paymentsData);
      setExpenses(expensesData);
      setKitchenItems(kitchenData);
    } catch {
      // keep empty state on error
    }
    setLoading(false);
  }

  const activeTenants = tenants.filter((t) => t.active);
  const totalCapacity = rooms.reduce((s, r) => s + r.capacity, 0);
  const occupiedRooms = rooms.filter((r) =>
    activeTenants.some((t) => t.room_id === r.id)
  ).length;

  const monthPayments = payments.filter((p) => p.for_month === month);
  const collected = monthPayments.reduce((s, p) => s + Number(p.amount), 0);

  const pendingDues = activeTenants.reduce((sum, tenant) => {
    const paid = monthPayments
      .filter((p) => p.tenant_id === tenant.id)
      .reduce((s, p) => s + Number(p.amount), 0);
    return sum + Math.max(0, Number(tenant.monthly_fee) - paid);
  }, 0);

  const monthExpenses = expenses
    .filter((e) => e.date.startsWith(month))
    .reduce((s, e) => s + Number(e.amount), 0);

  const lowStock = kitchenItems.filter((i) => Number(i.qty) <= Number(i.reorder_threshold));

  if (loading) {
    return (
      <StaffLayout>
        <p className="text-ink-soft">Loading dashboard…</p>
      </StaffLayout>
    );
  }

  return (
    <StaffLayout>
      <PageHeader
        title="Dashboard"
        subtitle={
          selectedProperty
            ? `Overview for ${month} — ${selectedProperty.name}`
            : `Overview for ${month}`
        }
        action={
          <ExportMenu
            onExport={(format) => exportApi.payments(format, selectedPropertyId)}
            onSuccess={(format) => {
              setExportErr('');
              setExportMsg(`Payments exported as ${format.toUpperCase()}.`);
            }}
            onError={(err) => {
              setExportMsg('');
              setExportErr(err.message);
            }}
          />
        }
      />

      <PropertyFilterBanner />
      {exportMsg && <Banner message={exportMsg} variant="success" onDismiss={() => setExportMsg('')} />}
      {exportErr && <Banner message={exportErr} variant="error" onDismiss={() => setExportErr('')} />}

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        <StatCard
          label="Rooms occupied"
          value={`${occupiedRooms}/${rooms.length}`}
        />
        <StatCard
          label="Girls staying"
          value={`${activeTenants.length}/${totalCapacity}`}
        />
        <StatCard label="Collected" value={formatCurrency(collected)} sub="This month" />
        <StatCard label="Pending dues" value={formatCurrency(pendingDues)} sub="This month" />
        <StatCard label="Expenses" value={formatCurrency(monthExpenses)} sub="This month" />
        <StatCard label="Low stock" value={lowStock.length} sub="Kitchen items" />
      </div>

      <div className="mb-6">
        <RoomMap rooms={rooms} tenants={tenants} />
      </div>

      {lowStock.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="font-serif text-lg font-semibold">Kitchen — Running Low</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-cream/50">
                  <th className="text-left px-5 py-3 font-medium text-ink-soft">Item</th>
                  <th className="text-left px-5 py-3 font-medium text-ink-soft">Qty</th>
                  <th className="text-left px-5 py-3 font-medium text-ink-soft">Threshold</th>
                  <th className="text-left px-5 py-3 font-medium text-ink-soft">Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3">{item.name}</td>
                    <td className="px-5 py-3 font-mono">
                      {item.qty} {item.unit}
                    </td>
                    <td className="px-5 py-3 font-mono">
                      {item.reorder_threshold} {item.unit}
                    </td>
                    <td className="px-5 py-3">
                      <StockStatusBadge low />
                    </td>
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
