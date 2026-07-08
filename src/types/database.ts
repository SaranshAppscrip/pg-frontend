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

export interface Property {
  id: string;
  organization_id: string;
  name: string;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  organization_id?: string;
  property_id: string;
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

export type AuditEntityType = 'payment' | 'expense' | 'tenant';
export type AuditAction = 'create' | 'delete' | 'move_out';

export interface StaffAuditLogEntry {
  id: string;
  organization_id: string;
  staff_id: string | null;
  staff_email: string;
  entity_type: AuditEntityType;
  entity_id: string;
  action: AuditAction;
  metadata: Record<string, unknown>;
  created_at: string;
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

export type TenantDocumentType =
  | 'id_proof'
  | 'lease_agreement'
  | 'police_verification'
  | 'photo'
  | 'other';

export type OrganizationDocumentType =
  | 'pg_registration'
  | 'fire_safety_noc'
  | 'police_permission'
  | 'trade_license'
  | 'property_tax'
  | 'other';

export interface TenantDocument {
  id: string;
  organization_id: string;
  tenant_id: string;
  document_type: TenantDocumentType;
  title: string | null;
  original_filename: string;
  content_type: string;
  size_bytes: number;
  uploaded_by: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface OrganizationDocument {
  id: string;
  organization_id: string;
  property_id: string | null;
  document_type: OrganizationDocumentType;
  title: string | null;
  original_filename: string;
  content_type: string;
  size_bytes: number;
  uploaded_by: string | null;
  expires_at: string | null;
  created_at: string;
}

export const TENANT_DOCUMENT_TYPES: { value: TenantDocumentType; label: string }[] = [
  { value: 'id_proof', label: 'ID Proof (Aadhaar / PAN)' },
  { value: 'lease_agreement', label: 'Lease / Rent Agreement' },
  { value: 'police_verification', label: 'Police Verification' },
  { value: 'photo', label: 'Photo' },
  { value: 'other', label: 'Other' },
];

export const ORGANIZATION_DOCUMENT_TYPES: { value: OrganizationDocumentType; label: string }[] = [
  { value: 'pg_registration', label: 'PG Registration' },
  { value: 'fire_safety_noc', label: 'Fire Safety NOC' },
  { value: 'police_permission', label: 'Police Permission' },
  { value: 'trade_license', label: 'Trade License' },
  { value: 'property_tax', label: 'Property Tax Receipt' },
  { value: 'other', label: 'Other' },
];

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function documentTypeLabel(
  type: TenantDocumentType | OrganizationDocumentType,
  list: { value: string; label: string }[]
): string {
  return list.find((t) => t.value === type)?.label ?? type;
}

export type AnnouncementCategory = 'maintenance' | 'holiday' | 'rules' | 'general';

export interface Announcement {
  id: string;
  organization_id: string;
  property_id: string | null;
  title: string;
  body: string;
  category: AnnouncementCategory;
  pinned: boolean;
  published: boolean;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type MaintenanceCategory = 'electrical' | 'plumbing' | 'wifi' | 'cleaning' | 'other';
export type MaintenanceStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface MaintenanceRequest {
  id: string;
  organization_id: string;
  tenant_id: string;
  tenant_name?: string;
  room_number?: string | null;
  category: MaintenanceCategory;
  title: string;
  description: string;
  status: MaintenanceStatus;
  staff_note: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface VisitorLogEntry {
  id: string;
  organization_id: string;
  property_id: string;
  property_name?: string;
  tenant_id: string | null;
  tenant_name?: string | null;
  room_number?: string | null;
  visitor_name: string;
  visitor_phone: string | null;
  purpose: string | null;
  id_type: string | null;
  id_number: string | null;
  entry_at: string;
  exit_at: string | null;
  logged_by: string | null;
  notes: string | null;
  created_at: string;
}

export const ANNOUNCEMENT_CATEGORIES: { value: AnnouncementCategory; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'rules', label: 'Rules & Policy' },
];

export const MAINTENANCE_CATEGORIES: { value: MaintenanceCategory; label: string }[] = [
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'wifi', label: 'WiFi / Internet' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'other', label: 'Other' },
];

export const MAINTENANCE_STATUSES: { value: MaintenanceStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];
