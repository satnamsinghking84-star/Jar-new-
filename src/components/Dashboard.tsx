import React from 'react';
import { Calendar, X, BarChart3, Users, Package, Banknote, AlertTriangle } from 'lucide-react';
import { Customer } from '../types';
import { calcPending, todayStr } from '../utils/helpers';

interface DashboardProps {
  customers: Customer[];
  fromDate: string;
  toDate: string;
  onFromDateChange: (val: string) => void;
  onToDateChange: (val: string) => void;
  onClearRange: () => void;
}

export default function Dashboard({
  customers,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onClearRange,
}: DashboardProps) {
  const today = todayStr();

  // Metrics calculations
  let totalKamai = 0;
  let totalJar = 0;
  let todayKamai = 0;
  let todayJar = 0;
  let rangeKamai = 0;
  let rangeJar = 0;

  customers.forEach(c => {
    (c.deliveries || []).forEach(d => {
      // All time metrics
      totalKamai += d.amount || 0;
      totalJar += d.delivered || 0;

      // Today's metrics
      if (d.date === today) {
        todayKamai += d.amount || 0;
        todayJar += d.delivered || 0;
      }

      // Range metrics
      const matchesFrom = !fromDate || d.date >= fromDate;
      const matchesTo = !toDate || d.date <= toDate;
      if (matchesFrom && matchesTo) {
        rangeKamai += d.amount || 0;
        rangeJar += d.delivered || 0;
      }
    });
  });

  const totalJarsOut = customers.reduce((sum, c) => sum + (c.jarsAtCustomer || 0), 0);
  const activeJarsList = customers.filter(c => (c.jarsAtCustomer || 0) > 0);

  const grandPending = customers.reduce((sum, c) => {
    const p = calcPending(c);
    return sum + p.total;
  }, 0);

  const getRangeLabel = () => {
    if (fromDate && toDate) return `${fromDate} se ${toDate}`;
    if (fromDate) return `${fromDate} ke baad`;
    if (toDate) return `${toDate} tak`;
    return 'Sabhi Dino';
  };

  return (
    <div className="bg-white mx-4 mt-4 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Title block */}
      <div className="bg-emerald-50 border-b border-emerald-100/50 px-4 py-3 flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
        <BarChart3 className="w-4 h-4 text-emerald-600" />
        <span>📊 Kamai ka Hisaab</span>
      </div>

      {/* Date Filters */}
      <div className="px-4 py-3.5 border-b border-slate-50 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[140px]">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Se:
          </span>
          <input
            type="date"
            value={fromDate}
            onChange={e => onFromDateChange(e.target.value)}
            className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50/50 w-full outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-[140px]">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Tak:
          </span>
          <input
            type="date"
            value={toDate}
            onChange={e => onToDateChange(e.target.value)}
            className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50/50 w-full outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>

        {(fromDate || toDate) && (
          <button
            onClick={onClearRange}
            className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>✕ Sab</span>
          </button>
        )}
      </div>

      {/* Jars currently out panel */}
      <div className="bg-sky-50/80 border-b border-sky-100/30 p-4">
        <div className="flex items-center gap-2 text-sky-800 font-bold text-xs tracking-tight">
          <Package className="w-4.5 h-4.5 text-sky-600" />
          <span>
            📦 Abhi saare customers ke paas kul:{' '}
            <span className="text-lg text-sky-700 font-black">{totalJarsOut}</span> Jar hain
          </span>
        </div>
        {activeJarsList.length > 0 ? (
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs mt-2 text-sky-900/80 max-h-24 overflow-y-auto pr-2 scrollbar-thin">
            {activeJarsList.map(c => (
              <span key={c.id} className="bg-white/60 border border-sky-100/50 px-2 py-0.5 rounded-md font-semibold">
                👤 {c.name} — <strong className="text-sky-700 font-black">{c.jarsAtCustomer}</strong>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-sky-800/60 font-semibold mt-1">Abhi kisi ke paas koi jar nahi hai.</p>
        )}
      </div>

      {/* Grid boxes */}
      <div className="grid grid-cols-2">
        {/* Today's Income */}
        <div className="p-4 border-r border-b border-slate-50 flex flex-col justify-between">
          <div>
            <div className="text-xl font-black text-emerald-600">
              ₹{todayKamai.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-0.5 flex items-center gap-1">
              <Banknote className="w-3.5 h-3.5 text-emerald-500" />
              Aaj ki Kamai
            </div>
          </div>
        </div>

        {/* Today's Jars */}
        <div className="p-4 border-b border-slate-50 flex flex-col justify-between">
          <div>
            <div className="text-xl font-black text-blue-700">{todayJar}</div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-0.5 flex items-center gap-1">
              <Package className="w-3.5 h-3.5 text-blue-500" />
              Aaj ke Jar
            </div>
          </div>
        </div>

        {/* Range Income */}
        <div className="p-4 border-r border-b border-slate-50 flex flex-col justify-between">
          <div>
            <div className="text-xl font-black text-emerald-600">
              ₹{rangeKamai.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-0.5">
              💰 {getRangeLabel()} ki Kamai
            </div>
          </div>
        </div>

        {/* Range Jars */}
        <div className="p-4 border-b border-slate-50 flex flex-col justify-between">
          <div>
            <div className="text-xl font-black text-orange-600">{rangeJar}</div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-0.5">
              📦 {getRangeLabel()} ke Jar
            </div>
          </div>
        </div>

        {/* Total Income */}
        <div className="p-4 border-r border-slate-50 flex flex-col justify-between">
          <div>
            <div className="text-xl font-black text-purple-700">
              ₹{totalKamai.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-0.5">
              💰 Poori Kamai (Total)
            </div>
            {grandPending > 0 && (
              <div className="mt-1 flex items-center gap-1 text-[10px] font-black text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-md w-max">
                <AlertTriangle className="w-3 h-3" />
                <span>₹{grandPending.toLocaleString('en-IN')} Pending</span>
              </div>
            )}
          </div>
        </div>

        {/* Total Customers */}
        <div className="p-4 flex flex-col justify-between">
          <div>
            <div className="text-xl font-black text-slate-800">{customers.length}</div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-0.5 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              Total Customers
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
