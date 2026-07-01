import React, { useState } from 'react';
import { 
  Wrench, 
  Trash2, 
  Edit3, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  X, 
  Flame, 
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { Reminder } from '../types';
import { todayStr, uid } from '../utils/helpers';

interface ReminderSectionProps {
  reminders: Reminder[];
  onSaveReminder: (r: Reminder) => void;
  onDeleteReminder: (id: string) => void;
}

export default function ReminderSection({ reminders, onSaveReminder, onDeleteReminder }: ReminderSectionProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [lastDoneDate, setLastDoneDate] = useState(todayStr());
  const [intervalDays, setIntervalDays] = useState('30');
  const [notes, setNotes] = useState('');

  const today = todayStr();

  // Handle opening form for adding
  const handleOpenAdd = () => {
    setTitle('');
    setLastDoneDate(todayStr());
    setIntervalDays('30');
    setNotes('');
    setEditingId(null);
    setIsFormOpen(true);
  };

  // Handle opening form for editing
  const handleOpenEdit = (r: Reminder) => {
    setTitle(r.title);
    setLastDoneDate(r.lastDoneDate);
    setIntervalDays(String(r.intervalDays));
    setNotes(r.notes || '');
    setEditingId(r.id);
    setIsFormOpen(true);
  };

  // Calculate next due date helper
  const calculateNextDueDate = (lastDate: string, days: number): string => {
    if (!lastDate) return '';
    const dateObj = new Date(lastDate);
    dateObj.setDate(dateObj.getDate() + days);
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Predefined suggestion loader
  const handleLoadDefaults = () => {
    const defaults = [
      { title: 'Tanki Saaf Karna (Water Tank Clean)', days: 90, note: 'Water tank deep clean and sanitation.' },
      { title: 'Motor ki Service (Water Pump Motor Check)', days: 60, note: 'Check voltage, capacitor, and motor heat.' },
      { title: 'Machine Filter Replacement & Service', days: 30, note: 'Change cartridge filter & RO membrane service.' },
    ];

    defaults.forEach(item => {
      const id = 'rem_' + uid();
      const rDate = todayStr();
      const nDate = calculateNextDueDate(rDate, item.days);
      onSaveReminder({
        id,
        title: item.title,
        lastDoneDate: rDate,
        intervalDays: item.days,
        nextDueDate: nDate,
        notes: item.note,
        addedOn: new Date().toISOString(),
      });
    });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const days = parseInt(intervalDays) || 30;
    const nDueDate = calculateNextDueDate(lastDoneDate, days);

    const r: Reminder = {
      id: editingId || 'rem_' + uid(),
      title: title.trim(),
      lastDoneDate,
      intervalDays: days,
      nextDueDate: nDueDate,
      notes: notes.trim(),
      addedOn: editingId 
        ? (reminders.find(item => item.id === editingId)?.addedOn || new Date().toISOString())
        : new Date().toISOString(),
    };

    onSaveReminder(r);
    setIsFormOpen(false);
    setEditingId(null);
  };

  // Mark done today quickly
  const handleMarkDoneToday = (r: Reminder) => {
    const nextDate = calculateNextDueDate(today, r.intervalDays);
    const updated: Reminder = {
      ...r,
      lastDoneDate: today,
      nextDueDate: nextDate,
    };
    onSaveReminder(updated);
  };

  // Check if overdue
  const isOverdue = (nextDate: string): boolean => {
    if (!nextDate) return false;
    return new Date(nextDate) <= new Date(today);
  };

  // Format date nicely
  const formatDateFriendly = (dateStr: string): string => {
    if (!dateStr) return '-';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white mx-4 mt-6 rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header Banner */}
      <div className="bg-blue-600 px-5 py-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-blue-100 animate-spin-slow" />
          <div>
            <h3 className="font-extrabold text-sm uppercase tracking-wider">Service & Maintenance Reminders</h3>
            <p className="text-[10px] text-blue-100 font-medium">Motor, tanki aur filter ki timely service manage karein</p>
          </div>
        </div>
        {!isFormOpen && (
          <button
            type="button"
            onClick={handleOpenAdd}
            className="bg-white/20 hover:bg-white/30 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Naya Alert</span>
          </button>
        )}
      </div>

      <div className="p-4">
        {/* Inline Form */}
        {isFormOpen && (
          <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-4 space-y-3.5 animate-in slide-in-from-top duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
              <span className="font-extrabold text-xs text-slate-700 uppercase tracking-wide">
                {editingId ? '✏️ Edit Reminder' : '➕ Naya Maintenance Alert'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingId(null);
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Title */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Alert Name / Task</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Tanki Saaf Karna, Motor Service"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Last Done Date */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Last Done Date</label>
                  <input
                    type="date"
                    required
                    value={lastDoneDate}
                    onChange={(e) => setLastDoneDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                  />
                </div>

                {/* Interval Days */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Interval (Frequecy Days)</label>
                  <select
                    value={intervalDays}
                    onChange={(e) => setIntervalDays(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                  >
                    <option value="15">Har 15 Din (Bi-weekly)</option>
                    <option value="30">Har 30 Din (Monthly)</option>
                    <option value="45">Har 45 Din (1.5 Months)</option>
                    <option value="60">Har 60 Din (2 Months)</option>
                    <option value="90">Har 90 Din (Quarterly)</option>
                    <option value="180">Har 180 Din (Half Yearly)</option>
                    <option value="365">Har 365 Din (Yearly)</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Notes / Description (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Kuch jaruri note ya details..."
                  rows={2}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingId(null);
                }}
                className="bg-slate-200 text-slate-600 font-extrabold px-3 py-2 rounded-xl text-xs hover:bg-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white font-extrabold px-4 py-2 rounded-xl text-xs hover:bg-blue-700 transition-colors cursor-pointer shadow-sm shadow-blue-500/10"
              >
                Save Alert
              </button>
            </div>
          </form>
        )}

        {/* Reminders List */}
        {reminders.length === 0 ? (
          <div className="text-center py-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center px-4">
            <HelpCircle className="w-10 h-10 text-slate-300 mb-2 animate-pulse" />
            <p className="text-xs text-slate-500 font-semibold">Koi active reminders nahi hain.</p>
            <p className="text-[10px] text-slate-400 mt-1 max-w-[280px] leading-relaxed mb-4">
              Aap motor clean, RO filter change aur tank cleaning automatic alerts set kar sakte hain.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleOpenAdd}
                className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-extrabold px-3.5 py-2 rounded-xl text-xs transition-all active:scale-95 cursor-pointer shadow-sm"
              >
                ➕ Custom Alert Add Karein
              </button>
              <button
                type="button"
                onClick={handleLoadDefaults}
                className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs transition-all active:scale-95 cursor-pointer shadow-sm"
              >
                ⚙️ Predefined Defaults Load Karein
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            {reminders.map(r => {
              const overdue = isOverdue(r.nextDueDate);
              return (
                <div
                  key={r.id}
                  className={`border rounded-2xl p-3.5 flex flex-col justify-between gap-3 transition-all ${
                    overdue 
                      ? 'bg-red-50/40 border-red-200 hover:border-red-300 shadow-sm shadow-red-500/5' 
                      : 'bg-slate-50/50 border-slate-100/80 hover:bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="font-black text-slate-800 text-xs sm:text-sm">{r.title}</span>
                        {overdue ? (
                          <span className="bg-red-100 text-red-700 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            Overdue!
                          </span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-bold px-2 py-0.5 rounded-full">
                            Safe
                          </span>
                        )}
                      </div>
                      {r.notes && (
                        <p className="text-slate-400 text-[10px] mt-1 leading-normal italic font-medium">
                          📝 {r.notes}
                        </p>
                      )}
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(r)}
                        className="p-1.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer shadow-sm"
                        title="Edit Reminder"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Kya aap ye reminder hatana chahte ho?')) {
                            onDeleteReminder(r.id);
                          }
                        }}
                        className="p-1.5 bg-white border border-slate-200 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all cursor-pointer shadow-sm"
                        title="Delete Reminder"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Dates Banner */}
                  <div className="bg-white/80 border border-slate-100 p-2.5 rounded-xl flex flex-wrap gap-x-4 gap-y-2 items-center justify-between text-[11px] font-medium text-slate-600 shadow-inner">
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="text-slate-400 font-bold block text-[9px] uppercase tracking-wide">Last Done</span>
                        <span className="text-slate-700 font-bold">📅 {formatDateFriendly(r.lastDoneDate)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block text-[9px] uppercase tracking-wide">Frequency</span>
                        <span className="text-blue-700 font-extrabold">🔁 Har {r.intervalDays} Din</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block text-[9px] uppercase tracking-wide">Next Due</span>
                        <span className={`${overdue ? 'text-red-600 font-black' : 'text-slate-700 font-bold'}`}>
                          ⏰ {formatDateFriendly(r.nextDueDate)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleMarkDoneToday(r)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-1.5 rounded-xl text-[10px] flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-sm shadow-emerald-500/5 ml-auto sm:ml-0"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Done Today</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
