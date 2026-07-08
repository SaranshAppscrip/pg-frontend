import { useEffect, useState } from 'react';
import { Download, Trash2, Upload } from 'lucide-react';
import { documentsApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useProperty } from '../../contexts/PropertyContext';
import { StaffLayout } from '../../components/Layout';
import { PropertyFilterBanner } from '../../components/PropertyFilterBanner';
import { Modal, ConfirmDialog } from '../../components/Modal';
import { PageHeader } from '../../components/ui';
import { Banner } from '../../components/Banner';
import {
  ORGANIZATION_DOCUMENT_TYPES,
  documentTypeLabel,
  formatFileSize,
  type OrganizationDocument,
  type OrganizationDocumentType,
  type Property,
} from '../../types/database';
import { formatDate } from '../../lib/utils';

export default function ComplianceDocuments() {
  const { staffUser } = useAuth();
  const isOwner = staffUser?.is_owner ?? false;
  const { properties, selectedPropertyId } = useProperty();
  const [docs, setDocs] = useState<OrganizationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteDoc, setDeleteDoc] = useState<OrganizationDocument | null>(null);
  const [form, setForm] = useState({
    document_type: 'pg_registration' as OrganizationDocumentType,
    property_id: '',
    title: '',
    expires_at: '',
    file: null as File | null,
  });

  useEffect(() => {
    loadDocs();
  }, [selectedPropertyId]);

  async function loadDocs() {
    setLoading(true);
    try {
      const data = await documentsApi.listOrganization(selectedPropertyId);
      setDocs(data);
    } catch {
      setDocs([]);
    }
    setLoading(false);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!form.file) return;
    setUploading(true);
    setError('');
    setSuccess('');
    try {
      await documentsApi.uploadOrganization(form.file, {
        document_type: form.document_type,
        property_id: form.property_id || selectedPropertyId || undefined,
        title: form.title.trim() || undefined,
        expires_at: form.expires_at || undefined,
      });
      setAddOpen(false);
      setForm({
        document_type: 'pg_registration',
        property_id: selectedPropertyId ?? '',
        title: '',
        expires_at: '',
        file: null,
      });
      setSuccess('Document uploaded.');
      loadDocs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
    setUploading(false);
  }

  async function handleDelete() {
    if (!deleteDoc) return;
    setUploading(true);
    try {
      await documentsApi.deleteOrganization(deleteDoc.id);
      setDeleteDoc(null);
      loadDocs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
    setUploading(false);
  }

  function propertyName(id: string | null) {
    if (!id) return 'All properties';
    return properties.find((p: Property) => p.id === id)?.name ?? '—';
  }

  return (
    <StaffLayout>
      <PageHeader
        title="Compliance Documents"
        subtitle="PG registration, police permission, fire NOC, and other owner permits"
        action={
          isOwner ? (
            <button
              className="btn-primary"
              onClick={() => {
                setForm((f) => ({ ...f, property_id: selectedPropertyId ?? '' }));
                setAddOpen(true);
              }}
            >
              <Upload size={18} /> Upload Document
            </button>
          ) : undefined
        }
      />

      <PropertyFilterBanner />
      {success && <Banner message={success} variant="success" onDismiss={() => setSuccess('')} />}
      {error && !addOpen && <Banner message={error} variant="error" onDismiss={() => setError('')} />}

      {!isOwner && (
        <p className="text-ink-soft text-sm mb-4">
          You can view and download compliance documents. Only the owner can upload or delete.
        </p>
      )}

      {loading ? (
        <p className="text-ink-soft">Loading…</p>
      ) : docs.length === 0 ? (
        <div className="card p-8 text-center text-ink-soft text-sm">
          No compliance documents yet.
          {isOwner && ' Upload PG registration, police permission, or fire safety NOC.'}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-cream/50">
                  <th className="text-left px-5 py-3 font-medium text-ink-soft">Type</th>
                  <th className="text-left px-5 py-3 font-medium text-ink-soft">Property</th>
                  <th className="text-left px-5 py-3 font-medium text-ink-soft">File</th>
                  <th className="text-left px-5 py-3 font-medium text-ink-soft">Size</th>
                  <th className="text-left px-5 py-3 font-medium text-ink-soft">Uploaded</th>
                  <th className="text-right px-5 py-3 font-medium text-ink-soft"></th>
                </tr>
              </thead>
              <tbody>
                {docs.map((doc) => (
                  <tr key={doc.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3">
                      <p className="font-medium">
                        {documentTypeLabel(doc.document_type, ORGANIZATION_DOCUMENT_TYPES)}
                      </p>
                      {doc.title && <p className="text-xs text-ink-soft">{doc.title}</p>}
                    </td>
                    <td className="px-5 py-3 text-ink-soft">{propertyName(doc.property_id)}</td>
                    <td className="px-5 py-3 text-ink-soft truncate max-w-[160px]">{doc.original_filename}</td>
                    <td className="px-5 py-3 font-mono text-xs">{formatFileSize(doc.size_bytes)}</td>
                    <td className="px-5 py-3 text-ink-soft text-xs">
                      {formatDate(doc.created_at)}
                      {doc.expires_at && (
                        <span className="block text-clay">Exp: {formatDate(doc.expires_at)}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right space-x-1">
                      <button
                        type="button"
                        className="btn-ghost p-1"
                        onClick={() => documentsApi.downloadOrganization(doc.id, doc.original_filename)}
                      >
                        <Download size={16} />
                      </button>
                      {isOwner && (
                        <button
                          type="button"
                          className="btn-ghost text-rose p-1"
                          onClick={() => setDeleteDoc(doc)}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Upload Compliance Document" wide>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="label">Document type</label>
            <select
              className="input"
              value={form.document_type}
              onChange={(e) => setForm({ ...form, document_type: e.target.value as OrganizationDocumentType })}
            >
              {ORGANIZATION_DOCUMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Property (optional)</label>
            <select
              className="input"
              value={form.property_id}
              onChange={(e) => setForm({ ...form, property_id: e.target.value })}
            >
              <option value="">Organization-wide</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <p className="text-xs text-ink-soft mt-1">
              Leave blank for documents that apply to the whole PG business.
            </p>
          </div>
          <div>
            <label className="label">Title (optional)</label>
            <input
              className="input"
              placeholder="e.g. 2026 Police NOC"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className="label">File (PDF or image, max 10 MB)</label>
            <input
              className="input"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              required
              onChange={(e) => setForm({ ...form, file: e.target.files?.[0] ?? null })}
            />
          </div>
          <div>
            <label className="label">Valid until (optional)</label>
            <input
              className="input"
              type="date"
              value={form.expires_at}
              onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
            />
          </div>
          {error && <p className="text-rose text-sm">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={uploading || !form.file}>
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteDoc}
        onClose={() => setDeleteDoc(null)}
        onConfirm={handleDelete}
        title="Delete Document"
        message={`Remove ${deleteDoc?.original_filename}?`}
        confirmLabel="Delete"
        loading={uploading}
      />
    </StaffLayout>
  );
}
