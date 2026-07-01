import React from 'react';
import { ShieldAlert, Banknote, MessageSquare } from 'lucide-react';
import { Customer } from '../types';
import { calcPending, getOverdueDays } from '../utils/helpers';
import { sendWhatsAppReminder } from '../utils/exports';

interface OverduePaymentsAlertProps {
  customers: Customer[];
  onOpenCashPayment: (custId: string) => void;
}

export default function OverduePaymentsAlert({ customers, onOpenCashPayment }: OverduePaymentsAlertProps) {
  // Only check active customers (or ignore closed ones)
  const overdueCustomers = customers
    .filter(c => c.status !== 'closed')
    .map(c => {
      const pending = calcPending(c);
      const overdueDays = getOverdueDays(c);
      return {
        customer: c,
        totalPending: pending.total,
        overdueDays,
      };
    })
    .filter(x => x.totalPending > 0 && x.overdueDays > 10)
    // Sort by most days overdue descending
    .sort((a, b) => b.overdueDays - a.overdueDays);

  if (overdueCustomers.length === 0) return null;

  return (
    <div id="overdue-alerts-box" className="mx-4 mt-4 bg-red-50/90 border-2 border-red-500 rounded-3xl p-4 shadow-xl shadow-red-500/10 animate-[pulse_2s_infinite] overflow-hidden transition-all">
      <div className="flex items-center gap-2 text-red-700 font-extrabold text-sm uppercase tracking-wide mb-3">
        <ShieldAlert className="w-5 h-5 text-red-600 animate-bounce" />
        <span>⚠️ Critical Alert: 10 Din Se Zyada Pending!</span>
      </div>

      <div className="space-y-3">
        {overdueCustomers.map(({ customer, totalPending, overdueDays }) => (
          <div
            key={customer.id}
            id={`overdue-item-${customer.id}`}
            className="bg-white/95 border border-red-100 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-800 text-sm">{customer.name}</span>
                <span className="bg-red-100 border border-red-200 text-red-700 text-[10px] font-black px-2 py-0.5 rounded-md animate-pulse">
                  🚨 {overdueDays} Din Overdue
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1 truncate">
                🗺️ {customer.address || 'Address nahi hai'}
              </p>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
              <div className="text-right sm:mr-1">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Pending Amount</span>
                <span className="text-base font-black text-red-600">₹{totalPending}</span>
              </div>

              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => onOpenCashPayment(customer.id)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-2.5 py-2 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-sm"
                  title="Settle Payment"
                >
                  <Banknote className="w-3.5 h-3.5" />
                  <span className="inline">Settle</span>
                </button>
                {customer.phone && (
                  <button
                    type="button"
                    onClick={() => sendWhatsAppReminder(customer)}
                    className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-black px-2.5 py-2 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-sm"
                    title="Send WhatsApp Reminder"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span className="inline">WhatsApp</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
