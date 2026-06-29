import React from 'react';
import { AlertTriangle, Banknote } from 'lucide-react';
import { Customer } from '../types';
import { calcPending } from '../utils/helpers';

interface PendingPaymentsProps {
  customers: Customer[];
  onOpenCashPayment: (custId: string) => void;
}

export default function PendingPayments({ customers, onOpenCashPayment }: PendingPaymentsProps) {
  // Map and filter customers with active pending balances
  const pendingList = customers
    .map(c => {
      const p = calcPending(c);
      return {
        id: c.id,
        name: c.name,
        deliveryPending: p.deliveryPending,
        monthlyDue: p.monthlyDue,
        total: p.total,
      };
    })
    .filter(x => x.total > 0);

  const grandTotal = pendingList.reduce((sum, x) => sum + x.total, 0);

  return (
    <div className="bg-white mx-4 mt-4 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header Banner */}
      <div className="bg-red-50 border-b border-red-100/50 px-4 py-3 flex items-center gap-2 text-red-800 font-bold text-xs uppercase tracking-wider">
        <AlertTriangle className="w-4 h-4 text-red-600 animate-bounce" />
        <span>⚠️ Pending Payments</span>
      </div>

      <div className="p-4">
        {pendingList.length === 0 ? (
          <div className="text-center py-4 text-emerald-700 font-extrabold text-sm flex flex-col items-center gap-1.5">
            <span>✨ Sab clear hai! Koi pending payment nahi hai.</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Grand Total banner */}
            <div className="bg-red-50/80 border border-red-100 p-3.5 rounded-xl flex items-center justify-between">
              <span className="text-xs font-black text-red-800">💸 Total Outstanding</span>
              <span className="text-xl font-black text-red-600">
                ₹{grandTotal.toLocaleString('en-IN')}
              </span>
            </div>

            {/* List of outstanding accounts */}
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
              {pendingList.map(x => (
                <div
                  key={x.id}
                  className="bg-red-50/20 border border-red-100/60 rounded-xl p-3 flex flex-col gap-2 hover:border-red-200 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-800">{x.name}</span>
                    <span className="text-base font-extrabold text-red-600">
                      ₹{x.total.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Sub-breakdowns */}
                  <div className="flex flex-wrap gap-2">
                    {x.deliveryPending > 0 && (
                      <span className="bg-red-50 border border-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Delivery: ₹{x.deliveryPending}
                      </span>
                    )}
                    {x.monthlyDue > 0 && (
                      <span className="bg-purple-50 border border-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Monthly Due: ₹{x.monthlyDue}
                      </span>
                    )}
                  </div>

                  {/* Payment recording button */}
                  <button
                    onClick={() => onOpenCashPayment(x.id)}
                    className="w-full mt-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white border border-emerald-500 hover:brightness-105 active:scale-[0.99] rounded-xl py-2 px-3 text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Banknote className="w-4 h-4" />
                    <span>💵 Cash Mila - Payment Mark Karo</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
