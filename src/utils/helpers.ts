import { Customer } from '../types';

export function todayStr(): string {
  // Return local date string formatted as YYYY-MM-DD
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function formatDateInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getTimingOrder(t?: string): number {
  const order: Record<string, number> = {
    'Subah 8 baje se pehle': 1,
    'Subah 10 baje se pehle': 2,
    'Subah 12 baje se pehle': 3,
    'Dopahar 2 baje se pehle': 4,
    'Shaam 5 baje se pehle': 5,
    'Shaam 7 baje se pehle': 6,
    'Koi bhi waqt': 7,
  };
  if (!t) return 8;
  if (order[t]) return order[t];
  return 7.5; // Custom timing fits before "no timing"
}

export interface PendingCalculations {
  deliveryPending: number;
  monthlyDue: number;
  total: number;
}

export function calcPending(c: Customer): PendingCalculations {
  const rate = c.ratePerJar || 0;
  const cashPaid = (c.payments || []).reduce((s, p) => s + (p.amount || 0), 0);

  if (c.payType === 'monthly') {
    // Monthly customer: difference between expected vs cash paid
    const totalDelivered = (c.deliveries || []).reduce((s, d) => s + (d.delivered || 0), 0);
    const expectedAmt = c.monthlyAmt ? c.monthlyAmt : totalDelivered * rate;
    const monthlyDue = Math.max(0, expectedAmt - cashPaid);
    return { deliveryPending: 0, monthlyDue, total: monthlyDue };
  } else {
    // Per-delivery customer: sum of pending deliveries
    const deliveryPending = (c.deliveries || [])
      .filter(d => d.paidStatus === 'pending')
      .reduce((s, d) => s + (d.amount > 0 ? d.amount : (d.delivered || 0) * rate), 0);
    return { deliveryPending, monthlyDue: 0, total: deliveryPending };
  }
}
