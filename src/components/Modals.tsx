import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Phone, MapPin, Map, Package, Banknote, HelpCircle, Save, Clock, Trash2 } from 'lucide-react';
import { Customer, Delivery, Expense, PaymentRecord } from '../types';
import { todayStr, uid, calcPending } from '../utils/helpers';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function BaseModal({ isOpen, onClose, title, children }: BaseModalProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all"
    >
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[92vh] sm:max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col border border-slate-100 animate-in slide-in-from-bottom duration-200">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between z-10">
          <h3 className="text-base font-black text-blue-900 flex items-center gap-1.5">{title}</h3>
          <button
            onClick={onClose}
            className="bg-slate-50 hover:bg-slate-100 p-2 rounded-full text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="px-5 py-4 flex-1">{children}</div>
      </div>
    </div>
  );
}

// 1. CUSTOMER MODAL (Add/Edit)
interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
  onSave: (cust: Customer) => void;
}

export function CustomerModal({ isOpen, onClose, customer, onSave }: CustomerModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [mapLink, setMapLink] = useState('');
  const [jarsAtCustomer, setJarsAtCustomer] = useState(2);
  const [monthlyPlan, setMonthlyPlan] = useState(30);
  const [ratePerJar, setRatePerJar] = useState<number | ''>('');
  const [payType, setPayType] = useState<'perDelivery' | 'monthly'>('perDelivery');
  const [monthlyAmt, setMonthlyAmt] = useState<number | ''>('');
  const [agent, setAgent] = useState('');
  const [notes, setNotes] = useState('');
  const [timingPreset, setTimingPreset] = useState('');
  const [customDeliveryTime, setCustomDeliveryTime] = useState('');
  const [status, setStatus] = useState<'active' | 'closed'>('active');

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setPhone(customer.phone || '');
      setAddress(customer.address);
      setMapLink(customer.mapLink || '');
      setJarsAtCustomer(customer.jarsAtCustomer);
      setMonthlyPlan(customer.monthlyPlan);
      setRatePerJar(customer.ratePerJar || '');
      setPayType(customer.payType || 'perDelivery');
      setMonthlyAmt(customer.monthlyAmt || '');
      setAgent(customer.agent || '');
      setNotes(customer.notes || '');
      setStatus(customer.status || 'active');

      const savedTime = customer.deliveryTime || '';
      const presets = [
        'Subah 8 baje se pehle',
        'Subah 10 baje se pehle',
        'Subah 12 baje se pehle',
        'Dopahar 2 baje se pehle',
        'Shaam 5 baje se pehle',
        'Shaam 7 baje se pehle',
        'Koi bhi waqt',
      ];
      if (!savedTime) {
        setTimingPreset('');
        setCustomDeliveryTime('');
      } else if (presets.includes(savedTime)) {
        setTimingPreset(savedTime);
        setCustomDeliveryTime(savedTime);
      } else {
        setTimingPreset('custom');
        setCustomDeliveryTime(savedTime);
      }
    } else {
      setName('');
      setPhone('');
      setAddress('');
      setMapLink('');
      setJarsAtCustomer(2);
      setMonthlyPlan(30);
      setRatePerJar('');
      setPayType('perDelivery');
      setMonthlyAmt('');
      setAgent('');
      setNotes('');
      setTimingPreset('');
      setCustomDeliveryTime('');
      setStatus('active');
    }
  }, [customer, isOpen]);

  const handlePresetChange = (val: string) => {
    setTimingPreset(val);
    if (val !== 'custom') {
      setCustomDeliveryTime(val);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('Customer ka naam likhna zaroori hai!');
      return;
    }
    if (!address.trim()) {
      alert('Address likhna zaroori hai!');
      return;
    }

    const savedCustomer: Customer = {
      id: customer ? customer.id : uid(),
      name: name.trim(),
      phone: phone.trim() || undefined,
      address: address.trim(),
      mapLink: mapLink.trim() || undefined,
      agent: agent.trim() || undefined,
      notes: notes.trim() || undefined,
      deliveryTime: customDeliveryTime.trim() || undefined,
      jarsAtCustomer,
      monthlyPlan,
      ratePerJar: Number(ratePerJar) || 0,
      payType,
      monthlyAmt: payType === 'monthly' ? Number(monthlyAmt) || 0 : undefined,
      deliveries: customer ? customer.deliveries : [],
      payments: customer ? customer.payments : [],
      addedOn: customer ? customer.addedOn : todayStr(),
      status: status,
    };

    onSave(savedCustomer);
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={customer ? '✏️ Customer Edit Karo' : '➕ Naya Customer Joḍo'}
    >
      <div className="space-y-4 pb-6">
        {/* Name input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-slate-500 uppercase">👤 Customer ka Naam *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="jaise: Ramesh Patel"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50 focus:border-blue-500 focus:bg-white"
          />
        </div>

        {/* Phone input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-slate-500 uppercase">📞 Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="9876543210"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50 focus:border-blue-500 focus:bg-white"
          />
        </div>

        {/* Address textarea */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-slate-500 uppercase">📍 Address / Location *</label>
          <textarea
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="jaise: B-12 Alkapuri, near SBI Bank"
            rows={2}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50 focus:border-blue-500 focus:bg-white resize-none"
          />
        </div>

        {/* Maps Link */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-slate-500 uppercase">🗺️ Google Maps Link (optional)</label>
          <input
            type="url"
            value={mapLink}
            onChange={e => setMapLink(e.target.value)}
            placeholder="Google Maps ka share link"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50 focus:border-blue-500 focus:bg-white"
          />
        </div>

        {/* Distributed Jars Stepper */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-slate-500 uppercase">📦 Abhi unke paas kitne Jar hain?</label>
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setJarsAtCustomer(Math.max(0, jarsAtCustomer - 1))}
              className="bg-blue-50 active:bg-blue-100 font-extrabold text-lg text-blue-700 w-12 h-12 flex items-center justify-center cursor-pointer select-none border-r border-slate-200"
            >
              −
            </button>
            <input
              type="number"
              value={jarsAtCustomer}
              onChange={e => setJarsAtCustomer(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="flex-1 text-center font-extrabold text-base text-slate-800 bg-transparent border-none outline-none"
            />
            <button
              type="button"
              onClick={() => setJarsAtCustomer(jarsAtCustomer + 1)}
              className="bg-blue-50 active:bg-blue-100 font-extrabold text-lg text-blue-700 w-12 h-12 flex items-center justify-center cursor-pointer select-none border-l border-slate-200"
            >
              +
            </button>
          </div>
        </div>

        {/* Monthly Plan Stepper */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-slate-500 uppercase">📅 Monthly Plan (Kitne Jar chahiye?)</label>
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setMonthlyPlan(Math.max(0, monthlyPlan - 1))}
              className="bg-blue-50 active:bg-blue-100 font-extrabold text-lg text-blue-700 w-12 h-12 flex items-center justify-center cursor-pointer select-none border-r border-slate-200"
            >
              −
            </button>
            <input
              type="number"
              value={monthlyPlan}
              onChange={e => setMonthlyPlan(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="flex-1 text-center font-extrabold text-base text-slate-800 bg-transparent border-none outline-none"
            />
            <button
              type="button"
              onClick={() => setMonthlyPlan(monthlyPlan + 1)}
              className="bg-blue-50 active:bg-blue-100 font-extrabold text-lg text-blue-700 w-12 h-12 flex items-center justify-center cursor-pointer select-none border-l border-slate-200"
            >
              +
            </button>
          </div>
        </div>

        {/* Rate per jar */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-slate-500 uppercase">💰 Ek Jar ka Rate (₹) *</label>
          <input
            type="number"
            value={ratePerJar}
            onChange={e => setRatePerJar(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="jaise: 30"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50 focus:border-blue-500 focus:bg-white"
          />
        </div>

        {/* Payment Type selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-slate-500 uppercase">💳 Payment Ka Tarika</label>
          <select
            value={payType}
            onChange={e => setPayType(e.target.value as 'perDelivery' | 'monthly')}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50 focus:border-blue-500 focus:bg-white"
          >
            <option value="perDelivery">Har Delivery pe payment</option>
            <option value="monthly">Mahine mein ek baar (Monthly)</option>
          </select>
        </div>

        {/* Monthly Fixed Amount if monthly select */}
        {payType === 'monthly' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-slate-500 uppercase">
              📅 Monthly Fix Amount (₹) — (agar fix rate hai)
            </label>
            <input
              type="number"
              value={monthlyAmt}
              onChange={e => setMonthlyAmt(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="jaise: 900"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50 focus:border-blue-500 focus:bg-white"
            />
          </div>
        )}

        {/* Agent Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-slate-500 uppercase">🚚 Delivery Agent ka Naam</label>
          <input
            type="text"
            value={agent}
            onChange={e => setAgent(e.target.value)}
            placeholder="jaise: Suresh Bhai"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50 focus:border-blue-500 focus:bg-white"
          />
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-slate-500 uppercase">📝 Koi Note (optional)</label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="jaise: Gate band rehta hai, call karna"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50 focus:border-blue-500 focus:bg-white"
          />
        </div>

        {/* Timing selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-slate-500 uppercase">
            ⏰ Delivery Timing (Kab chahiye?)
          </label>
          <select
            value={timingPreset}
            onChange={e => handlePresetChange(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50 focus:border-blue-500 focus:bg-white mb-2"
          >
            <option value="">-- Select karein ya custom likhein --</option>
            <option value="Subah 8 baje se pehle">🌅 Subah 8 baje se pehle</option>
            <option value="Subah 10 baje se pehle">☀️ Subah 10 baje se pehle</option>
            <option value="Subah 12 baje se pehle">🕛 Subah 12 baje se pehle</option>
            <option value="Dopahar 2 baje se pehle">🕑 Dopahar 2 baje se pehle</option>
            <option value="Shaam 5 baje se pehle">🌆 Shaam 5 baje se pehle</option>
            <option value="Shaam 7 baje se pehle">🌇 Shaam 7 baje se pehle</option>
            <option value="Koi bhi waqt">🕐 Koi bhi waqt</option>
            <option value="custom">✏️ Khud Likho...</option>
          </select>

          {(timingPreset === 'custom' || !timingPreset) && (
            <input
              type="text"
              value={customDeliveryTime}
              onChange={e => setCustomDeliveryTime(e.target.value)}
              placeholder="jaise: Raat 9 baje ke baad"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50 focus:border-blue-500 focus:bg-white"
            />
          )}
        </div>

        {/* Status Dropdown */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-slate-500 uppercase">📈 Customer Status</label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value as 'active' | 'closed')}
            className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none font-bold transition-all ${
              status === 'closed'
                ? 'border-slate-300 bg-slate-100 text-slate-700'
                : 'border-emerald-200 bg-emerald-50/50 text-emerald-800 focus:border-emerald-500 focus:bg-white'
            }`}
          >
            <option value="active">🟢 Active (Inki Delivery karni hai)</option>
            <option value="closed">⚪ Closed (Inki Delivery band hai)</option>
          </select>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          className="w-full bg-gradient-to-r from-blue-700 to-sky-500 text-white py-3 rounded-xl font-bold hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
        >
          <Save className="w-4.5 h-4.5" />
          <span>💾 Customer Save Karo</span>
        </button>
      </div>
    </BaseModal>
  );
}

// 2. TIMING MODAL (Direct customer timing update)
interface TimingModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
  onSave: (custId: string, time: string) => void;
}

export function TimingModal({ isOpen, onClose, customer, onSave }: TimingModalProps) {
  const [timeText, setTimeText] = useState('');

  useEffect(() => {
    if (customer) {
      setTimeText(customer.deliveryTime || '');
    } else {
      setTimeText('');
    }
  }, [customer, isOpen]);

  const handleSave = () => {
    if (!customer) return;
    onSave(customer.id, timeText.trim());
    onClose();
  };

  const presets = [
    'Subah 8 baje se pehle',
    'Subah 10 baje se pehle',
    'Subah 12 baje se pehle',
    'Dopahar 2 baje se pehle',
    'Shaam 5 baje se pehle',
    'Shaam 7 baje se pehle',
    'Koi bhi waqt',
  ];

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="⏰ Delivery Time Set Karo">
      <div className="space-y-4 pb-6">
        {customer && (
          <div className="bg-sky-50 text-blue-800 p-3 rounded-xl font-bold text-sm flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            <span>👤 {customer.name}</span>
          </div>
        )}

        <p className="text-xs text-slate-500 leading-relaxed">
          Driver ko dikhega — is customer ke liye kis samay tak deliver karna hai.
        </p>

        {/* Presets row */}
        <div className="space-y-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
            ⚡ Quick Select
          </span>
          <div className="flex flex-wrap gap-2">
            {presets.map(p => (
              <button
                key={p}
                onClick={() => setTimeText(p)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer select-none ${
                  timeText === p
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-blue-50/50 border-blue-100 text-blue-700 hover:bg-blue-100/60'
                }`}
              >
                {p.replace(' baje se pehle', '')}
              </button>
            ))}
          </div>
        </div>

        {/* Custom text field */}
        <div className="flex flex-col gap-1.5 pt-2">
          <label className="text-xs font-black text-slate-500 uppercase">✏️ Ya Khud Likho</label>
          <input
            type="text"
            value={timeText}
            onChange={e => setTimeText(e.target.value)}
            placeholder="jaise: Raat 9 baje ke baad"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50 focus:border-blue-500 focus:bg-white"
          />
        </div>

        {/* Save button */}
        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={handleSave}
            className="w-full bg-gradient-to-r from-orange-600 to-amber-500 text-white py-3 rounded-xl font-bold hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <span>✅ Time Save Karo</span>
          </button>
          <button
            onClick={() => {
              if (customer) {
                onSave(customer.id, '');
                onClose();
              }
            }}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>⏰ Time Hatao</span>
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

// 3. DELIVERY RECORD MODAL
interface DeliverModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
  onSave: (custId: string, delivered: number, collected: number, date: string, amt: number) => void;
  role: 'owner' | 'boy' | 'kharche' | null;
}

export function DeliverModal({ isOpen, onClose, customer, onSave, role }: DeliverModalProps) {
  const [date, setDate] = useState('');
  const [delivered, setDelivered] = useState(1);
  const [collected, setCollected] = useState(0);
  const [amount, setAmount] = useState<number | ''>('');

  useEffect(() => {
    setDate(todayStr());
    setDelivered(1);
    setCollected(0);
    if (customer) {
      setAmount(customer.ratePerJar * 1);
    } else {
      setAmount('');
    }
  }, [customer, isOpen]);

  const handleDeliveredChange = (val: number) => {
    setDelivered(val);
    if (customer) {
      setAmount(customer.ratePerJar * val);
    }
  };

  const handleSave = () => {
    if (!customer) return;
    const finalAmt = role === 'boy' ? customer.ratePerJar * delivered : Number(amount) || 0;
    onSave(customer.id, delivered, collected, date || todayStr(), finalAmt);
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="📦 Delivery Record Karo">
      <div className="space-y-4 pb-6">
        {customer && (
          <div className="bg-sky-50 text-blue-800 p-3 rounded-xl font-bold text-sm flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            <span>👤 {customer.name}</span>
          </div>
        )}

        {/* Date input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-slate-500 uppercase">📅 Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50 focus:border-blue-500 focus:bg-white"
          />
        </div>

        {/* Delivered stepper */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-slate-500 uppercase">
            📦 Kitne Jar Deliver hue?
          </label>
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => handleDeliveredChange(Math.max(0, delivered - 1))}
              className="bg-blue-50 active:bg-blue-100 font-extrabold text-lg text-blue-700 w-12 h-12 flex items-center justify-center cursor-pointer select-none border-r border-slate-200"
            >
              −
            </button>
            <input
              type="number"
              value={delivered}
              onChange={e => handleDeliveredChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="flex-1 text-center font-extrabold text-base text-slate-800 bg-transparent border-none outline-none"
            />
            <button
              type="button"
              onClick={() => handleDeliveredChange(delivered + 1)}
              className="bg-blue-50 active:bg-blue-100 font-extrabold text-lg text-blue-700 w-12 h-12 flex items-center justify-center cursor-pointer select-none border-l border-slate-200"
            >
              +
            </button>
          </div>
        </div>

        {/* Collected stepper */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-slate-500 uppercase">
            🔄 Khali Jar wapas liye?
          </label>
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setCollected(Math.max(0, collected - 1))}
              className="bg-blue-50 active:bg-blue-100 font-extrabold text-lg text-blue-700 w-12 h-12 flex items-center justify-center cursor-pointer select-none border-r border-slate-200"
            >
              −
            </button>
            <input
              type="number"
              value={collected}
              onChange={e => setCollected(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="flex-1 text-center font-extrabold text-base text-slate-800 bg-transparent border-none outline-none"
            />
            <button
              type="button"
              onClick={() => setCollected(collected + 1)}
              className="bg-blue-50 active:bg-blue-100 font-extrabold text-lg text-blue-700 w-12 h-12 flex items-center justify-center cursor-pointer select-none border-l border-slate-200"
            >
              +
            </button>
          </div>
        </div>

        {/* Auto Calculated Billing Amount field (hidden in boy mode) */}
        {role !== 'boy' && customer && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-slate-500 uppercase">
              💵 Amount (₹) — (automatic update hoga, edit kar sakte ho)
            </label>
            <div className="text-xs text-emerald-700 font-black px-1 py-0.5">
              🧮 {delivered} jar × ₹{customer.ratePerJar} = ₹{delivered * customer.ratePerJar}
            </div>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="0"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50 focus:border-blue-500 focus:bg-white"
            />
          </div>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white py-3 rounded-xl font-bold hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md mt-2"
        >
          <span>✅ Delivery Save Karo</span>
        </button>
      </div>
    </BaseModal>
  );
}

// 4. EDIT PAST DELIVERY RECORD MODAL
interface EditDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
  delIndex: number | null;
  onSave: (custId: string, delIndex: number, delivered: number, collected: number, date: string, amount: number) => void;
}

export function EditDeliveryModal({ isOpen, onClose, customer, delIndex, onSave }: EditDeliveryModalProps) {
  const [date, setDate] = useState('');
  const [delivered, setDelivered] = useState(0);
  const [collected, setCollected] = useState(0);
  const [amount, setAmount] = useState<number | ''>('');

  useEffect(() => {
    if (customer && delIndex !== null) {
      const d = customer.deliveries[delIndex];
      if (d) {
        setDate(d.date);
        setDelivered(d.delivered);
        setCollected(d.collected);
        setAmount(d.amount);
      }
    }
  }, [customer, delIndex, isOpen]);

  const handleDeliveredChange = (val: number) => {
    setDelivered(val);
    if (customer) {
      setAmount(customer.ratePerJar * val);
    }
  };

  const handleSave = () => {
    if (!customer || delIndex === null) return;
    onSave(customer.id, delIndex, delivered, collected, date || todayStr(), Number(amount) || 0);
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="✏️ Entry Edit Karo">
      <div className="space-y-4 pb-6">
        {customer && (
          <div className="bg-sky-50 text-blue-800 p-3 rounded-xl font-bold text-sm flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            <span>👤 {customer.name}</span>
          </div>
        )}

        {/* Date input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-slate-500 uppercase">📅 Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50 focus:border-blue-500 focus:bg-white"
          />
        </div>

        {/* Delivered stepper */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-slate-500 uppercase">
            📦 Kitne Jar Deliver hue?
          </label>
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => handleDeliveredChange(Math.max(0, delivered - 1))}
              className="bg-blue-50 active:bg-blue-100 font-extrabold text-lg text-blue-700 w-12 h-12 flex items-center justify-center cursor-pointer select-none border-r border-slate-200"
            >
              −
            </button>
            <input
              type="number"
              value={delivered}
              onChange={e => handleDeliveredChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="flex-1 text-center font-extrabold text-base text-slate-800 bg-transparent border-none outline-none"
            />
            <button
              type="button"
              onClick={() => handleDeliveredChange(delivered + 1)}
              className="bg-blue-50 active:bg-blue-100 font-extrabold text-lg text-blue-700 w-12 h-12 flex items-center justify-center cursor-pointer select-none border-l border-slate-200"
            >
              +
            </button>
          </div>
        </div>

        {/* Collected stepper */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-slate-500 uppercase">
            🔄 Khali Jar wapas liye?
          </label>
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setCollected(Math.max(0, collected - 1))}
              className="bg-blue-50 active:bg-blue-100 font-extrabold text-lg text-blue-700 w-12 h-12 flex items-center justify-center cursor-pointer select-none border-r border-slate-200"
            >
              −
            </button>
            <input
              type="number"
              value={collected}
              onChange={e => setCollected(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="flex-1 text-center font-extrabold text-base text-slate-800 bg-transparent border-none outline-none"
            />
            <button
              type="button"
              onClick={() => setCollected(collected + 1)}
              className="bg-blue-50 active:bg-blue-100 font-extrabold text-lg text-blue-700 w-12 h-12 flex items-center justify-center cursor-pointer select-none border-l border-slate-200"
            >
              +
            </button>
          </div>
        </div>

        {/* Amount */}
        {customer && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-slate-500 uppercase">
              💵 Amount (₹) — (automatic update hoga, edit kar sakte ho)
            </label>
            <div className="text-xs text-emerald-700 font-black px-1 py-0.5">
              🧮 {delivered} jar × ₹{customer.ratePerJar} = ₹{delivered * customer.ratePerJar}
            </div>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="0"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50 focus:border-blue-500 focus:bg-white"
            />
          </div>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          className="w-full bg-gradient-to-r from-purple-700 to-indigo-500 text-white py-3 rounded-xl font-bold hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md mt-2"
        >
          <span>💾 Entry Update Karo</span>
        </button>
      </div>
    </BaseModal>
  );
}

// 5. MONTHLY PAYMENT MODAL
interface PayModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
  onSave: (custId: string, amount: number, date: string, note: string) => void;
}

export function PayModal({ isOpen, onClose, customer, onSave }: PayModalProps) {
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [dueInfo, setDueInfo] = useState('');

  useEffect(() => {
    setDate(todayStr());
    setNote('');

    if (customer) {
      const totalDelivered = (customer.deliveries || []).reduce((s, d) => s + (d.delivered || 0), 0);
      const expectedAmt = customer.monthlyAmt
        ? customer.monthlyAmt
        : totalDelivered * (customer.ratePerJar || 0);
      const totalPaid = (customer.payments || []).reduce((s, p) => s + (p.amount || 0), 0);
      const totalReceivedDelivery = (customer.deliveries || [])
        .filter(d => d.paidStatus !== 'pending')
        .reduce((s, d) => s + (d.amount || 0), 0);
      const alreadyPaid = totalPaid + totalReceivedDelivery;
      const due = Math.max(0, expectedAmt - alreadyPaid);

      setAmount(due || '');
      setDueInfo(
        `💰 Expected: ₹${expectedAmt} &nbsp;|&nbsp; ✅ Paid: ₹${alreadyPaid} &nbsp;|&nbsp; ⚠️ Due: ₹${due}`
      );
    } else {
      setAmount('');
      setDueInfo('');
    }
  }, [customer, isOpen]);

  const handleSave = () => {
    if (!customer) return;
    const val = Number(amount) || 0;
    if (!val) {
      alert('Amount bharo!');
      return;
    }
    onSave(customer.id, val, date || todayStr(), note.trim());
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="💳 Payment Record Karo">
      <div className="space-y-4 pb-6">
        {customer && (
          <div className="bg-sky-50 text-blue-800 p-3 rounded-xl font-bold text-sm flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            <span>👤 {customer.name}</span>
          </div>
        )}

        <div
          className="bg-amber-50 text-amber-800 border border-amber-100 rounded-xl p-3 text-xs font-semibold leading-relaxed"
          dangerouslySetInnerHTML={{ __html: dueInfo }}
        ></div>

        {/* Date input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-slate-500 uppercase">📅 Payment Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50 focus:border-blue-500 focus:bg-white"
          />
        </div>

        {/* Amount */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-slate-500 uppercase">💵 Amount Liya (₹)</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="0"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50 focus:border-blue-500 focus:bg-white"
          />
        </div>

        {/* Note */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-slate-500 uppercase">📝 Note (optional)</label>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="jaise: June ka payment"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50 focus:border-blue-500 focus:bg-white"
          />
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          className="w-full bg-gradient-to-r from-purple-700 to-indigo-500 text-white py-3 rounded-xl font-bold hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md mt-2"
        >
          <span>✅ Payment Save Karo</span>
        </button>
      </div>
    </BaseModal>
  );
}

// 6. CASH PAYMENT MODAL (Quick settle from dashboard pending list)
interface CashPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
  onSave: (custId: string, amount: number, date: string, note: string) => void;
}

export function CashPayModal({ isOpen, onClose, customer, onSave }: CashPayModalProps) {
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [dueAmount, setDueAmount] = useState(0);

  useEffect(() => {
    setDate(todayStr());
    setNote('');

    if (customer) {
      const p = calcPending(customer);
      setAmount(p.total || '');
      setDueAmount(p.total);
    } else {
      setAmount('');
      setDueAmount(0);
    }
  }, [customer, isOpen]);

  const handleSave = () => {
    if (!customer) return;
    const val = Number(amount) || 0;
    if (!val) {
      alert('Amount bharo!');
      return;
    }
    onSave(customer.id, val, date || todayStr(), note.trim());
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="💵 Cash Payment Mila">
      <div className="space-y-4 pb-6">
        {customer && (
          <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl font-bold text-sm flex items-center gap-2 border border-emerald-100">
            <User className="w-4 h-4 text-emerald-600" />
            <span>👤 {customer.name}</span>
          </div>
        )}

        <div className="bg-red-50 border border-red-100 text-red-700 text-xs font-bold rounded-xl p-3 flex justify-between">
          <span>⚠️ Total outstanding:</span>
          <span>Rs. {dueAmount}</span>
        </div>

        {/* Date input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-slate-500 uppercase">📅 Payment Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50 focus:border-blue-500 focus:bg-white"
          />
        </div>

        {/* Amount */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-slate-500 uppercase">💵 Amount Mila (₹)</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="0"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50 focus:border-blue-500 focus:bg-white"
          />
        </div>

        {/* Note */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-slate-500 uppercase">📝 Note (optional)</label>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="jaise: June ka cash payment"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50 focus:border-blue-500 focus:bg-white"
          />
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white py-3 rounded-xl font-bold hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md mt-2"
        >
          <span>✅ Payment Save Karo</span>
        </button>
      </div>
    </BaseModal>
  );
}

// 7. EXPENSE MODAL (Add/Edit)
interface KharchaModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense?: Expense | null;
  onSave: (exp: Expense) => void;
}

export function KharchaModal({ isOpen, onClose, expense, onSave }: KharchaModalProps) {
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('Delivery Boy Salary');
  const [customName, setCustomName] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (expense) {
      setDate(expense.date);
      const CATS = ['Delivery Boy Salary', 'Light Bill', 'Diesel', 'Miscellaneous'];
      if (CATS.includes(expense.category)) {
        setCategory(expense.category);
        setCustomName('');
      } else {
        setCategory('Other');
        setCustomName(expense.category);
      }
      setAmount(expense.amount || '');
      setNotes(expense.notes || '');
    } else {
      setDate(todayStr());
      setCategory('Delivery Boy Salary');
      setCustomName('');
      setAmount('');
      setNotes('');
    }
  }, [expense, isOpen]);

  const handleSave = () => {
    const val = Number(amount) || 0;
    if (!val) {
      alert('Amount bharo!');
      return;
    }

    const finalCategory = category === 'Other' ? customName.trim() || 'Other' : category;

    const exp: Expense = {
      id: expense ? expense.id : uid(),
      date: date || todayStr(),
      category: finalCategory,
      amount: val,
      notes: notes.trim() || undefined,
    };

    onSave(exp);
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={expense ? '✏️ Kharcha Edit Karo' : '➕ Naya Kharcha'}
    >
      <div className="space-y-4 pb-6">
        {/* Date input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-slate-500 uppercase">📅 Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50 focus:border-blue-500 focus:bg-white"
          />
        </div>

        {/* Category dropdown */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-slate-500 uppercase">📂 Kharche ki Category</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50 focus:border-blue-500 focus:bg-white"
          >
            <option value="Delivery Boy Salary">👷 Delivery Boy Salary</option>
            <option value="Light Bill">💡 Light Bill</option>
            <option value="Diesel">⛽ Diesel</option>
            <option value="Miscellaneous">📦 Miscellaneous</option>
            <option value="Other">✏️ Other (Custom Category)</option>
          </select>
        </div>

        {/* Custom name input */}
        {category === 'Other' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-slate-500 uppercase">
              ✏️ Custom Category ka Naam
            </label>
            <input
              type="text"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              placeholder="jaise: Repair, Rent, etc."
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50 focus:border-blue-500 focus:bg-white"
            />
          </div>
        )}

        {/* Amount */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-slate-500 uppercase">💵 Amount (₹)</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="0"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50 focus:border-blue-500 focus:bg-white"
          />
        </div>

        {/* Note */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-slate-500 uppercase">📝 Note (optional)</label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="jaise: June ki salary, HP pump diesel"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50 focus:border-blue-500 focus:bg-white"
          />
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          className="w-full bg-gradient-to-r from-orange-600 to-amber-500 text-white py-3 rounded-xl font-bold hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md mt-2"
        >
          <span>💾 Kharcha Save Karo</span>
        </button>
      </div>
    </BaseModal>
  );
}

// 8. CUSTOMER PDF / EXCEL RANGE MODAL (Customer statements)
interface CustReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
  mode: 'pdf' | 'excel';
  onGenerate: (custId: string, fromDate: string, toDate: string) => void;
}

export function CustReportModal({ isOpen, onClose, customer, mode, onGenerate }: CustReportModalProps) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    const now = new Date();
    // Default current month start to today
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    setFrom(`${y}-${m}-01`);
    setTo(todayStr());
  }, [isOpen]);

  const setRangeType = (type: 'today' | 'week' | 'thismonth' | 'all') => {
    const now = new Date();
    const today = todayStr();
    if (type === 'today') {
      setFrom(today);
      setTo(today);
    } else if (type === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 6);
      setFrom(todayStrForDate(weekAgo));
      setTo(today);
    } else if (type === 'thismonth') {
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      setFrom(`${y}-${m}-01`);
      setTo(today);
    } else {
      setFrom('');
      setTo('');
    }
  };

  const todayStrForDate = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const handleGenerate = () => {
    if (!customer) return;
    onGenerate(customer.id, from, to);
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'pdf' ? '📄 Customer PDF — Date Range' : '📊 Customer Excel — Date Range'}
    >
      <div className="space-y-4 pb-6">
        {customer && (
          <div
            className={`p-3 rounded-xl font-bold text-sm flex items-center gap-2 border ${
              mode === 'pdf'
                ? 'bg-sky-50 text-blue-800 border-blue-100'
                : 'bg-emerald-50 text-emerald-800 border-emerald-100'
            }`}
          >
            <User className="w-4 h-4" />
            <span>👤 {customer.name}</span>
          </div>
        )}

        <p className="text-xs text-slate-500">Jis date range ki entries chahiye woh select karo:</p>

        {/* Date filters */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-slate-500 uppercase">📅 Se (From Date)</label>
          <input
            type="date"
            value={from}
            onChange={e => setFrom(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50 focus:border-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-slate-500 uppercase">📅 Tak (To Date)</label>
          <input
            type="date"
            value={to}
            onChange={e => setTo(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50 focus:border-blue-500 focus:bg-white"
          />
        </div>

        {/* Preset selections */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => setRangeType('today')}
            className="flex-1 min-w-[70px] bg-sky-50 border border-sky-100 text-blue-700 py-1.5 px-2 rounded-xl text-[11px] font-black cursor-pointer hover:bg-sky-100/60"
          >
            📅 Aaj
          </button>
          <button
            type="button"
            onClick={() => setRangeType('week')}
            className="flex-1 min-w-[70px] bg-emerald-50 border border-emerald-100 text-emerald-700 py-1.5 px-2 rounded-xl text-[11px] font-black cursor-pointer hover:bg-emerald-100/60"
          >
            📆 7 Din
          </button>
          <button
            type="button"
            onClick={() => setRangeType('thismonth')}
            className="flex-1 min-w-[70px] bg-amber-50 border border-amber-100 text-amber-700 py-1.5 px-2 rounded-xl text-[11px] font-black cursor-pointer hover:bg-amber-100/60"
          >
            🗓️ Is Mahine
          </button>
          <button
            type="button"
            onClick={() => setRangeType('all')}
            className="flex-1 min-w-[70px] bg-purple-50 border border-purple-100 text-purple-700 py-1.5 px-2 rounded-xl text-[11px] font-black cursor-pointer hover:bg-purple-100/60"
          >
            📋 Poora
          </button>
        </div>

        {/* Submit */}
        <button
          onClick={handleGenerate}
          className={`w-full py-3 rounded-xl font-bold hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md mt-4 text-white ${
            mode === 'pdf'
              ? 'bg-gradient-to-r from-orange-600 to-amber-500'
              : 'bg-gradient-to-r from-emerald-600 to-teal-500'
          }`}
        >
          <span>{mode === 'pdf' ? '📄 PDF Generate Karo' : '📊 Excel Download Karo'}</span>
        </button>
      </div>
    </BaseModal>
  );
}

// 9. GLOBAL RANGE PDF MODAL (Global PDF print options)
interface PdfRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (from: string, to: string) => void;
}

export function PdfRangeModal({ isOpen, onClose, onGenerate }: PdfRangeModalProps) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    setFrom(`${y}-${m}-01`);
    setTo(todayStr());
  }, [isOpen]);

  const setRangeType = (type: 'today' | 'thismonth' | 'all') => {
    const now = new Date();
    const today = todayStr();
    if (type === 'today') {
      setFrom(today);
      setTo(today);
    } else if (type === 'thismonth') {
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      setFrom(`${y}-${m}-01`);
      setTo(today);
    } else {
      setFrom('');
      setTo('');
    }
  };

  const handleGenerate = () => {
    onGenerate(from, to);
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="📄 PDF Download — Date Range">
      <div className="space-y-4 pb-6">
        <p className="text-xs text-slate-500">Jis date range ka data chahiye woh select karo:</p>

        {/* Date inputs */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-slate-500 uppercase">📅 Se (From Date)</label>
          <input
            type="date"
            value={from}
            onChange={e => setFrom(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50 focus:border-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black text-slate-500 uppercase">📅 Tak (To Date)</label>
          <input
            type="date"
            value={to}
            onChange={e => setTo(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50 focus:border-blue-500 focus:bg-white"
          />
        </div>

        {/* Preset selections */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => setRangeType('today')}
            className="flex-1 min-w-[80px] bg-sky-50 border border-sky-100 text-blue-700 py-1.5 px-2 rounded-xl text-[11px] font-black cursor-pointer hover:bg-sky-100/60"
          >
            📅 Aaj
          </button>
          <button
            type="button"
            onClick={() => setRangeType('thismonth')}
            className="flex-1 min-w-[80px] bg-emerald-50 border border-emerald-100 text-emerald-700 py-1.5 px-2 rounded-xl text-[11px] font-black cursor-pointer hover:bg-emerald-100/60"
          >
            📆 Is Mahine
          </button>
          <button
            type="button"
            onClick={() => setRangeType('all')}
            className="flex-1 min-w-[80px] bg-purple-50 border border-purple-100 text-purple-700 py-1.5 px-2 rounded-xl text-[11px] font-black cursor-pointer hover:bg-purple-100/60"
          >
            📋 Poora Data
          </button>
        </div>

        {/* Save button */}
        <button
          onClick={handleGenerate}
          className="w-full bg-gradient-to-r from-red-700 to-rose-500 text-white py-3 rounded-xl font-bold hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md mt-4"
        >
          <span>📄 PDF Generate Karo</span>
        </button>
      </div>
    </BaseModal>
  );
}
