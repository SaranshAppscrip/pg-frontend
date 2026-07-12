import { useEffect, useState } from 'react';
import { Plus, Trash2, Pin, LogOut } from 'lucide-react';
import {
  announcementsApi,
  maintenanceApi,
  visitorLogApi,
  tenantsApi,
  staffApi,
} from '../../lib/api';
import { useProperty } from '../../contexts/PropertyContext';
import { StaffLayout } from '../../components/Layout';
import { PropertyFilterBanner } from '../../components/PropertyFilterBanner';
import { Modal, ConfirmDialog } from '../../components/Modal';
import { PageHeader } from '../../components/ui';
import { Banner } from '../../components/Banner';
import { MaintenancePriorityBadge } from '../../components/MaintenancePriorityBadge';
import { MaintenanceStatusBadge } from '../../components/MaintenanceStatusBadge';
import { formatDate, formatDateTime } from '../../lib/utils';
import {
  ANNOUNCEMENT_CATEGORIES,
  MAINTENANCE_STATUSES,
  MAINTENANCE_PRIORITIES,
  type Announcement,
  type AnnouncementCategory,
  type MaintenanceRequest,
  type MaintenanceStatus,
  type MaintenancePriority,
  type VisitorLogEntry,
  type Tenant,
  type StaffProfile,
} from '../../types/database';

type Tab = 'notices' | 'maintenance' | 'visitors';

