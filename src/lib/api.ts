const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export const STAFF_TOKEN_KEY = 'nivas_staff_token';
export const TENANT_TOKEN_KEY = 'nivas_tenant_token';
export const ORG_ID_KEY = 'nivas_organization_id';

export const isApiConfigured = true;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

type AuthMode = 'staff' | 'tenant' | 'none';

async function request<T>(
  path: string,
  options: RequestInit & { auth?: AuthMode } = {}
): Promise<T> {
  const { auth = 'staff', ...init } = options;
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

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.error?.message ?? body.message ?? message;
    } catch {
      // ignore parse errors
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
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
  staffLogin: (organizationId: string, email: string, password: string) =>
    request<{ token: string; user: StaffUser }>('/auth/staff/login', {
      method: 'POST',
      auth: 'none',
      body: JSON.stringify({ organization_id: organizationId, email, password }),
    }),

  staffMe: () => request<StaffUser>('/auth/staff/me'),

  staffLogout: () =>
    request<void>('/auth/staff/logout', { method: 'POST' }).catch(() => undefined),

  tenantLogin: (organizationId: string, email: string, password: string) =>
    request<{ token: string; user: TenantUser }>('/auth/tenant/login', {
      method: 'POST',
      auth: 'none',
      body: JSON.stringify({ organization_id: organizationId, email, password }),
    }),

  tenantMe: () =>
    request<TenantUser>('/auth/tenant/me', { auth: 'tenant' }),
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
} from '../types/database';

export const roomsApi = {
  list: () => request<Room[]>('/rooms'),
  create: (data: { room_number: string; capacity: number }) =>
    request<Room>('/rooms', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/rooms/${id}`, { method: 'DELETE' }),
};

export const tenantsApi = {
  list: () => request<Tenant[]>('/tenants'),
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
  list: () => request<Payment[]>('/payments'),
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
