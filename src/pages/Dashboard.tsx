import React, { useState } from 'react';
import { useAppStore, fmt, computeBalance } from '@/store/AppContext';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';
import { Wallet, TrendingUp, AlertCircle, ArrowRight, Settings, ArrowDownLeft, ArrowUpRight, Landmark, PiggyBank, ShieldCheck, Vault, HandCoins, Plane } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Page } from '@/types';

const tileVariants = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.25 } }),
};

const obligationRouteMap: Record<string, Page> = {
  GOLD: 'loans', SHG: 'loans', PERSONAL: 'loans', HOME: 'loans',
  SIP: 'sip', INSURANCE: 'insurance', SAVINGS: 'savings',
};

function isCurrentMonth(dateStr: string | null | undefined): boolean {
  if (!dateStr) return true;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

const Dashboard: React.FC = () => {
  const store = useAppStore();
  const { startingBalance, incomeLogs, liabilities, expenses, handyLoans, prefs } = store;
  const setPage = useAppStore(s => s.setPage);
  const setStartingBalance = useAppStore(s => s.setStartingBalance);
  const [balOpen, setBalOpen] = useState(false);
  const [balInput, setBalInput] = useState('');

  const balance = computeBalance(startingBalance, incomeLogs, liabilities, expenses, handyLoans);
  const totalIncome = incomeLogs.reduce((s, e) => s + e.amount, 0);

  const cur = prefs.currency;
  const isPositive = balance >= 0;
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Only show UNPAID obligations that are due this calendar month
  // For liabilities with a due_day, show if the current day >= due_day (it's due now)
  // For liabilities without due_day, show if created this month
  // Exclude settled (PAID) items, zero-balance savings goals, and non-recurring historical items
  const pendingLiabilities = liabilities.filter(l => {
    if (l.status !== 'UNPAID') return false;
    // Skip savings goals that have reached their target
    if (l.category === 'SAVINGS' && l.target_amount > 0 && l.current_saved >= l.target_amount) return false;
    // Skip zero-amount items
    if (l.amount === 0 && l.category !== 'SAVINGS') return false;
    // If it has a due_day, it's a recurring monthly obligation — always show as pending
    if (l.due_day != null) return true;
    // For SIPs with sip_date, always show as pending (monthly recurring)
    if (l.category === 'SIP' && l.sip_date != null) return true;
    // For insurance with renewal_date, show if renewal is this month or past due
    if (l.category === 'INSURANCE' && l.renewal_date) return isCurrentMonth(l.renewal_date);
    // For non-recurring items, only show if created this month
    return true;
  });

  const pendingHandy = handyLoans.filter(h => h.status === 'UNPAID' && h.amount > 0);

  const pendingTotal = pendingLiabilities.reduce((s, l) => s + l.amount, 0);

  const submitBal = () => {
    setStartingBalance(Number(balInput) || 0);
    setBalInput('');
    setBalOpen(false);
  };

  const allPending = [
    ...pendingLiabilities.map(l => ({ id: l.id, title: l.title, amount: l.amount, category: l.category, type: 'liability' as const })),
    ...pendingHandy.map(h => ({ id: h.id, title: h.person_name, amount: h.amount, category: h.is_lent ? 'LENT' : 'BORROWED', type: 'handy' as const })),
  ];

  return (
    <div className="space-y-5 page-enter">
      {/* Live Balance Hero */}
      <motion.div initial="hidden" animate="show" custom={0} variants={tileVariants}
        className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <p className="text-emerald-400 text-sm font-medium">Live Net Balance</p>
            <button onClick={() => setBalOpen(true)} className="text-slate-400 hover:text-white"><Settings size={18} /></button>
          </div>
          <h1 className={`text-4xl font-bold mt-2 ${isPositive ? 'text-white' : 'text-rose-400'}`}>{fmt(balance, cur)}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
              {isPositive ? 'Positive' : 'Negative'}
            </span>
            <p className="text-slate-400 text-xs">Starting: {fmt(startingBalance, cur)}</p>
          </div>
        </div>
      </motion.div>

      {/* Two key stats */}
      <motion.div initial="hidden" animate="show" custom={1} variants={tileVariants} className="grid grid-cols-1 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0"><TrendingUp size={22} /></div>
          <div className="flex-1">
            <p className="text-xs text-slate-500 uppercase font-medium">Total Monthly Income</p>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{fmt(totalIncome, cur)}</p>
          </div>
          <button onClick={() => setPage('salary')} className="text-slate-400 hover:text-emerald-600 active:scale-90 transition-transform"><ArrowRight size={20} /></button>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0"><AlertCircle size={22} /></div>
          <div className="flex-1">
            <p className="text-xs text-slate-500 uppercase font-medium">Pending Unpaid Obligations</p>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{fmt(pendingTotal, cur)}</p>
          </div>
          <span className="text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-900/30 px-2 py-1 rounded-full">{allPending.length} items</span>
        </div>
      </motion.div>

      {/* Pending items list — clickable to route */}
      {allPending.length > 0 && (
        <motion.div initial="hidden" animate="show" custom={2} variants={tileVariants}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Pending Obligations</h3>
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full font-semibold">Due this month</span>
          </div>
          <div className="divide-y divide-slate-50">
            {allPending.map(item => {
              const route = item.type === 'handy' ? 'handy' : (obligationRouteMap[item.category] ?? 'loans');
              return (
                <motion.button
                  key={item.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPage(route)}
                  className="w-full flex items-center justify-between p-3 text-left active:bg-slate-50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <StatusBadge status="UNPAID" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{item.title}</p>
                      <p className="text-xs text-slate-400">{item.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-semibold text-slate-900">{fmt(item.amount, cur)}</span>
                    <ArrowRight size={14} className="text-slate-300" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Quick nav tiles — 3D glassmorphic */}
      <div>
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-3">All Modules</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'sip', label: 'SIP', icon: PiggyBank, gradient: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-500/30', ring: 'ring-emerald-400/20' },
            { id: 'insurance', label: 'Insurance', icon: ShieldCheck, gradient: 'from-blue-600 to-indigo-700', glow: 'shadow-blue-500/30', ring: 'ring-blue-400/20' },
            { id: 'savings', label: 'Savings', icon: Vault, gradient: 'from-cyan-500 to-teal-600', glow: 'shadow-cyan-500/30', ring: 'ring-cyan-400/20' },
            { id: 'loans', label: 'Loans', icon: Landmark, gradient: 'from-amber-500 to-orange-700', glow: 'shadow-amber-500/30', ring: 'ring-amber-400/20' },
            { id: 'handy', label: 'Handy', icon: HandCoins, gradient: 'from-violet-500 to-purple-700', glow: 'shadow-violet-500/30', ring: 'ring-violet-400/20' },
            { id: 'trips', label: 'Trips', icon: Plane, gradient: 'from-orange-500 to-rose-600', glow: 'shadow-orange-500/30', ring: 'ring-orange-400/20' },
          ].map((t, i) => {
            const Icon = t.icon;
            return (
              <motion.button
                key={t.id}
                initial="hidden" animate="show" custom={i + 3} variants={tileVariants}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPage(t.id as Page)}
                className={`relative rounded-2xl p-3 text-center flex flex-col items-center gap-2 bg-gradient-to-br ${t.gradient} shadow-xl ${t.glow} ring-1 ${t.ring} hover:-translate-y-2 hover:scale-[1.02] active:scale-95 transition-all duration-300 hover:shadow-2xl overflow-hidden group`}
              >
                {/* Water ripple backdrop */}
                <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300 rounded-2xl" />
                <span className="absolute -top-6 -right-6 w-16 h-16 bg-white/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
                <div className="relative w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
                  <Icon size={18} strokeWidth={2.2} />
                </div>
                <span className="relative font-semibold text-white text-xs drop-shadow">{t.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <Modal open={balOpen} onClose={() => setBalOpen(false)} title="Set Starting Balance">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Enter your current bank balance. Income increases this; paid obligations and expenses decrease it.</p>
          <input type="number" value={balInput} onChange={e => setBalInput(e.target.value)} placeholder={String(startingBalance)} className="w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none" />
          <button onClick={submitBal} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700">Update Balance</button>
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;
