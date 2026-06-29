import React from 'react';
import { Package } from 'lucide-react';
import { Customer } from '../types';

interface StockSectionProps {
  customers: Customer[];
  stock: number;
  onStockChange: (val: number) => void;
}

export default function StockSection({ customers, stock, onStockChange }: StockSectionProps) {
  const atCustomers = customers.reduce((sum, c) => sum + (c.jarsAtCustomer || 0), 0);
  const dukan = Math.max(0, stock - atCustomers);

  const increment = () => {
    onStockChange(stock + 1);
  };

  const decrement = () => {
    onStockChange(Math.max(0, stock - 1));
  };

  return (
    <div className="bg-white mx-4 mt-4 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Title banner */}
      <div className="bg-amber-50 border-b border-amber-100/50 px-4 py-3 flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
        <Package className="w-4 h-4 text-amber-600" />
        <span>📦 Mera Stock</span>
      </div>

      <div className="p-4">
        {/* Input and steppers row */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <span className="text-xs font-black text-slate-700 block">🔢 Mere paas kul Jar</span>
            <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
              (+ − dabayein ya direct value likhein)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={decrement}
              className="bg-amber-50 active:bg-amber-100 text-amber-700 border border-amber-100 font-black text-xl w-10 h-10 rounded-xl cursor-pointer flex items-center justify-center select-none"
            >
              −
            </button>
            <input
              type="number"
              value={stock}
              min="0"
              onChange={e => onStockChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-16 text-center text-xl font-extrabold text-amber-700 bg-amber-50/30 border border-amber-100 rounded-xl py-1.5 focus:bg-white focus:border-amber-500 outline-none"
            />
            <button
              onClick={increment}
              className="bg-amber-50 active:bg-amber-100 text-amber-700 border border-amber-100 font-black text-xl w-10 h-10 rounded-xl cursor-pointer flex items-center justify-center select-none"
            >
              +
            </button>
          </div>
        </div>

        {/* Calculated summaries */}
        <div className="mt-4 bg-slate-50/50 rounded-xl p-3 border border-slate-100 flex flex-wrap gap-x-3 gap-y-2">
          <span className="bg-blue-50 border border-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5">
            🔢 Total Jar: {stock}
          </span>
          <span className="bg-red-50 border border-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5">
            👥 Customer ke paas: {atCustomers}
          </span>
          <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5">
            🏪 Dukan mein: {dukan}
          </span>
        </div>
      </div>
    </div>
  );
}
