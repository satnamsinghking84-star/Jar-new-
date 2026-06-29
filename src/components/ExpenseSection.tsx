import React from 'react';
import {
  Calendar,
  X,
  Plus,
  Edit,
  Trash2,
  TrendingDown,
  TrendingUp,
  Award,
  Lightbulb,
  Fuel,
  UserCheck,
  Package,
  HelpCircle
} from 'lucide-react';
import { Expense, Customer } from '../types';

interface ExpenseSectionProps {
  expenses: Expense[];
  customers: Customer[];
  fromDate: string;
  toDate: string;
  onFromDateChange: (val: string) => void;
  onToDateChange: (val: string) => void;
  onClearRange: () => void;
  onOpenAddExpense: () => void;
  onOpenEditExpense: (id: string) => void;
  onDeleteExpense: (id: string) => void;
}

export default function ExpenseSection({
  expenses,
  customers,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onClearRange,
  onOpenAddExpense,
  onOpenEditExpense,
  onDeleteExpense,
}: ExpenseSectionProps) {
  // Filter expenses
  const filteredExpenses = expenses.filter(k => {
    if (!k.date) return false;
    if (fromDate && k.date < fromDate) return false;
    if (toDate && k.date > toDate) return false;
    return true;
  });

  // Category totals
  const CATS = ['Delivery Boy Salary', 'Light Bill', 'Diesel', 'Miscellaneous'];
  const catTotals: Record<string, number> = {
    'Delivery Boy Salary': 0,
    'Light Bill': 0,
    'Diesel': 0,
    'Miscellaneous': 0,
  };

  filteredExpenses.forEach(k => {
    const cat = CATS.includes(k.category) ? k.category : 'Miscellaneous';
    catTotals[cat] = (catTotals[cat] || 0) + (k.amount || 0);
  });

  const grandExpenseTotal = filteredExpenses.reduce((sum, k) => sum + (k.amount || 0), 0);

  // Period sales and pending cash calculation
  let periodKamai = 0;
  let periodPending = 0;

  customers.forEach(c => {
    (c.deliveries || []).forEach(d => {
      if (!d.date) return;
      if (fromDate && d.date < fromDate) return;
      if (toDate && d.date > toDate) return;

      const amt = d.amount > 0 ? d.amount : (d.delivered || 0) * (c.ratePerJar || 0);
      periodKamai += amt;
      if (d.paidStatus === 'pending') {
        periodPending += amt;
      }
    });
  });

  const periodReceived = periodKamai - periodPending;
  const netProfit = periodKamai - grandExpenseTotal;
  const netProfitReceived = periodReceived - grandExpenseTotal;

  const isProfit = netProfit >= 0;
  const isProfitReceived = netProfitReceived >= 0;

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Delivery Boy Salary':
        return <UserCheck className="w-5 h-5 text-blue-700" />;
      case 'Light Bill':
        return <Lightbulb className="w-5 h-5 text-amber-600" />;
      case 'Diesel':
        return <Fuel className="w-5 h-5 text-emerald-700" />;
      default:
        return <Package className="w-5 h-5 text-purple-700" />;
    }
  };

  const getCategoryBg = (cat: string) => {
    switch (cat) {
      case 'Delivery Boy Salary':
        return 'bg-blue-50/50 border-blue-100/50';
      case 'Light Bill':
        return 'bg-amber-50/50 border-amber-100/50';
      case 'Diesel':
        return 'bg-emerald-50/50 border-emerald-100/50';
      default:
        return 'bg-purple-50/50 border-purple-100/50';
    }
  };

  const rangeLabel =
    fromDate && toDate
      ? `${fromDate} se ${toDate}`
      : fromDate
      ? `${fromDate} ke baad`
      : toDate
      ? `${toDate} tak`
      : 'Poora Data';

  return (
    <div className="space-y-4">
      {/* Date Filters block */}
      <div className="bg-white mx-4 mt-4 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-amber-50 border-b border-amber-100/50 px-4 py-3 flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
          <Calendar className="w-4 h-4 text-amber-600" />
          <span>📅 Seema (Date Range Filter)</span>
        </div>

        <div className="p-4 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-[140px]">
            <span className="text-xs font-semibold text-slate-500">Se:</span>
            <input
              type="date"
              value={fromDate}
              onChange={e => onFromDateChange(e.target.value)}
              className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50/50 w-full outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 flex-1 min-w-[140px]">
            <span className="text-xs font-semibold text-slate-500">Tak:</span>
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
              className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Hatao</span>
            </button>
          )}
        </div>
      </div>

      {/* Profits & Expenses summaries card */}
      <div className="bg-white mx-4 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-700 to-sky-500 px-4 py-3 flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider shadow-sm">
          <TrendingUp className="w-4 h-4 text-sky-100" />
          <span>📈 {rangeLabel} — Kamai vs Kharcha</span>
        </div>

        <div className="p-4 space-y-4">
          {/* Income block */}
          <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-xs font-extrabold text-emerald-800 flex items-center gap-1">
                💰 Total Kamai (Deliveries)
              </div>
              <div className="text-[10px] text-slate-500 mt-1 font-semibold">
                Mila: ₹{periodReceived.toLocaleString('en-IN')} &nbsp;|&nbsp; Pending: ₹
                {periodPending.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="text-xl font-black text-emerald-700">
              ₹{periodKamai.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Expenses block */}
          <div className="bg-red-50/70 border border-red-100 rounded-xl p-3.5 flex items-center justify-between">
            <span className="text-xs font-extrabold text-red-800">💸 Total Kharcha</span>
            <span className="text-xl font-black text-red-700">
              ₹{grandExpenseTotal.toLocaleString('en-IN')}
            </span>
          </div>

          <hr className="border-t-2 border-dashed border-slate-100" />

          {/* Net Profit (Bookkeeping) */}
          <div
            className={`border rounded-2xl p-4 flex items-center justify-between ${
              isProfit ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'
            }`}
          >
            <div>
              <span
                className={`text-sm font-black uppercase tracking-tight flex items-center gap-1 ${
                  isProfit ? 'text-emerald-800' : 'text-red-800'
                }`}
              >
                {isProfit ? '✅ NET PROFIT' : '❌ NET LOSS'}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold block mt-1">
                (Total Sales − Expense)
              </span>
            </div>
            <div
              className={`text-2xl font-black ${isProfit ? 'text-emerald-700' : 'text-red-700'}`}
            >
              {isProfit ? '+' : '-'}₹{Math.abs(netProfit).toLocaleString('en-IN')}
            </div>
          </div>

          {/* Net Profit Received (Haath mein) */}
          <div
            className={`border rounded-xl p-3.5 flex items-center justify-between ${
              isProfitReceived ? 'bg-lime-50/50 border-lime-100' : 'bg-amber-50 border-amber-100'
            }`}
          >
            <div>
              <span
                className={`text-xs font-extrabold flex items-center gap-1 ${
                  isProfitReceived ? 'text-lime-800' : 'text-amber-800'
                }`}
              >
                {isProfitReceived ? '💵 Haath mein Profit' : '⚠️ Haath mein Loss'}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                (Jo cash mila − Expense)
              </span>
            </div>
            <div
              className={`text-lg font-black ${
                isProfitReceived ? 'text-lime-700' : 'text-amber-700'
              }`}
            >
              {isProfitReceived ? '+' : '-'}₹
              {Math.abs(netProfitReceived).toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown by category cards */}
      <div className="bg-white mx-4 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-amber-50 border-b border-amber-100/50 px-4 py-3 flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
          <TrendingDown className="w-4 h-4 text-amber-600" />
          <span>💸 Categories ka Breakdown</span>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {CATS.map(cat => (
              <div
                key={cat}
                className={`border rounded-xl p-3 flex flex-col justify-between ${getCategoryBg(
                  cat
                )}`}
              >
                <div className="text-lg font-black text-slate-800">
                  ₹{(catTotals[cat] || 0).toLocaleString('en-IN')}
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  {getCategoryIcon(cat)}
                  <span>{cat.replace('Salary', '')}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-red-50 border border-red-100 rounded-xl p-3.5 flex items-center justify-between">
            <span className="text-xs font-extrabold text-red-800">💸 Total Expenses</span>
            <span className="text-xl font-black text-red-700">
              ₹{grandExpenseTotal.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Add New Expense Button */}
      <div className="px-4">
        <button
          onClick={onOpenAddExpense}
          className="w-full bg-gradient-to-r from-orange-600 to-amber-500 text-white hover:brightness-105 active:scale-[0.99] rounded-2xl py-4 px-6 text-base font-extrabold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all border border-orange-500"
        >
          <Plus className="w-5 h-5" />
          <span>➕ Naya Kharcha Jodo</span>
        </button>
      </div>

      {/* Expenses Records List */}
      <div className="px-4 pb-20">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-10 text-slate-400 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center p-4">
            <HelpCircle className="w-12 h-12 text-slate-300 mb-2 animate-bounce" />
            <p className="text-sm font-semibold">Is filter mein koi kharcha nahi mila.</p>
            <p className="text-xs text-slate-400 mt-1">Upar diye buttons se naya jodein!</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-wider text-slate-400 font-extrabold pl-1 mb-1">
              📋 {filteredExpenses.length} Expense Records
            </div>

            {[...filteredExpenses]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map(k => (
                <div
                  key={k.id}
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:border-orange-200 transition-all"
                >
                  {/* Card top bar */}
                  <div className="bg-gradient-to-r from-orange-600 to-amber-500 text-white px-4 py-3 flex justify-between items-center">
                    <span className="font-extrabold text-sm flex items-center gap-1.5">
                      {getCategoryIcon(k.category)}
                      <span className="text-white font-black">{k.category}</span>
                    </span>
                    <span className="text-base font-black">
                      ₹{k.amount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Date and description metadata */}
                  <div className="px-4 py-2.5 border-b border-slate-50 flex justify-between items-center text-xs text-slate-500 font-medium">
                    <span>📅 {k.date}</span>
                    {k.notes && (
                      <span className="text-slate-400 max-w-[60%] truncate">📝 {k.notes}</span>
                    )}
                  </div>

                  {/* Actions row */}
                  <div className="p-2.5 bg-slate-50/50 flex gap-2">
                    <button
                      onClick={() => onOpenEditExpense(k.id)}
                      className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => onDeleteExpense(k.id)}
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
