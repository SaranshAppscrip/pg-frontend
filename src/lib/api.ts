const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export const STAFF_TOKEN_KEY = 'nivas_staff_token';
export const STAFF_REFRESH_TOKEN_KEY = 'nivas_staff_refresh_token';
export const TENANT_TOKEN_KEY = 'nivas_tenant_token';
export const TENANT_REFRESH_TOKEN_KEY = 'nivas_tenant_refresh_token';
export const ORG_ID_KEY = 'nivas_organization_id';
export const PROPERTY_ID_KEY = 'nivas_property_id';

export const isApiConfigured = true;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: Array<Record<string, string>>
  ) {
    super(message);
  }
}

export type OrgChoice = { organization_id: string; name: string };

export function orgChoicesFromError(error: unknown): OrgChoice[] | null {
  if (!(error instanceof ApiError) || error.code !== 'MULTIPLE_ORGANIZATIONS' || !error.details) {
    return null;
  }
  const choices = error.details
    .filter((d) => d.organization_id && d.name)
    .map((d) => ({ organization_id: d.organization_id, name: d.name }));
  return choices.length > 0 ? choices : null;
}

type AuthMode = 'staff' | 'tenant' | 'none';

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token: string;
}

function getAccessTokenKey(auth: AuthMode): string | null {
  if (auth === 'staff') return STAFF_TOKEN_KEY;
  if (auth === 'tenant') return TENANT_TOKEN_KEY;
  return null;
}

function getRefreshTokenKey(auth: AuthMode): string | null {
  if (auth === 'staff') return STAFF_REFRESH_TOKEN_KEY;
  if (auth === 'tenant') return TENANT_REFRESH_TOKEN_KEY;
  return null;
}

function storeTokenPair(auth: AuthMode, pair: TokenPair) {
  const accessKey = getAccessTokenKey(auth);
  const refreshKey = getRefreshTokenKey(auth);
  if (!accessKey || !refreshKey) return;
  const access = pair.access_token || pair.token;
  localStorage.setItem(accessKey, access);
  localStorage.setItem(refreshKey, pair.refresh_token);
}

async function refreshAccessToken(auth: AuthMode): Promise<boolean> {
  const refreshKey = getRefreshTokenKey(auth);
  if (!refreshKey) return false;
  const refreshToken = localStorage.getItem(refreshKey);
  if (!refreshToken) return false;

  const path = auth === 'staff' ? '/auth/staff/refresh' : '/auth/tenant/refresh';
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!res.ok) return false;

  const pair = (await res.json()) as TokenPair;
  storeTokenPair(auth, pair);
  return true;
}