export default function Operations() {
  const { properties, selectedPropertyId } = useProperty();
  const [tab, setTab] = useState<Tab>('notices');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([]);
  const [visitors, setVisitors] = useState<VisitorLogEntry[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | ''>('');

  const [noticeOpen, setNoticeOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Announcement | null>(null);
  const [deleteNotice, setDeleteNotice] = useState<Announcement | null>(null);
  const [maintOpen, setMaintOpen] = useState<MaintenanceRequest | null>(null);
  const [visitorOpen, setVisitorOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [noticeForm, setNoticeForm] = useState({
    title: '', body: '', category: 'general' as AnnouncementCategory,
    property_id: '', pinned: false, published: true, expires_at: '',
  });
  const [maintForm, setMaintForm] = useState({
    status: 'open' as MaintenanceStatus,
    priority: 'medium' as MaintenancePriority,
    assigned_to: '',
    staff_note: '',
  });
  const [visitorForm, setVisitorForm] = useState({
    property_id: '', tenant_id: '', visitor_name: '', visitor_phone: '',
    purpose: '', id_type: 'Aadhaar', id_number: '', notes: '',
  });

  useEffect(() => { loadData(); }, [selectedPropertyId, tab, statusFilter]);

  async function loadData() {
    setLoading(true);
    try {
      if (tab === 'notices') {
        setAnnouncements(await announcementsApi.list(selectedPropertyId));
      } else if (tab === 'maintenance') {
        const [items, tenantList, staffList] = await Promise.all([
          maintenanceApi.list(selectedPropertyId, statusFilter || undefined),
          tenantsApi.list(selectedPropertyId),
          staffApi.list(),
        ]);
        setMaintenance(items);
        setTenants(tenantList);
        setStaffMembers(staffList);
      } else {
        setVisitors(await visitorLogApi.list(selectedPropertyId));
        const t = await tenantsApi.list(selectedPropertyId);
        setTenants(t.filter((x) => x.active));
      }
    } catch {
      // keep empty
    }
    setLoading(false);
  }

  function openCreateNotice() {
    setEditingNotice(null);
    setNoticeForm({
      title: '', body: '', category: 'general',
      property_id: selectedPropertyId ?? '', pinned: false, published: true, expires_at: '',
    });
    setNoticeOpen(true);
  }

  function openEditNotice(a: Announcement) {
    setEditingNotice(a);
    setNoticeForm({
      title: a.title, body: a.body, category: a.category,
      property_id: a.property_id ?? '', pinned: a.pinned, published: a.published,
      expires_at: a.expires_at ? a.expires_at.slice(0, 10) : '',
    });
    setNoticeOpen(true);
  }

  async function handleSaveNotice(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const payload = {
      title: noticeForm.title.trim(),
      body: noticeForm.body.trim(),
      category: noticeForm.category,
      property_id: noticeForm.property_id || null,
      pinned: noticeForm.pinned,
      published: noticeForm.published,
      expires_at: noticeForm.expires_at ? `${noticeForm.expires_at}T23:59:59Z` : null,
    };
    try {
      if (editingNotice) {
        await announcementsApi.update(editingNotice.id, payload);
        setSuccess('Announcement updated.');
      } else {
        await announcementsApi.create(payload);
        setSuccess('Announcement posted.');
      }
      setNoticeOpen(false);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
    setSubmitting(false);
  }

  async function handleDeleteNotice() {
    if (!deleteNotice) return;
    setSubmitting(true);
    try {
      await announcementsApi.delete(deleteNotice.id);
      setDeleteNotice(null);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
    setSubmitting(false);
  }

  async function handleUpdateMaintenance(e: React.FormEvent) {
    e.preventDefault();
    if (!maintOpen) return;
    setSubmitting(true);
    try {
      await maintenanceApi.update(maintOpen.id, {
        status: maintForm.status,
        priority: maintForm.priority,
        assigned_to: maintForm.assigned_to || null,
        staff_note: maintForm.staff_note.trim() || undefined,
      });
      setMaintOpen(null);
      setSuccess('Request updated.');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    }
    setSubmitting(false);
  }

  async function handleLogVisitor(e: React.FormEvent) {
    e.preventDefault();
    const propertyId = visitorForm.property_id || selectedPropertyId;
    if (!propertyId) {
      setError('Select a property');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await visitorLogApi.create({
        property_id: propertyId,
        tenant_id: visitorForm.tenant_id || undefined,
        visitor_name: visitorForm.visitor_name.trim(),
        visitor_phone: visitorForm.visitor_phone.trim() || undefined,
        purpose: visitorForm.purpose.trim() || undefined,
        id_type: visitorForm.id_type.trim() || undefined,
        id_number: visitorForm.id_number.trim() || undefined,
        notes: visitorForm.notes.trim() || undefined,
      });
      setVisitorOpen(false);
      setVisitorForm({
        property_id: selectedPropertyId ?? '', tenant_id: '', visitor_name: '', visitor_phone: '',
        purpose: '', id_type: 'Aadhaar', id_number: '', notes: '',
      });
      setSuccess('Visitor entry logged.');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log visitor');
    }
    setSubmitting(false);
  }

  async function handleVisitorExit(id: string) {
    try {
      await visitorLogApi.recordExit(id);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record exit');
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'notices', label: 'Notice Board' },
    { id: 'maintenance', label: 'Maintenance' },
    { id: 'visitors', label: 'Visitor Log' },
  ];

  return (
    <StaffLayout>
      <PageHeader title="Operations" subtitle="Notices, maintenance requests, and visitor log" />

      <PropertyFilterBanner />
      {success && <Banner message={success} variant="success" onDismiss={() => setSuccess('')} />}
      {error && <Banner message={error} variant="error" onDismiss={() => setError('')} />}

      <div className="flex gap-1 mb-6 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id ? 'border-rose text-rose' : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'notices' && (
        <>
          <div className="mb-4">
            <button className="btn-primary" onClick={openCreateNotice}>
              <Plus size={18} /> Post Announcement
            </button>
          </div>
          {loading ? <p className="text-ink-soft">Loading…</p> : announcements.length === 0 ? (
            <p className="text-ink-soft text-sm">No announcements yet.</p>
          ) : (
            <div className="space-y-3">
              {announcements.map((a) => (
                <div key={a.id} className="card p-4">
                  <div className="flex justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {a.pinned && <Pin size={14} className="text-rose" />}
                        <h3 className="font-medium">{a.title}</h3>
                        {!a.published && (
                          <span className="text-xs bg-cream px-2 py-0.5 rounded">Draft</span>
                        )}
                      </div>
                      <p className="text-sm text-ink-soft whitespace-pre-wrap">{a.body}</p>
                      <p className="text-xs text-ink-soft mt-2">
                        {ANNOUNCEMENT_CATEGORIES.find((c) => c.value === a.category)?.label}
                        {' · '}{formatDate(a.created_at)}
                        {a.expires_at && ` · Expires ${formatDate(a.expires_at)}`}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button className="btn-ghost text-sm" onClick={() => openEditNotice(a)}>Edit</button>
                      <button className="btn-ghost text-rose p-1" onClick={() => setDeleteNotice(a)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'maintenance' && (
        <>
          <div className="mb-4">
            <select
              className="input w-auto"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as MaintenanceStatus | '')}
            >
              <option value="">All statuses</option>
              {MAINTENANCE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          {loading ? <p className="text-ink-soft">Loading…</p> : maintenance.length === 0 ? (
            <p className="text-ink-soft text-sm">No maintenance requests.</p>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-cream/50">
                    <th className="text-left px-4 py-3 font-medium text-ink-soft">Tenant</th>
                    <th className="text-left px-4 py-3 font-medium text-ink-soft">Issue</th>
                    <th className="text-left px-4 py-3 font-medium text-ink-soft">Priority</th>
                    <th className="text-left px-4 py-3 font-medium text-ink-soft">Assignee</th>
                    <th className="text-left px-4 py-3 font-medium text-ink-soft">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-ink-soft">Date</th>
                    <th className="text-right px-4 py-3 font-medium text-ink-soft"></th>
                  </tr>
                </thead>
                <tbody>
                  {maintenance.map((m) => (
                    <tr key={m.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium">{m.tenant_name}</p>
                        <p className="text-xs text-ink-soft">Room {m.room_number ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{m.title}</p>
                        <p className="text-xs text-ink-soft line-clamp-2">{m.description}</p>
                      </td>
                      <td className="px-4 py-3"><MaintenancePriorityBadge priority={m.priority} /></td>
                      <td className="px-4 py-3 text-xs text-ink-soft">{m.assigned_to_name ?? '—'}</td>
                      <td className="px-4 py-3"><MaintenanceStatusBadge status={m.status} /></td>
                      <td className="px-4 py-3 text-ink-soft text-xs">{formatDate(m.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          className="btn-ghost text-sm"
                          onClick={() => {
                            setMaintOpen(m);
                            setMaintForm({
                              status: m.status,
                              priority: m.priority,
                              assigned_to: m.assigned_to ?? '',
                              staff_note: m.staff_note ?? '',
                            });
                          }}
                        >
                          Update
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'visitors' && (
        <>
          <div className="mb-4">
            <button
              className="btn-primary"
              onClick={() => {
                setVisitorForm((f) => ({ ...f, property_id: selectedPropertyId ?? '' }));
                setVisitorOpen(true);
              }}
            >
              <Plus size={18} /> Log Visitor Entry
            </button>
          </div>
          {loading ? <p className="text-ink-soft">Loading…</p> : visitors.length === 0 ? (
            <p className="text-ink-soft text-sm">No visitor entries yet.</p>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-cream/50">
                    <th className="text-left px-4 py-3 font-medium text-ink-soft">Visitor</th>
                    <th className="text-left px-4 py-3 font-medium text-ink-soft">Visiting</th>
                    <th className="text-left px-4 py-3 font-medium text-ink-soft">Entry</th>
                    <th className="text-left px-4 py-3 font-medium text-ink-soft">Exit</th>
                    <th className="text-right px-4 py-3 font-medium text-ink-soft"></th>
                  </tr>
                </thead>
                <tbody>
                  {visitors.map((v) => (
                    <tr key={v.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium">{v.visitor_name}</p>
                        <p className="text-xs text-ink-soft">{v.visitor_phone ?? '—'}</p>
                        {v.id_type && (
                          <p className="text-xs text-ink-soft">{v.id_type}: {v.id_number}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink-soft text-xs">
                        {v.tenant_name ? (
                          <>{v.tenant_name} · Room {v.room_number ?? '—'}</>
                        ) : (
                          v.purpose ?? '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">{formatDateTime(v.entry_at)}</td>
                      <td className="px-4 py-3 text-xs">
                        {v.exit_at ? formatDateTime(v.exit_at) : (
                          <span className="text-clay font-medium">Inside</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!v.exit_at && (
                          <button className="btn-secondary text-xs" onClick={() => handleVisitorExit(v.id)}>
                            <LogOut size={14} /> Exit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <Modal open={noticeOpen} onClose={() => setNoticeOpen(false)} title={editingNotice ? 'Edit Announcement' : 'Post Announcement'} wide>
        <form onSubmit={handleSaveNotice} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input className="input" required value={noticeForm.title}
              onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Message</label>
            <textarea className="input resize-none" rows={4} required value={noticeForm.body}
              onChange={(e) => setNoticeForm({ ...noticeForm, body: e.target.value })} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select className="input" value={noticeForm.category}
                onChange={(e) => setNoticeForm({ ...noticeForm, category: e.target.value as AnnouncementCategory })}>
                {ANNOUNCEMENT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Property (optional)</label>
              <select className="input" value={noticeForm.property_id}
                onChange={(e) => setNoticeForm({ ...noticeForm, property_id: e.target.value })}>
                <option value="">All properties</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Expires (optional)</label>
              <input className="input" type="date" value={noticeForm.expires_at}
                onChange={(e) => setNoticeForm({ ...noticeForm, expires_at: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={noticeForm.pinned}
                onChange={(e) => setNoticeForm({ ...noticeForm, pinned: e.target.checked })} />
              Pin to top
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={noticeForm.published}
                onChange={(e) => setNoticeForm({ ...noticeForm, published: e.target.checked })} />
              Published (visible to tenants)
            </label>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? 'Saving…' : editingNotice ? 'Save Changes' : 'Post Announcement'}
          </button>
        </form>
      </Modal>

      <Modal open={!!maintOpen} onClose={() => setMaintOpen(null)} title="Update Maintenance Request">
        {maintOpen && (
          <form onSubmit={handleUpdateMaintenance} className="space-y-4">
            <p className="text-sm text-ink-soft">{maintOpen.title} — {maintOpen.tenant_name}</p>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={maintForm.priority}
                onChange={(e) => setMaintForm({ ...maintForm, priority: e.target.value as MaintenancePriority })}>
                {MAINTENANCE_PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Assigned to</label>
              <select className="input" value={maintForm.assigned_to}
                onChange={(e) => setMaintForm({ ...maintForm, assigned_to: e.target.value })}>
                <option value="">Unassigned</option>
                {staffMembers.map((s) => (
                  <option key={s.id} value={s.id}>{s.full_name ?? s.email}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={maintForm.status}
                onChange={(e) => setMaintForm({ ...maintForm, status: e.target.value as MaintenanceStatus })}>
                {MAINTENANCE_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Staff note (visible to tenant)</label>
              <textarea className="input resize-none" rows={3} value={maintForm.staff_note}
                onChange={(e) => setMaintForm({ ...maintForm, staff_note: e.target.value })} />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? 'Saving…' : 'Update Request'}
            </button>
          </form>
        )}
      </Modal>

      <Modal open={visitorOpen} onClose={() => setVisitorOpen(false)} title="Log Visitor Entry" wide>
        <form onSubmit={handleLogVisitor} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Property</label>
              <select className="input" required value={visitorForm.property_id}
                onChange={(e) => setVisitorForm({ ...visitorForm, property_id: e.target.value })}>
                <option value="">Select…</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Visiting tenant (optional)</label>
              <select className="input" value={visitorForm.tenant_id}
                onChange={(e) => setVisitorForm({ ...visitorForm, tenant_id: e.target.value })}>
                <option value="">—</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Visitor name</label>
              <input className="input" required value={visitorForm.visitor_name}
                onChange={(e) => setVisitorForm({ ...visitorForm, visitor_name: e.target.value })} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={visitorForm.visitor_phone}
                onChange={(e) => setVisitorForm({ ...visitorForm, visitor_phone: e.target.value })} />
            </div>
            <div>
              <label className="label">ID type</label>
              <input className="input" value={visitorForm.id_type}
                onChange={(e) => setVisitorForm({ ...visitorForm, id_type: e.target.value })} />
            </div>
            <div>
              <label className="label">ID number</label>
              <input className="input" value={visitorForm.id_number}
                onChange={(e) => setVisitorForm({ ...visitorForm, id_number: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Purpose</label>
              <input className="input" value={visitorForm.purpose}
                onChange={(e) => setVisitorForm({ ...visitorForm, purpose: e.target.value })} />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? 'Saving…' : 'Log Entry'}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteNotice}
        onClose={() => setDeleteNotice(null)}
        onConfirm={handleDeleteNotice}
        title="Delete Announcement"
        message={`Delete "${deleteNotice?.title}"?`}
        confirmLabel="Delete"
        loading={submitting}
      />
    </StaffLayout>
  );
}
