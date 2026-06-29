import React from 'react';
import { Phone, MapPin, Map, Clock, Package, HelpCircle } from 'lucide-react';
import { Customer } from '../types';
import { getTimingOrder } from '../utils/helpers';

interface DeliveryBoySectionProps {
  customers: Customer[];
  onOpenDeliver: (id: string) => void;
}

export default function DeliveryBoySection({ customers, onOpenDeliver }: DeliveryBoySectionProps) {
  const activeCustomers = customers.filter(c => c.status !== 'closed');

  if (activeCustomers.length === 0) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-slate-400 text-center">
        <HelpCircle className="w-12 h-12 text-slate-300 mb-2 animate-bounce" />
        <p className="font-bold text-sm">Abhi koi active customer nahi hai.</p>
        <p className="text-xs text-slate-400 mt-1">Owner ko boleind customer add karne ke liye.</p>
      </div>
    );
  }

  // Sort by delivery timing prioritised order
  const sortedCustomers = [...activeCustomers].sort(
    (a, b) => getTimingOrder(a.deliveryTime) - getTimingOrder(b.deliveryTime)
  );

  return (
    <div className="px-4 py-4 pb-24 space-y-4">
      <div className="text-xs uppercase tracking-wider text-slate-400 font-extrabold pl-1">
        📋 {sortedCustomers.length} Customer Aaj ke liye (Time ke hisaab se sorted)
      </div>

      <div className="space-y-4">
        {sortedCustomers.map((c, i) => (
          <div
            key={c.id}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:border-emerald-200 transition-all"
          >
            {/* Top Info line */}
            <div className="bg-gradient-to-r from-emerald-700 to-emerald-500 text-white px-4 py-3 flex justify-between items-center">
              <span className="font-extrabold text-sm">
                #{i + 1} &nbsp; {c.name}
              </span>
              {c.phone && (
                <a
                  href={`tel:${c.phone}`}
                  className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-bold hover:bg-white/30 transition-all"
                >
                  📞 Call: {c.phone}
                </a>
              )}
            </div>

            {/* Address Row */}
            {c.address && (
              <div className="px-4 py-3 border-b border-slate-50 text-xs text-slate-600 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{c.address}</span>
              </div>
            )}

            {/* Maps redirection link */}
            {c.mapLink && (
              <div className="px-4 py-2 border-b border-slate-50 text-xs">
                <a
                  href={c.mapLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline font-extrabold flex items-center gap-1 w-max"
                >
                  <Map className="w-3.5 h-3.5" />
                  <span>Google Maps mein dekho →</span>
                </a>
              </div>
            )}

            {/* Selected Timing Display */}
            {c.deliveryTime && (
              <div className="px-4 py-2 bg-amber-50/40 border-b border-slate-50 text-xs text-amber-900 flex items-center gap-1.5 font-bold">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>⏰ Time: {c.deliveryTime}</span>
              </div>
            )}

            {/* Simple Distributed Jar Status badges */}
            <div className="px-4 py-2.5 bg-slate-50/50 border-b border-slate-50 flex gap-2 flex-wrap">
              <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold rounded-full px-3 py-1 flex items-center gap-1">
                <Package className="w-3.5 h-3.5" />
                <span>Dene hain (Current Stock): {c.jarsAtCustomer}</span>
              </span>
              <span className="bg-orange-50 border border-orange-100 text-orange-700 text-xs font-bold rounded-full px-3 py-1 flex items-center gap-1">
                <Package className="w-3.5 h-3.5" />
                <span>Lene hain (Out Jars): {c.jarsAtCustomer}</span>
              </span>
            </div>

            {/* Delivery insertion action */}
            <div className="p-3">
              <button
                onClick={() => onOpenDeliver(c.id)}
                className="w-full bg-gradient-to-r from-blue-600 to-sky-500 hover:brightness-105 text-white active:scale-[0.99] rounded-xl py-3 text-sm font-extrabold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-blue-500"
              >
                <Package className="w-4 h-4" />
                <span>📦 Delivery Dalo</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
