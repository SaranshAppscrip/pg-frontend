import { useEffect, useState } from 'react';
import { Download, Trash2, Upload } from 'lucide-react';
import { documentsApi } from '../lib/api';
import { Modal, ConfirmDialog } from './Modal';
import {
  TENANT_DOCUMENT_TYPES,
  documentTypeLabel,
  formatFileSize,
  type Tenant,
  type TenantDocument,
  type TenantDocumentType,
} from '../types/database';
import { formatDate } from '../lib/utils';

interface TenantDocumentsModalProps {
  tenant: Tenant | null;
  onClose: () => void;
}

export function TenantDocumentsModal({ tenant, onClose }: TenantDocumentsModalProps) {
  const [docs, setDocs] = useState<TenantDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [deleteDoc, setDeleteDoc] = useState<TenantDocument | null>(null);
  const [form, setForm] = useState({
    document_type: 'id_proof' as TenantDocumentType,
    title: '',
    expires_at: '',
    file: null as File | null,
  });

  useEffect(() => {
    if (tenant) loadDocs();
  }, [tenant?.id]);

  async function loadDocs() {
    if (!tenant) return;
    setLoading(true);
    setError('');
    try {
      const data = await documentsApi.listTenant(tenant.id);
      setDocs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    }
    setLoading(false);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!tenant || !form.file) return;
    setUploading(true);
    setError('');
    try {
      await documentsApi.uploadTenant(tenant.id, form.file, {
        document_type: form.document_type,
        title: form.title.trim() || undefined,
        expires_at: form.expires_at || undefined,
      });
      setForm({ document_type: 'id_proof', title: '', expires_at: '', file: null });
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
      await documentsApi.deleteTenant(deleteDoc.id);
      setDeleteDoc(null);
      loadDocs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
    setUploading(false);
  }

  return (
    <>
      <Modal open={!!tenant} onClose={onClose} title={tenant ? `Documents — ${tenant.name}` : ''} wide>
        <div className="space-y-6">
          <form onSubmit={handleUpload} className="card p-4 space-y-3 bg-cream/30">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Upload size={16} /> Upload document
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Type</label>
                <select
                  className="input"
                  value={form.document_type}
                  onChange={(e) => setForm({ ...form, document_type: e.target.value as TenantDocumentType })}
                >
                  {TENANT_DOCUMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Title (optional)</label>
                <input
                  className="input"
                  placeholder="e.g. Aadhaar front"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <label className="label">File (PDF, JPEG, PNG — max 10 MB)</label>
                <input
                  className="input"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
                  required
                  onChange={(e) => setForm({ ...form, file: e.target.files?.[0] ?? null })}
                />
              </div>
              <div>
                <label className="label">Expires (optional)</label>
                <input
                  className="input"
                  type="date"
                  value={form.expires_at}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={uploading || !form.file}>
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
          </form>

          {error && <p className="text-rose text-sm">{error}</p>}

          {loading ? (
            <p className="text-ink-soft text-sm">Loading documents…</p>
          ) : docs.length === 0 ? (
            <p className="text-ink-soft text-sm">No documents uploaded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-cream/50">
                    <th className="text-left px-3 py-2 font-medium text-ink-soft">Type</th>
                    <th className="text-left px-3 py-2 font-medium text-ink-soft">File</th>
                    <th className="text-left px-3 py-2 font-medium text-ink-soft">Size</th>
                    <th className="text-left px-3 py-2 font-medium text-ink-soft">Uploaded</th>
                    <th className="text-right px-3 py-2 font-medium text-ink-soft"></th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((doc) => (
                    <tr key={doc.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-2">
                        <p className="font-medium">{documentTypeLabel(doc.document_type, TENANT_DOCUMENT_TYPES)}</p>
                        {doc.title && <p className="text-xs text-ink-soft">{doc.title}</p>}
                      </td>
                      <td className="px-3 py-2 text-ink-soft truncate max-w-[140px]">{doc.original_filename}</td>
                      <td className="px-3 py-2 font-mono text-xs">{formatFileSize(doc.size_bytes)}</td>
                      <td className="px-3 py-2 text-ink-soft text-xs">
                        {formatDate(doc.created_at)}
                        {doc.expires_at && (
                          <span className="block text-clay">Exp: {formatDate(doc.expires_at)}</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right space-x-1">
                        <button
                          type="button"
                          className="btn-ghost p-1"
                          title="Download"
                          onClick={() => documentsApi.downloadTenant(doc.id, doc.original_filename)}
                        >
                          <Download size={16} />
                        </button>
                        <button
                          type="button"
                          className="btn-ghost text-rose p-1"
                          title="Delete"
                          onClick={() => setDeleteDoc(doc)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteDoc}
        onClose={() => setDeleteDoc(null)}
        onConfirm={handleDelete}
        title="Delete Document"
        message={`Remove ${deleteDoc?.original_filename}? This cannot be undone.`}
        confirmLabel="Delete"
        loading={uploading}
      />
    </>
  );
}
