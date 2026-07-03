export type PaymentMode = 'Cash' | 'UPI' | 'Bank Transfer' | 'Other';

export type ExpenseCategory =
  | 'Kitchen Supplies'
  | 'Maintenance'
  | 'Electricity'
  | 'Water'
  | 'Staff Salary'
  | 'Rent'
  | 'Other';

export type KitchenUnit = 'kg' | 'litre' | 'packet' | 'piece' | 'dozen';
export type KitchenLogType = 'in' | 'out';

export type PaymentStatus = 'paid' | 'partial' | 'unpaid';

export interface BusinessSettings {
  id: string;
  pg_name: string;
  created_at: string;
  updated_at: string;
}

export interface StaffProfile {
  id: string;
  organization_id: string;
  email: string;
  full_name: string | null;
  is_owner: boolean;
  created_at: string;
}

export interface Room {
  id: string;
  room_number: string;
  capacity: number;
  created_at: string;
}

export interface Tenant {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  phone: string | null;
  room_id: string | null;
  monthly_fee: number;
  join_date: string;
  active: boolean;
  created_at: string;
}

export interface Payment {
  id: string;
  tenant_id: string;
  amount: number;
  date: string;
  for_month: string;
  mode: PaymentMode;
  created_at: string;
}

export interface Expense {
  id: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  note: string | null;
  created_at: string;
}

export interface KitchenItem {
  id: string;
  name: string;
  qty: number;
  unit: KitchenUnit;
  reorder_threshold: number;
  created_at: string;
}

export interface KitchenLogEntry {
  id: string;
  item_id: string;
  type: KitchenLogType;
  qty: number;
  date: string;
  note: string | null;
  created_at: string;
}

export interface TenantWithRoom extends Tenant {
  room?: Room | null;
}

export interface PaymentWithTenant extends Payment {
  tenant?: Tenant & { room?: Room | null };
}

export interface KitchenLogWithItem extends KitchenLogEntry {
  item?: KitchenItem;
}

export interface TenantProfile {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  phone: string | null;
  monthly_fee: number;
  join_date: string;
  room_number: string | null;
}

export const PAYMENT_MODES: PaymentMode[] = ['Cash', 'UPI', 'Bank Transfer', 'Other'];

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Kitchen Supplies',
  'Maintenance',
  'Electricity',
  'Water',
  'Staff Salary',
  'Rent',
  'Other',
];

export const KITCHEN_UNITS: KitchenUnit[] = ['kg', 'litre', 'packet', 'piece', 'dozen'];
