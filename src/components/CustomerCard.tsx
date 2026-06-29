import React from 'react';
import {
  User,
  Phone,
  MapPin,
  Map,
  Package,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  History,
  FileDown,
  Table,
  Edit,
  Trash2,
  Banknote,
  DollarSign
} from 'lucide-react';
import { Customer } from '../types';
import { calcPending } from '../utils/helpers';
import { sendWhatsAppReminder } from '../utils/exports';

interface CustomerCardProps {
  key?: string | number;
  customer: Customer;
  index: number;
  onOpenDeliver: (id: string) => void;
  onOpenPayment: (id: string) => void;
  onOpenPdfModal: (id: string) => void;
  onOpenExcelModal: (id: string) => void;
  onOpenEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenTimingModal: (id: string) => void;
  onOpenEditDelivery: (custId: string, delIndex: number) => void;
  onToggleStatus: (id: string) => void;
}

export default function CustomerCard({
  customer,
  index,
  onOpenDeliver,
  onOpenPayment,
  onOpenPdfModal,
  onOpenExcelModal,
  onOpenEdit,
  onDelete,
  onOpenTimingModal,
  onOpenEditDelivery,
  onToggleStatus,
}: CustomerCardProps) {
  const lastDeliveries = (customer.deliveries || []).slice(0, 3);
  const totalDelivered = (customer.deliveries || []).reduce((s, d) => s + d.delivered, 0);

  // Calculations
  const rate = customer.ratePerJar || 0;
  const pendingCalc = calcPending(customer);
  const pendingAmt = pendingCalc.total;

  const expectedAmt = customer.monthlyAmt
    ? customer.monthlyAmt
    : totalDelivered * (customer.ratePerJar || 0);
  const paidInDelivery = (customer.deliveries || [])
    .filter(d => d.paidStatus !== 'pending')
    .reduce((s, d) => s + (d.amount || 0), 0);
  const extraPayments = (customer.payments || []).reduce((s, p) => s + (p.amount || 0), 0);
  const alreadyPaid = paidInDelivery + extraPayments;
  const due = Math.max(0, expectedAmt - alreadyPaid);

  const lastPayments = (customer.payments || []).slice(0, 3);

  return (
    <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-md transition-all duration-300 ${
      customer.status === 'closed' ? 'border-slate-300 opacity-80' : 'border-slate-100'
    }`}>
      {/* Top Banner: Name + Serial */}
      <div className={`transition-all duration-300 text-white px-4 py-3.5 flex justify-between items-start ${
        customer.status === 'closed'
          ? 'bg-gradient-to-r from-slate-600 to-slate-500'
          : 'bg-gradient-to-r from-blue-600 to-sky-500'
      }`}>
        <div>
          <h3 className="font-extrabold text-base flex items-center gap-2">
            <User className="w-4 h-4 text-sky-100" />
            <span>{customer.name}</span>
          </h3>
          {customer.phone && (
            <a
              href={`tel:${customer.phone}`}
              className="text-xs text-sky-100 font-semibold hover:underline flex items-center gap-1 mt-1 outline-none w-max"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{customer.phone}</span>
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Status Badge Toggle */}
          <button
            onClick={() => onToggleStatus(customer.id)}
            className={`text-[10px] font-black px-2.5 py-1 rounded-full border transition-all cursor-pointer flex items-center gap-1.5 ${
              customer.status === 'closed'
                ? 'bg-slate-700/40 border-slate-400 text-slate-100 hover:bg-slate-700/60'
                : 'bg-emerald-500/20 border-emerald-400 text-emerald-100 hover:bg-emerald-500/40'
            }`}
            title="Click karke active/close badlein"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${customer.status === 'closed' ? 'bg-slate-300' : 'bg-emerald-400 animate-pulse'}`}></span>
            <span>{customer.status === 'closed' ? 'CLOSED' : 'ACTIVE'}</span>
          </button>

          <span className="bg-white/20 text-white text-[11px] font-black px-2.5 py-1 rounded-full border border-white/10">
            #{index + 1}
          </span>
        </div>
      </div>

      {/* Address / Location Row */}
      <div className="px-4 py-3 text-xs text-slate-600 border-b border-slate-50 flex items-start gap-2.5">
        <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <div className="flex-1 leading-relaxed">
          <span>{customer.address}</span>
          {customer.mapLink && (
            <a
              href={customer.mapLink}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline font-bold flex items-center gap-1 mt-1"
            >
              <Map className="w-3.5 h-3.5" />
              <span>Google Maps mein dekho →</span>
            </a>
          )}
        </div>
      </div>

      {/* Badges Info */}
      <div className="px-4 py-3 flex gap-2 flex-wrap border-b border-slate-50 bg-slate-50/20">
        <span className="bg-blue-50 border border-blue-100 text-blue-700 rounded-full px-3 py-1 text-xs font-bold flex items-center gap-1">
          <Package className="w-3.5 h-3.5" />
          <span>Unke paas: {customer.jarsAtCustomer} Jar</span>
        </span>
        <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full px-3 py-1 text-xs font-bold flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>Plan: {customer.monthlyPlan}/mo</span>
        </span>
        <span className="bg-amber-50 border border-amber-100 text-amber-700 rounded-full px-3 py-1 text-xs font-bold flex items-center gap-1">
          <Package className="w-3.5 h-3.5" />
          <span>Total: {totalDelivered} Jar</span>
        </span>

        {pendingAmt > 0 ? (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="bg-red-50 border border-red-100 text-red-700 rounded-full px-3 py-1 text-xs font-bold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
              <span>Pending: ₹{pendingAmt}</span>
            </span>
            {customer.phone && (
              <button
                onClick={() => sendWhatsAppReminder(customer)}
                className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 hover:text-emerald-800 rounded-full px-2.5 py-1 text-xs font-extrabold transition-all flex items-center gap-1 cursor-pointer shadow-sm active:scale-95"
                title="WhatsApp payment reminder bheinjein"
              >
                <span>💬 Remind</span>
              </button>
            )}
          </div>
        ) : (
          <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full px-3 py-1 text-xs font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Koi pending nahi</span>
          </span>
        )}
      </div>

      {/* Extra metadata fields */}
      {customer.agent && (
        <div className="px-4 py-2 text-xs text-slate-500 border-b border-slate-50 bg-slate-50/10">
          <span>🧑‍🦯 Agent: </span>
          <strong className="text-slate-700 font-black">{customer.agent}</strong>
        </div>
      )}
      {customer.notes && (
        <div className="px-4 py-2 text-xs text-slate-500 border-b border-slate-50 bg-slate-50/10 italic">
          <span>📝 {customer.notes}</span>
        </div>
      )}

      {/* Delivery Timing Panel */}
      <div className="px-4 py-2.5 border-b border-slate-50 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-600">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>Timing: </span>
          {customer.deliveryTime ? (
            <span className="text-orange-700 font-extrabold bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-md">
              {customer.deliveryTime}
            </span>
          ) : (
            <span className="text-slate-400 italic">Set nahi hai</span>
          )}
        </div>
        <button
          onClick={() => onOpenTimingModal(customer.id)}
          className="text-orange-700 hover:bg-orange-100/60 border border-orange-200/50 bg-orange-50/30 px-2.5 py-1 rounded-lg text-[11px] font-black cursor-pointer transition-all flex items-center gap-1"
        >
          ⏱️ Edit
        </button>
      </div>

      {/* Delivery History Panel */}
      <div className="px-4 py-3 border-b border-slate-50">
        <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 flex items-center gap-1">
          <History className="w-3.5 h-3.5" />
          <span>📜 Pichli Deliveries</span>
        </h4>
        {lastDeliveries.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Abhi koi delivery record nahi hai</p>
        ) : (
          <div className="space-y-1.5">
            {lastDeliveries.map((d, di) => {
              const displayAmt = d.amount > 0 ? d.amount : (d.delivered || 0) * rate;
              return (
                <div
                  key={di}
                  onClick={() => onOpenEditDelivery(customer.id, di)}
                  className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-100/50 cursor-pointer group transition-all"
                  title="Click karo edit karne ke liye"
                >
                  <span className="text-slate-500 font-medium">📅 {d.date}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-700 font-extrabold">📦 {d.delivered} Jar</span>
                    {d.collected > 0 && (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                        ↩ {d.collected} wapas
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        d.paidStatus === 'pending'
                          ? 'bg-red-50 text-red-600 border border-red-100'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}
                    >
                      {d.paidStatus === 'pending' ? `⚠️ ₹${displayAmt} Pending` : displayAmt > 0 ? `✅ ₹${displayAmt}` : 'Paid'}
                    </span>
                    <Edit className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                  </div>
                </div>
              );
            })}
            {(customer.deliveries || []).length > 3 && (
              <p className="text-[10px] text-slate-400 text-right font-medium">
                ... aur {customer.deliveries.length - 3} aur records
              </p>
            )}
          </div>
        )}
      </div>

      {/* Monthly Payment Section */}
      {customer.payType === 'monthly' && (
        <div className="px-4 py-3 bg-purple-50/10 border-b border-slate-50 text-xs">
          <h4 className="text-purple-800 font-black mb-2 flex items-center gap-1">
            <DollarSign className="w-4 h-4 text-purple-600" />
            <span>💳 Monthly Payment</span>
          </h4>
          <div className="flex flex-wrap gap-2 mb-2">
            <span className="bg-purple-50 border border-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-bold">
              Expected: ₹{expectedAmt}
            </span>
            <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-bold">
              Paid: ₹{alreadyPaid}
            </span>
            <span
              className={`px-2.5 py-1 rounded-full font-extrabold ${
                due > 0
                  ? 'bg-red-50 border border-red-100 text-red-700'
                  : 'bg-emerald-50 border border-emerald-100 text-emerald-700'
              }`}
            >
              {due > 0 ? `⚠️ Due: ₹${due}` : '✅ Clear'}
            </span>
          </div>

          {/* Monthly Payments list */}
          {lastPayments.length > 0 && (
            <div className="border-t border-purple-100/50 pt-2 mt-2 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Payment Records
              </span>
              {lastPayments.map((p, pi) => (
                <div key={pi} className="flex justify-between items-center py-0.5 text-xs">
                  <span className="text-slate-500 font-medium">{p.date}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-700 font-extrabold">₹{p.amount}</span>
                    {p.note && <span className="text-slate-400 text-[10px]">({p.note})</span>}
                  </div>
                </div>
              ))}
              {(customer.payments || []).length > 3 && (
                <span className="text-[10px] text-slate-400 block text-right mt-1">
                  ...aur {customer.payments.length - 3} aur records
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Operational Actions */}
      <div className="p-3.5 bg-slate-50/50 flex gap-2 flex-wrap">
        <button
          onClick={() => onOpenDeliver(customer.id)}
          className="flex-1 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 active:scale-[0.98] rounded-xl py-2 px-1 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Package className="w-3.5 h-3.5" />
          <span>📦 Delivery</span>
        </button>

        {customer.payType === 'monthly' && (
          <button
            onClick={() => onOpenPayment(customer.id)}
            className="flex-1 bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 active:scale-[0.98] rounded-xl py-2 px-1 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Banknote className="w-3.5 h-3.5" />
            <span>💳 Payment</span>
          </button>
        )}

        <button
          onClick={() => onOpenPdfModal(customer.id)}
          className="bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-700 active:scale-[0.98] rounded-xl py-2 px-3 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
          title="PDF Statement"
        >
          <FileDown className="w-3.5 h-3.5" />
          <span>PDF</span>
        </button>

        <button
          onClick={() => onOpenExcelModal(customer.id)}
          className="bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-800 active:scale-[0.98] rounded-xl py-2 px-3 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
          title="Excel Statement"
        >
          <Table className="w-3.5 h-3.5" />
          <span>XLS</span>
        </button>

        <button
          onClick={() => onOpenEdit(customer.id)}
          className="bg-violet-50 hover:bg-violet-100/80 border border-violet-200 text-violet-700 active:scale-[0.98] rounded-xl py-2 px-3 text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
          title="Edit"
        >
          <Edit className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onDelete(customer.id)}
          className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 active:scale-[0.98] rounded-xl py-2 px-3 text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
