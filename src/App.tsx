import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Table, FileText, Send, HelpCircle, CheckCircle2, Cloud, Lock, KeyRound, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { Customer, Expense, UserRole } from './types';
import {
  loadCustomers,
  saveCustomers,
  loadStock,
  saveStock,
  loadExpenses,
  saveExpenses,
} from './utils/storage';
import { todayStr } from './utils/helpers';
import {
  exportExcel,
  exportPDF,
  downloadCustomerPDF,
  downloadCustomerExcel,
  shareOnWhatsApp,
} from './utils/exports';

import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './utils/firebase';

// Import custom components
import Header from './components/Header';
import RoleSelector from './components/RoleSelector';
import Dashboard from './components/Dashboard';
import StockSection from './components/StockSection';
import PendingPayments from './components/PendingPayments';
import CustomerCard from './components/CustomerCard';
import ExpenseSection from './components/ExpenseSection';
import DeliveryBoySection from './components/DeliveryBoySection';

// Import Modals
import {
  CustomerModal,
  TimingModal,
  DeliverModal,
  EditDeliveryModal,
  PayModal,
  CashPayModal,
  KharchaModal,
  CustReportModal,
  PdfRangeModal,
} from './components/Modals';

export default function App() {
  // Core Business Data States
  const [role, setRole] = useState<UserRole>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stock, setStock] = useState<number>(0);

  // Security / Password States
  const [isOwnerAuthenticated, setIsOwnerAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('owner_auth') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Filter States
  const [dashFromDate, setDashFromDate] = useState('');
  const [dashToDate, setDashToDate] = useState('');
  const [expFromDate, setExpFromDate] = useState('');
  const [expToDate, setExpToDate] = useState('');

  // Toast Notification States
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal Control States
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedCustomerForEdit, setSelectedCustomerForEdit] = useState<Customer | null>(null);

  const [isTimingModalOpen, setIsTimingModalOpen] = useState(false);
  const [selectedCustomerForTiming, setSelectedCustomerForTiming] = useState<Customer | null>(null);

  const [isDeliverModalOpen, setIsDeliverModalOpen] = useState(false);
  const [selectedCustomerForDeliver, setSelectedCustomerForDeliver] = useState<Customer | null>(null);

  const [isEditDeliveryModalOpen, setIsEditDeliveryModalOpen] = useState(false);
  const [selectedCustomerForEditDelivery, setSelectedCustomerForEditDelivery] = useState<Customer | null>(null);
  const [selectedDeliveryIndex, setSelectedDeliveryIndex] = useState<number | null>(null);

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedCustomerForPay, setSelectedCustomerForPay] = useState<Customer | null>(null);

  const [isCashPayModalOpen, setIsCashPayModalOpen] = useState(false);
  const [selectedCustomerForCashPay, setSelectedCustomerForCashPay] = useState<Customer | null>(null);

  const [isKharchaModalOpen, setIsKharchaModalOpen] = useState(false);
  const [selectedExpenseForEdit, setSelectedExpenseForEdit] = useState<Expense | null>(null);

  const [isCustReportModalOpen, setIsCustReportModalOpen] = useState(false);
  const [selectedCustomerForReport, setSelectedCustomerForReport] = useState<Customer | null>(null);
  const [reportMode, setReportMode] = useState<'pdf' | 'excel'>('pdf');

  const [isGlobalPdfModalOpen, setIsGlobalPdfModalOpen] = useState(false);

  // ── Lifecycles & Persistence ──
  useEffect(() => {
    // Read session role & local storage items for instant display
    const savedRole = sessionStorage.getItem('jarRole') as UserRole;
    if (savedRole) {
      setRole(savedRole);
    }
    setCustomers(loadCustomers());
    setExpenses(loadExpenses());
    setStock(loadStock());

    // Default Owner dates on start (First of month to today)
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    setDashFromDate(`${y}-${m}-01`);
    setDashToDate(todayStr());
    setExpFromDate(`${y}-${m}-01`);
    setExpToDate(todayStr());

    // ── FIRESTORE REAL-TIME SYNCHRONIZATION WITH SAFE AUTO-MIGRATION ──
    const unsubscribeCustomers = onSnapshot(
      collection(db, 'customers'),
      (snapshot) => {
        const list: Customer[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Customer);
        });

        if (list.length > 0) {
          // Sort descending by addedOn time
          list.sort((a, b) => {
            const tA = new Date(a.addedOn || 0).getTime();
            const tB = new Date(b.addedOn || 0).getTime();
            return tB - tA;
          });
          setCustomers(list);
          saveCustomers(list); // Sync backup to localStorage
        } else {
          // Firestore is empty. Check if we have existing local data to migrate
          const local = loadCustomers();
          if (local && local.length > 0) {
            console.log('Migrating local customers to empty Firestore...');
            local.forEach(async (cust) => {
              try {
                await setDoc(doc(db, 'customers', cust.id), cust);
              } catch (e) {
                console.error('Error migrating customer:', cust.id, e);
              }
            });
          } else {
            setCustomers([]);
            saveCustomers([]);
          }
        }
      },
      (error) => {
        console.error('Firestore customers sync error:', error);
      }
    );

    const unsubscribeExpenses = onSnapshot(
      collection(db, 'expenses'),
      (snapshot) => {
        const list: Expense[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Expense);
        });

        if (list.length > 0) {
          list.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
          setExpenses(list);
          saveExpenses(list); // Sync backup to localStorage
        } else {
          // Firestore is empty. Check if we have existing local expenses to migrate
          const local = loadExpenses();
          if (local && local.length > 0) {
            console.log('Migrating local expenses to empty Firestore...');
            local.forEach(async (exp) => {
              try {
                await setDoc(doc(db, 'expenses', exp.id), exp);
              } catch (e) {
                console.error('Error migrating expense:', exp.id, e);
              }
            });
          } else {
            setExpenses([]);
            saveExpenses([]);
          }
        }
      },
      (error) => {
        console.error('Firestore expenses sync error:', error);
      }
    );

    const unsubscribeStock = onSnapshot(
      doc(db, 'config', 'inventory'),
      (docSnap) => {
        if (docSnap.exists()) {
          const val = docSnap.data().stock || 0;
          setStock(val);
          saveStock(val); // Sync backup to localStorage
        } else {
          // Document does not exist. Check if we have local stock to migrate
          const local = loadStock();
          if (local > 0) {
            console.log('Migrating local stock to empty Firestore...');
            setDoc(doc(db, 'config', 'inventory'), { stock: local }).catch((e) => {
              console.error('Error migrating stock:', e);
            });
          }
        }
      },
      (error) => {
        console.error('Firestore stock sync error:', error);
      }
    );

    return () => {
      unsubscribeCustomers();
      unsubscribeExpenses();
      unsubscribeStock();
    };
  }, []);

  const handleRoleSelect = (selected: UserRole) => {
    setRole(selected);
    if (selected) {
      sessionStorage.setItem('jarRole', selected);
    } else {
      sessionStorage.removeItem('jarRole');
      // Do not clear owner_auth here so that the session remains unlocked in the active tab/window
      setPasswordInput('');
      setPasswordError(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2600);
  };

  // ── CUSTOMER OPERATIONS ──
  const handleSaveCustomer = async (cust: Customer) => {
    try {
      await setDoc(doc(db, 'customers', cust.id), cust);
      showToast('✅ Customer details cloud database mein save ho gayi!');
    } catch (error) {
      console.error('Error saving customer to Firestore:', error);
      // Fallback update to local state & storage (offline)
      const updated = [...customers];
      const idx = updated.findIndex(c => c.id === cust.id);
      if (idx !== -1) {
        updated[idx] = cust;
      } else {
        updated.unshift(cust);
      }
      setCustomers(updated);
      saveCustomers(updated);
      showToast('⚠️ Cloud save fail! Internet check karein. Local save hua.');
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('Kya aap is customer ko delete karna chahte hain?\nYeh waapis nahi aayega.')) return;
    try {
      await deleteDoc(doc(db, 'customers', id));
      showToast('🗑️ Customer delete ho gaya!');
    } catch (error) {
      console.error('Error deleting customer from Firestore:', error);
      const updated = customers.filter(c => c.id !== id);
      setCustomers(updated);
      saveCustomers(updated);
      showToast('❌ Cloud delete fail! Local copy delete ho gayi.');
    }
  };

  const handleSaveTiming = async (custId: string, time: string) => {
    const cust = customers.find(c => c.id === custId);
    if (cust) {
      const updatedCust = { ...cust, deliveryTime: time };
      try {
        await setDoc(doc(db, 'customers', custId), updatedCust);
        showToast(time ? '⏰ Delivery time save ho gayi!' : '🗑️ Delivery time hata di!');
      } catch (error) {
        console.error('Error saving timing to Firestore:', error);
        showToast('❌ Cloud save fail! Timing cloud par update nahi ho saki.');
      }
    }
  };

  // ── STOCK MANAGEMENT ──
  const handleStockChange = async (val: number) => {
    try {
      await setDoc(doc(db, 'config', 'inventory'), { stock: val });
    } catch (error) {
      console.error('Error saving stock to Firestore:', error);
      setStock(val);
      saveStock(val);
      showToast('❌ Cloud save fail! Stock level cloud par update nahi hua.');
    }
  };

  // ── DELIVERY BILLING OPERATIONS ──
  const handleSaveDelivery = async (
    custId: string,
    delivered: number,
    collected: number,
    date: string,
    amt: number
  ) => {
    const cust = customers.find(c => c.id === custId);
    if (cust) {
      const newDelivery = {
        date,
        delivered,
        collected,
        amount: amt,
        paidStatus: role === 'boy' ? ('pending' as const) : ('paid' as const),
      };
      const updatedDeliveries = [newDelivery, ...(cust.deliveries || [])];
      const updatedJars = Math.max(0, (cust.jarsAtCustomer || 0) + delivered - collected);
      const updatedCust = {
        ...cust,
        deliveries: updatedDeliveries,
        jarsAtCustomer: updatedJars
      };

      try {
        await setDoc(doc(db, 'customers', custId), updatedCust);
        showToast(
          `✅ ${delivered} Jar deliver hue! ${
            role === 'boy' ? `₹${amt} Owner ke hisaab mein pending` : ''
          }`
        );
      } catch (error) {
        console.error('Error saving delivery to Firestore:', error);
        showToast('❌ Cloud save fail! Delivery entry cloud par save nahi ho payi.');
      }
    }
  };

  const handleSaveEditedDelivery = async (
    custId: string,
    delIndex: number,
    delivered: number,
    collected: number,
    date: string,
    amount: number
  ) => {
    const cust = customers.find(c => c.id === custId);
    if (cust) {
      const updatedDeliveries = [...(cust.deliveries || [])];
      const oldD = updatedDeliveries[delIndex];
      if (oldD) {
        // Adjust inventory: undo previous balance, insert new balance
        const jarDiff = delivered - collected - ((oldD.delivered || 0) - (oldD.collected || 0));
        const updatedJars = Math.max(0, (cust.jarsAtCustomer || 0) + jarDiff);

        updatedDeliveries[delIndex] = {
          date,
          delivered,
          collected,
          amount,
          paidStatus: oldD.paidStatus,
        };

        const updatedCust = {
          ...cust,
          deliveries: updatedDeliveries,
          jarsAtCustomer: updatedJars
        };

        try {
          await setDoc(doc(db, 'customers', custId), updatedCust);
          showToast('✅ Delivery record entry update ho gayi!');
        } catch (error) {
          console.error('Error saving edited delivery to Firestore:', error);
          showToast('❌ Cloud save fail! Edited entry cloud par save nahi ho saki.');
        }
      }
    }
  };

  // ── CASH PAYMENTS & FIFO SETTLEMENTS ──
  const handleSavePayment = async (custId: string, amount: number, date: string, note: string) => {
    const cust = customers.find(c => c.id === custId);
    if (cust) {
      const newPayment = { date, amount, note };
      const updatedPayments = [newPayment, ...(cust.payments || [])];
      const updatedCust = { ...cust, payments: updatedPayments };

      try {
        await setDoc(doc(db, 'customers', custId), updatedCust);
        showToast(`✅ ₹${amount} payment record ho gaya!`);
      } catch (error) {
        console.error('Error saving payment to Firestore:', error);
        showToast('❌ Cloud save fail! Payment record cloud par save nahi ho saki.');
      }
    }
  };

  const handleSaveCashPayment = async (custId: string, amountPaid: number, date: string, note: string) => {
    const cust = customers.find(c => c.id === custId);
    if (cust) {
      const rate = cust.ratePerJar || 0;
      const deliveries = [...(cust.deliveries || [])].map(d => ({ ...d }));
      let remaining = amountPaid;

      deliveries.forEach((d, i) => {
        if (remaining <= 0) return;
        if (d.paidStatus !== 'pending') return;

        const dAmt = d.amount > 0 ? d.amount : (d.delivered || 0) * rate;
        if (remaining >= dAmt) {
          deliveries[i] = {
            ...d,
            paidStatus: 'paid',
            amount: dAmt
          };
          remaining -= dAmt;
        } else {
          // Part settle
          deliveries[i] = {
            ...d,
            amount: dAmt - remaining
          };
          remaining = 0;
        }
      });

      const payments = [...(cust.payments || [])];
      const actualPaid = amountPaid - remaining;
      if (actualPaid > 0) {
        payments.unshift({
          date,
          amount: actualPaid,
          note: note || 'Cash Payment (Settle)',
        });
      }

      const updatedCust = {
        ...cust,
        deliveries,
        payments
      };

      try {
        await setDoc(doc(db, 'customers', custId), updatedCust);
        showToast(`✅ ₹${amountPaid} settlement payment record ho gaya!`);
      } catch (error) {
        console.error('Error saving cash payment to Firestore:', error);
        showToast('❌ Cloud save fail! Settlement entry cloud par save nahi ho saki.');
      }
    }
  };

  // ── EXPENSE OPERATIONS ──
  const handleSaveExpense = async (exp: Expense) => {
    try {
      await setDoc(doc(db, 'expenses', exp.id), exp);
      showToast('✅ Kharcha save ho gaya!');
    } catch (error) {
      console.error('Error saving expense to Firestore:', error);
      const updated = [...expenses];
      const idx = updated.findIndex(k => k.id === exp.id);
      if (idx !== -1) {
        updated[idx] = exp;
      } else {
        updated.unshift(exp);
      }
      setExpenses(updated);
      saveExpenses(updated);
      showToast('⚠️ Cloud save fail! Internet check karein. Local save hua.');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Ye kharcha delete karna chahte ho?')) return;
    try {
      await deleteDoc(doc(db, 'expenses', id));
      showToast('🗑️ Kharcha delete ho gaya!');
    } catch (error) {
      console.error('Error deleting expense from Firestore:', error);
      const updated = expenses.filter(k => k.id !== id);
      setExpenses(updated);
      saveExpenses(updated);
      showToast('❌ Cloud delete fail! Local copy delete ho gayi.');
    }
  };

  // ── MODAL OPENS ──
  const handleOpenAddCustomer = () => {
    setSelectedCustomerForEdit(null);
    setIsCustomerModalOpen(true);
  };

  const handleOpenEditCustomer = (id: string) => {
    const c = customers.find(cust => cust.id === id);
    if (c) {
      setSelectedCustomerForEdit(c);
      setIsCustomerModalOpen(true);
    }
  };

  const handleOpenTimingModal = (id: string) => {
    const c = customers.find(cust => cust.id === id);
    if (c) {
      setSelectedCustomerForTiming(c);
      setIsTimingModalOpen(true);
    }
  };

  const handleOpenDeliverModal = (id: string) => {
    const c = customers.find(cust => cust.id === id);
    if (c) {
      setSelectedCustomerForDeliver(c);
      setIsDeliverModalOpen(true);
    }
  };

  const handleOpenEditDeliveryModal = (custId: string, delIndex: number) => {
    const c = customers.find(cust => cust.id === custId);
    if (c) {
      setSelectedCustomerForEditDelivery(c);
      setSelectedDeliveryIndex(delIndex);
      setIsEditDeliveryModalOpen(true);
    }
  };

  const handleOpenPayModal = (id: string) => {
    const c = customers.find(cust => cust.id === id);
    if (c) {
      setSelectedCustomerForPay(c);
      setIsPayModalOpen(true);
    }
  };

  const handleOpenCashPayModal = (id: string) => {
    const c = customers.find(cust => cust.id === id);
    if (c) {
      setSelectedCustomerForCashPay(c);
      setIsCashPayModalOpen(true);
    }
  };

  const handleOpenAddExpense = () => {
    setSelectedExpenseForEdit(null);
    setIsKharchaModalOpen(true);
  };

  const handleOpenEditExpense = (id: string) => {
    const exp = expenses.find(k => k.id === id);
    if (exp) {
      setSelectedExpenseForEdit(exp);
      setIsKharchaModalOpen(true);
    }
  };

  const handleOpenCustReportModal = (id: string, mode: 'pdf' | 'excel') => {
    const c = customers.find(cust => cust.id === id);
    if (c) {
      setSelectedCustomerForReport(c);
      setReportMode(mode);
      setIsCustReportModalOpen(true);
    }
  };

  // ── TRIGGERS EXPORT ──
  const handleExportExcel = () => {
    exportExcel(customers);
  };

  const handleShareOnWhatsApp = () => {
    shareOnWhatsApp(customers);
  };

  const handleGenerateGlobalPDF = (from: string, to: string) => {
    exportPDF(customers, from, to);
  };

  const handleGenerateCustReport = (custId: string, from: string, to: string) => {
    const c = customers.find(cust => cust.id === custId);
    if (!c) return;
    if (reportMode === 'pdf') {
      downloadCustomerPDF(c, from, to);
    } else {
      downloadCustomerExcel(c, from, to);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* 1. HEADER (Renders if role selected) */}
      <Header role={role} onBack={() => handleRoleSelect(null)} />

      {/* Cloud Sync Status Indicator */}
      <div className="bg-sky-50 border-b border-sky-100 py-2 px-4 flex items-center justify-between text-[11px] font-medium text-sky-700">
        <div className="flex items-center gap-1.5">
          <Cloud className="w-3.5 h-3.5 text-sky-500 shrink-0" />
          <span>Cloud Database live sync chal raha hai</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-emerald-700 font-bold tracking-wider">LIVE SYNCED</span>
        </div>
      </div>

      <main className="max-w-2xl mx-auto pb-12">
        {/* 2. SPLASH ROLE SELECTOR SCREEN */}
        {role === null && <RoleSelector onSelectRole={handleRoleSelect} />}

        {/* 2.5 OWNER PASSWORD SCREEN */}
        {role === 'owner' && !isOwnerAuthenticated && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="px-4 py-8 flex flex-col items-center justify-center min-h-[75vh]"
          >
            <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 max-w-sm w-full text-center relative overflow-hidden">
              {/* Top premium accent bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-400"></div>
              
              {/* Glow background accent */}
              <div className="absolute -top-12 -left-12 w-24 h-24 bg-blue-400/10 rounded-full blur-2xl pointer-events-none"></div>
              <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-indigo-400/10 rounded-full blur-2xl pointer-events-none"></div>

              {/* Icon with interactive ring */}
              <div className="relative mx-auto w-20 h-20 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center mb-6 text-blue-600 shadow-inner">
                <div className="absolute inset-0 bg-blue-50/50 rounded-3xl animate-pulse"></div>
                <Lock className="w-9 h-9 relative z-10" />
              </div>

              <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">
                Owner Security Code
              </h2>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed max-w-[280px] mx-auto">
                Kripya Dashboard ka surakshit password enter karke access unlock karein.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (passwordInput === 'Sat369') {
                    setIsOwnerAuthenticated(true);
                    sessionStorage.setItem('owner_auth', 'true');
                    setPasswordError(false);
                    setPasswordInput('');
                    showToast('🔓 Owner Dashboard unlocked successfully!');
                  } else {
                    setPasswordError(true);
                    showToast('❌ Galat password! Kripya sahi password enter karein.');
                  }
                }}
                className="space-y-4"
              >
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      if (passwordError) setPasswordError(false);
                    }}
                    placeholder="Srkshit password dalein..."
                    className={`w-full pl-11 pr-11 py-4 bg-slate-50/50 border rounded-2xl text-base font-semibold transition-all duration-200 focus:outline-none focus:ring-4 ${
                      passwordError
                        ? 'border-red-300 focus:ring-red-100 bg-red-50/50 text-red-900'
                        : 'border-slate-200 focus:ring-blue-50 focus:border-blue-500 text-slate-800'
                    }`}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    style={{ minWidth: '44px', minHeight: '44px' }}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <AnimatePresence>
                  {passwordError && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      className="flex items-center gap-2 justify-center text-xs text-red-600 font-bold bg-red-50 py-2.5 px-3.5 rounded-xl border border-red-100"
                    >
                      <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
                      <span>Galat password hai, dobara koshish karein!</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold py-4 px-6 rounded-2xl text-base cursor-pointer shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <span>Dashboard Kholein 🔓</span>
                </button>
              </form>

              <button
                onClick={() => handleRoleSelect(null)}
                className="mt-6 text-sm text-slate-400 font-bold hover:text-slate-600 cursor-pointer transition-colors block mx-auto underline underline-offset-4"
                style={{ minHeight: '44px', display: 'inline-flex', alignItems: 'center' }}
              >
                ← Waapis Role Select Karein
              </button>
            </div>
          </motion.div>
        )}

        {/* 3. OWNER DASHBOARD VIEW */}
        {role === 'owner' && isOwnerAuthenticated && (
          <div className="space-y-4 animate-in fade-in duration-350">
            {/* Dashboard metrics cards */}
            <Dashboard
              customers={customers}
              fromDate={dashFromDate}
              toDate={dashToDate}
              onFromDateChange={setDashFromDate}
              onToDateChange={setDashToDate}
              onClearRange={() => {
                setDashFromDate('');
                setDashToDate('');
              }}
            />

            {/* Distributed and local stock manager */}
            <StockSection
              customers={customers}
              stock={stock}
              onStockChange={handleStockChange}
            />

            {/* Outstanding invoices alerts */}
            <PendingPayments
              customers={customers}
              onOpenCashPayment={handleOpenCashPayModal}
            />

            {/* Share / export reporting bar */}
            <div className="grid grid-cols-3 gap-2 px-4 mt-4">
              <button
                onClick={handleExportExcel}
                className="bg-emerald-800 text-white font-extrabold py-3.5 px-2 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer hover:brightness-105 active:scale-[0.98] transition-all shadow-sm"
              >
                <Table className="w-4 h-4 shrink-0" />
                <span>📊 Excel</span>
              </button>

              <button
                onClick={() => setIsGlobalPdfModalOpen(true)}
                className="bg-red-800 text-white font-extrabold py-3.5 px-2 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer hover:brightness-105 active:scale-[0.98] transition-all shadow-sm"
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span>📄 PDF</span>
              </button>

              <button
                onClick={handleShareOnWhatsApp}
                className="bg-emerald-600 text-white font-extrabold py-3.5 px-2 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer hover:brightness-105 active:scale-[0.98] transition-all shadow-sm"
              >
                <Send className="w-4 h-4 shrink-0" />
                <span>💬 WhatsApp</span>
              </button>
            </div>

            {/* Add customer button bar */}
            <div className="px-4">
              <button
                onClick={handleOpenAddCustomer}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-105 text-white font-extrabold py-4 px-6 rounded-2xl shadow-md text-sm flex items-center justify-center gap-2 cursor-pointer transition-all border border-emerald-500"
                id="btn-add-customer"
              >
                <Plus className="w-5 h-5" />
                <span>➕ Naya Customer Joḍo</span>
              </button>
            </div>

            {/* Customer List block */}
            <div className="px-4 space-y-4 pb-20">
              {customers.length === 0 ? (
                <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center p-4">
                  <HelpCircle className="w-12 h-12 text-slate-300 mb-2 animate-bounce" />
                  <p className="text-sm font-semibold">Abhi koi customer added nahi hai.</p>
                  <p className="text-xs text-slate-400 mt-1">Upar diye "Naya Customer Joḍo" button se chalu karein!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-extrabold pl-1 mb-1">
                    📋 {customers.length} Active Customer{customers.length !== 1 ? 's' : ''}
                  </div>

                  {customers.map((c, i) => (
                    <CustomerCard
                      key={c.id}
                      customer={c}
                      index={i}
                      onOpenDeliver={handleOpenDeliverModal}
                      onOpenPayment={handleOpenPayModal}
                      onOpenPdfModal={id => handleOpenCustReportModal(id, 'pdf')}
                      onOpenExcelModal={id => handleOpenCustReportModal(id, 'excel')}
                      onOpenEdit={handleOpenEditCustomer}
                      onDelete={handleDeleteCustomer}
                      onOpenTimingModal={handleOpenTimingModal}
                      onOpenEditDelivery={handleOpenEditDeliveryModal}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. DELIVERY BOY VIEW */}
        {role === 'boy' && (
          <div className="animate-in fade-in duration-350">
            <DeliveryBoySection
              customers={customers}
              onOpenDeliver={handleOpenDeliverModal}
            />
          </div>
        )}

        {/* 5. KHARCHE & EXPENSES DASHBOARD */}
        {role === 'kharche' && (
          <div className="animate-in fade-in duration-350">
            <ExpenseSection
              expenses={expenses}
              customers={customers}
              fromDate={expFromDate}
              toDate={expToDate}
              onFromDateChange={setExpFromDate}
              onToDateChange={setExpToDate}
              onClearRange={() => {
                setExpFromDate('');
                setExpToDate('');
              }}
              onOpenAddExpense={handleOpenAddExpense}
              onOpenEditExpense={handleOpenEditExpense}
              onDeleteExpense={handleDeleteExpense}
            />
          </div>
        )}
      </main>

      {/* ── 6. FLOATING MODALS COMPONENT INSTANCES ── */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        customer={selectedCustomerForEdit}
        onSave={handleSaveCustomer}
      />

      <TimingModal
        isOpen={isTimingModalOpen}
        onClose={() => setIsTimingModalOpen(false)}
        customer={selectedCustomerForTiming}
        onSave={handleSaveTiming}
      />

      <DeliverModal
        isOpen={isDeliverModalOpen}
        onClose={() => setIsDeliverModalOpen(false)}
        customer={selectedCustomerForDeliver}
        onSave={handleSaveDelivery}
        role={role}
      />

      <EditDeliveryModal
        isOpen={isEditDeliveryModalOpen}
        onClose={() => setIsEditDeliveryModalOpen(false)}
        customer={selectedCustomerForEditDelivery}
        delIndex={selectedDeliveryIndex}
        onSave={handleSaveEditedDelivery}
      />

      <PayModal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        customer={selectedCustomerForPay}
        onSave={handleSavePayment}
      />

      <CashPayModal
        isOpen={isCashPayModalOpen}
        onClose={() => setIsCashPayModalOpen(false)}
        customer={selectedCustomerForCashPay}
        onSave={handleSaveCashPayment}
      />

      <KharchaModal
        isOpen={isKharchaModalOpen}
        onClose={() => setIsKharchaModalOpen(false)}
        expense={selectedExpenseForEdit}
        onSave={handleSaveExpense}
      />

      <CustReportModal
        isOpen={isCustReportModalOpen}
        onClose={() => setIsCustReportModalOpen(false)}
        customer={selectedCustomerForReport}
        mode={reportMode}
        onGenerate={handleGenerateCustReport}
      />

      <PdfRangeModal
        isOpen={isGlobalPdfModalOpen}
        onClose={() => setIsGlobalPdfModalOpen(false)}
        onGenerate={handleGenerateGlobalPDF}
      />

      {/* ── 7. ACCESSIBILITY TOAST NOTIFICATION ── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-emerald-950 text-white font-bold py-3.5 px-6 rounded-full shadow-2xl z-[999] text-xs flex items-center gap-2 border border-emerald-500/30 whitespace-nowrap"
          >
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 fill-emerald-950/50 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
