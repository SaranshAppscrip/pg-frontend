import { format, parseISO } from 'date-fns';
import type { Payment, PaymentStatus } from '../types/database';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy');
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy, h:mm a');
  } catch {
    return dateStr;
  }
}

export function currentMonth(): string {
  return format(new Date(), 'yyyy-MM');
}

export function formatMonth(monthStr: string): string {
  try {
    const [year, month] = monthStr.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return format(date, 'MMMM yyyy');
  } catch {
    return monthStr;
  }
}

export function getPaymentStatus(
  monthlyFee: number,
  payments: Payment[],
  forMonth: string = currentMonth()
): { status: PaymentStatus; paid: number; due: number } {
  const paid = payments
    .filter((p) => p.for_month === forMonth)
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const due = Math.max(0, monthlyFee - paid);

  let status: PaymentStatus = 'unpaid';
  if (paid >= monthlyFee) status = 'paid';
  else if (paid > 0) status = 'partial';

  return { status, paid, due };
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}