async function request<T>(
  path: string,
  options: RequestInit & { auth?: AuthMode; retried?: boolean } = {}
): Promise<T> {
  const { auth = 'staff', retried = false, ...init } = options;
  const headers = new Headers(init.headers);

  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (auth === 'staff') {
    const token = localStorage.getItem(STAFF_TOKEN_KEY);
    if (token) headers.set('Authorization', `Bearer ${token}`);
  } else if (auth === 'tenant') {
    const token = localStorage.getItem(TENANT_TOKEN_KEY);
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (res.status === 401 && auth !== 'none' && !retried) {
    const refreshed = await refreshAccessToken(auth);
    if (refreshed) {
      return request<T>(path, { ...options, retried: true });
    }
  }

  if (!res.ok) {
    let message = res.statusText;
    let code: string | undefined;
    let details: Array<Record<string, string>> | undefined;
    try {
      const body = await res.json();
      message = body.error?.message ?? body.message ?? message;
      code = body.error?.code;
      details = body.error?.details;
    } catch {
      // ignore parse errors
    }
    throw new ApiError(message, res.status, code, details);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function withPropertyQuery(path: string, propertyId?: string | null): string {
  if (!propertyId) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}property_id=${encodeURIComponent(propertyId)}`;
}

async function downloadBlob(
  path: string,
  filename: string,
  options: { auth?: AuthMode; retried?: boolean } = {}
): Promise<void> {
  const { auth = 'staff', retried = false } = options;
  const headers = new Headers();
  if (auth === 'staff') {
    const token = localStorage.getItem(STAFF_TOKEN_KEY);
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, { headers });

  if (res.status === 401 && auth !== 'none' && !retried) {
    const refreshed = await refreshAccessToken(auth);
    if (refreshed) {
      return downloadBlob(path, filename, { ...options, retried: true });
    }
  }

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.error?.message ?? body.message ?? message;
    } catch {
      // ignore
    }
    throw new ApiError(message, res.status);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ── Auth ────────────────────────────────────────────────────────────────────

export interface StaffUser {
  id: string;
  organization_id: string;
  email: string;
  is_owner: boolean;
}

export interface TenantUser {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  phone: string | null;
  monthly_fee: number;
  join_date: string;
  room_number: string | null;
}

export const authApi = {
  staffLogin: async (email: string, password: string, organizationId?: string) => {
    const res = await request<TokenPair & { user: StaffUser }>('/auth/staff/login', {
      method: 'POST',
      auth: 'none',
      body: JSON.stringify({
        email,
        password,
        ...(organizationId ? { organization_id: organizationId } : {}),
      }),
    });
    storeTokenPair('staff', res);
    return { token: res.access_token || res.token, refresh_token: res.refresh_token, user: res.user };
  },

  staffMe: () => request<StaffUser>('/auth/staff/me'),

  staffLogout: () => {
    const refreshToken = localStorage.getItem(STAFF_REFRESH_TOKEN_KEY);
    localStorage.removeItem(STAFF_TOKEN_KEY);
    localStorage.removeItem(STAFF_REFRESH_TOKEN_KEY);
    if (!refreshToken) return Promise.resolve(undefined);
    return request<void>('/auth/staff/logout', {
      method: 'POST',
      auth: 'none',
      body: JSON.stringify({ refresh_token: refreshToken }),
    }).catch(() => undefined);
  },

  tenantLogin: async (email: string, password: string, organizationId?: string) => {
    const res = await request<TokenPair & { user: TenantUser }>('/auth/tenant/login', {
      method: 'POST',
      auth: 'none',
      body: JSON.stringify({
        email,
        password,
        ...(organizationId ? { organization_id: organizationId } : {}),
      }),
    });
    storeTokenPair('tenant', res);
    return { token: res.access_token || res.token, refresh_token: res.refresh_token, user: res.user };
  },

  tenantMe: () =>
    request<TenantUser>('/auth/tenant/me', { auth: 'tenant' }),

  tenantLogout: () => {
    const refreshToken = localStorage.getItem(TENANT_REFRESH_TOKEN_KEY);
    localStorage.removeItem(TENANT_TOKEN_KEY);
    localStorage.removeItem(TENANT_REFRESH_TOKEN_KEY);
    if (!refreshToken) return Promise.resolve(undefined);
    return request<void>('/auth/tenant/logout', {
      method: 'POST',
      auth: 'none',
      body: JSON.stringify({ refresh_token: refreshToken }),
    }).catch(() => undefined);
  },

  staffForgotPassword: (email: string, organizationId?: string) =>
    request<{ message: string }>('/auth/staff/forgot-password', {
      method: 'POST',
      auth: 'none',
      body: JSON.stringify({
        email,
        ...(organizationId ? { organization_id: organizationId } : {}),
      }),
    }),

  staffResetPassword: (token: string, password: string) =>
    request<{ message: string }>('/auth/staff/reset-password', {
      method: 'POST',
      auth: 'none',
      body: JSON.stringify({ token, password }),
    }),

  tenantForgotPassword: (email: string, organizationId?: string) =>
    request<{ message: string }>('/auth/tenant/forgot-password', {
      method: 'POST',
      auth: 'none',
      body: JSON.stringify({
        email,
        ...(organizationId ? { organization_id: organizationId } : {}),
      }),
    }),

  tenantResetPassword: (token: string, password: string) =>
    request<{ message: string }>('/auth/tenant/reset-password', {
      method: 'POST',
      auth: 'none',
      body: JSON.stringify({ token, password }),
    }),
};

// ── Settings ────────────────────────────────────────────────────────────────

export const settingsApi = {
  get: () => request<{ pg_name: string }>('/settings'),
  update: (pg_name: string) =>
    request<{ pg_name: string }>('/settings', {
      method: 'PATCH',
      body: JSON.stringify({ pg_name }),
    }),
};

// ── Rooms ───────────────────────────────────────────────────────────────────

import type {
  Property,
  Room,
  Tenant,
  Payment,
  Expense,
  KitchenItem,
  KitchenLogEntry,
  StaffProfile,
  PaymentMode,
  ExpenseCategory,
  KitchenUnit,
  StaffAuditLogEntry,
  TenantDocument,
  OrganizationDocument,
  Announcement,
  MaintenanceRequest,
  VisitorLogEntry,
} from '../types/database';

export const propertiesApi = {
  list: () => request<Property[]>('/properties'),
  create: (data: { name: string; address?: string | null }) =>
    request<Property>('/properties', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: { name: string; address?: string | null }) =>
    request<Property>(`/properties/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

export const exportApi = {
  payments: (format: 'csv' | 'xlsx', propertyId?: string | null) =>
    downloadBlob(
      withPropertyQuery(`/payments/export?format=${format}`, propertyId),
      `payments.${format === 'xlsx' ? 'xlsx' : 'csv'}`
    ),
  tenants: (format: 'csv' | 'xlsx', propertyId?: string | null) =>
    downloadBlob(
      withPropertyQuery(`/tenants/export?format=${format}`, propertyId),
      `tenants.${format === 'xlsx' ? 'xlsx' : 'csv'}`
    ),
  expenses: (format: 'csv' | 'xlsx') =>
    downloadBlob(`/expenses/export?format=${format}`, `expenses.${format === 'xlsx' ? 'xlsx' : 'csv'}`),
};

export const roomsApi = {
  list: (propertyId?: string | null) =>
    request<Room[]>(withPropertyQuery('/rooms', propertyId)),
  create: (data: { property_id: string; room_number: string; capacity: number }) =>
    request<Room>('/rooms', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/rooms/${id}`, { method: 'DELETE' }),
};

export const tenantsApi = {
  list: (propertyId?: string | null) =>
    request<Tenant[]>(withPropertyQuery('/tenants', propertyId)),
  create: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    room_id: string;
    monthly_fee: number;
    join_date: string;
  }) => request<Tenant>('/tenants', { method: 'POST', body: JSON.stringify(data) }),
  moveOut: (id: string) =>
    request<Tenant>(`/tenants/${id}/move-out`, { method: 'POST' }),
};

export const paymentsApi = {
  list: (propertyId?: string | null) =>
    request<Payment[]>(withPropertyQuery('/payments', propertyId)),
  create: (data: {
    tenant_id: string;
    amount: number;
    date: string;
    for_month: string;
    mode: PaymentMode;
  }) => request<Payment>('/payments', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/payments/${id}`, { method: 'DELETE' }),
};

export const expensesApi = {
  list: () => request<Expense[]>('/expenses'),
  create: (data: {
    category: ExpenseCategory;
    amount: number;
    date: string;
    note?: string | null;
  }) => request<Expense>('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/expenses/${id}`, { method: 'DELETE' }),
};

export const kitchenApi = {
  listItems: () => request<KitchenItem[]>('/kitchen/items'),
  createItem: (data: {
    name: string;
    qty: number;
    unit: KitchenUnit;
    reorder_threshold: number;
  }) => request<KitchenItem>('/kitchen/items', { method: 'POST', body: JSON.stringify(data) }),
  stockIn: (id: string, data: { qty: number; date: string; note?: string | null }) =>
    request<KitchenItem>(`/kitchen/items/${id}/stock-in`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  useStock: (id: string, data: { qty: number; date: string; note?: string | null }) =>
    request<KitchenItem>(`/kitchen/items/${id}/use`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  listLog: (limit = 20) => request<KitchenLogEntry[]>(`/kitchen/log?limit=${limit}`),
};

export const staffApi = {
  list: () => request<StaffProfile[]>('/staff'),
  invite: (email: string, password: string) =>
    request<StaffProfile>('/staff/invite', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  remove: (id: string) => request<void>(`/staff/${id}`, { method: 'DELETE' }),
};

export const tenantApi = {
  payments: () => request<Payment[]>('/tenant/payments', { auth: 'tenant' }),
};

export const auditApi = {
  list: (limit = 50) => request<StaffAuditLogEntry[]>(`/audit-log?limit=${limit}`),
};

export const remindersApi = {
  run: (type: 'due' | 'overdue', force = false) =>
    request<{ sent: number; type: string; force: boolean }>(
      `/reminders/run?type=${type}${force ? '&force=true' : ''}`,
      { method: 'POST' }
    ),
};

async function uploadMultipart<T>(path: string, formData: FormData): Promise<T> {
  const token = localStorage.getItem(STAFF_TOKEN_KEY);
  const headers = new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let res = await fetch(`${API_URL}${path}`, { method: 'POST', headers, body: formData });
  if (res.status === 401) {
    const refreshed = await refreshAccessToken('staff');
    if (refreshed) {
      const retryHeaders = new Headers();
      const newToken = localStorage.getItem(STAFF_TOKEN_KEY);
      if (newToken) retryHeaders.set('Authorization', `Bearer ${newToken}`);
      res = await fetch(`${API_URL}${path}`, { method: 'POST', headers: retryHeaders, body: formData });
    }
  }
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.error?.message ?? body.message ?? message;
    } catch {
      // ignore
    }
    throw new ApiError(message, res.status);
  }
  return res.json() as Promise<T>;
}

export const documentsApi = {
  listTenant: (tenantId: string) => request<TenantDocument[]>(`/tenants/${tenantId}/documents`),
  uploadTenant: (tenantId: string, file: File, data: {
    document_type: string;
    title?: string;
    expires_at?: string;
  }) => {
    const form = new FormData();
    form.append('file', file);
    form.append('document_type', data.document_type);
    if (data.title) form.append('title', data.title);
    if (data.expires_at) form.append('expires_at', data.expires_at);
    return uploadMultipart<TenantDocument>(`/tenants/${tenantId}/documents`, form);
  },
  downloadTenant: (docId: string, filename: string) =>
    downloadBlob(`/tenant-documents/${docId}/download`, filename),
  deleteTenant: (docId: string) =>
    request<void>(`/tenant-documents/${docId}`, { method: 'DELETE' }),

  listOrganization: (propertyId?: string | null) =>
    request<OrganizationDocument[]>(withPropertyQuery('/organization-documents', propertyId)),
  uploadOrganization: (file: File, data: {
    document_type: string;
    property_id?: string;
    title?: string;
    expires_at?: string;
  }) => {
    const form = new FormData();
    form.append('file', file);
    form.append('document_type', data.document_type);
    if (data.property_id) form.append('property_id', data.property_id);
    if (data.title) form.append('title', data.title);
    if (data.expires_at) form.append('expires_at', data.expires_at);
    return uploadMultipart<OrganizationDocument>('/organization-documents', form);
  },
  downloadOrganization: (docId: string, filename: string) =>
    downloadBlob(`/organization-documents/${docId}/download`, filename),
  deleteOrganization: (docId: string) =>
    request<void>(`/organization-documents/${docId}`, { method: 'DELETE' }),
};

export const announcementsApi = {
  list: (propertyId?: string | null) =>
    request<Announcement[]>(withPropertyQuery('/announcements', propertyId)),
  create: (data: {
    title: string;
    body: string;
    category: string;
    property_id?: string | null;
    pinned?: boolean;
    published?: boolean;
    expires_at?: string | null;
  }) => request<Announcement>('/announcements', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: {
    title: string;
    body: string;
    category: string;
    property_id?: string | null;
    pinned?: boolean;
    published?: boolean;
    expires_at?: string | null;
  }) => request<Announcement>(`/announcements/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/announcements/${id}`, { method: 'DELETE' }),
};

export const maintenanceApi = {
  list: (propertyId?: string | null, status?: string) => {
    let path = withPropertyQuery('/maintenance-requests', propertyId);
    if (status) path += `${path.includes('?') ? '&' : '?'}status=${status}`;
    return request<MaintenanceRequest[]>(path);
  },
  update: (id: string, data: {
    status: string;
    priority?: string;
    assigned_to?: string | null;
    staff_note?: string;
  }) =>
    request<MaintenanceRequest>(`/maintenance-requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

export const visitorLogApi = {
  list: (propertyId?: string | null, limit = 50) => {
    const base = withPropertyQuery('/visitor-log', propertyId);
    const sep = base.includes('?') ? '&' : '?';
    return request<VisitorLogEntry[]>(`${base}${sep}limit=${limit}`);
  },
  create: (data: {
    property_id: string;
    tenant_id?: string;
    visitor_name: string;
    visitor_phone?: string;
    purpose?: string;
    id_type?: string;
    id_number?: string;
    entry_at?: string;
    notes?: string;
  }) => request<VisitorLogEntry>('/visitor-log', { method: 'POST', body: JSON.stringify(data) }),
  recordExit: (id: string) =>
    request<VisitorLogEntry>(`/visitor-log/${id}/exit`, { method: 'POST' }),
};

export const tenantPortalApi = {
  announcements: () => request<Announcement[]>('/tenant/announcements', { auth: 'tenant' }),
  maintenance: () => request<MaintenanceRequest[]>('/tenant/maintenance-requests', { auth: 'tenant' }),
  createMaintenance: (data: { category: string; title: string; description: string }) =>
    request<MaintenanceRequest>('/tenant/maintenance-requests', {
      method: 'POST',
      auth: 'tenant',
      body: JSON.stringify(data),
    }),
};
