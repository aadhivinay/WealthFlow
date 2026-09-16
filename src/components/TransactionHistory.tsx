import React, { useState, useMemo } from 'react';
import { useAppStore, fmt } from '@/store/AppContext';
import Modal from '@/components/Modal';
import { Trash2, Search, ArrowUpRight, ArrowDownLeft, History } from 'lucide-react';
import type { TransactionEntry } from '@/types';

type FilterMode = 'day' | 'month' | 'year';

interface TransactionWithBalance extends TransactionEntry {
  runningBalance: number;
}

const TransactionHistory: React.FC = () => {
  const store = useAppStore();
  const clearTransactionHistory = useAppStore(s => s.clearTransactionHistory);
  const hiddenTxnIds = useAppStore(s => s.hiddenTxnIds);
  const [filter, setFilter] = useState<FilterMode>('month');
  const [search, setSearch] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const transactions = useMemo((): TransactionEntry[] => {
    const hidden = new Set(hiddenTxnIds);
    const txns: TransactionEntry[] = [];

    store.incomeLogs.forEach(e => {
      if (hidden.has(e.id)) return;
      txns.push({ id: e.id, type: 'income', title: e.source_name, amount: e.amount, date: e.credit_date, category: 'Income', isInflow: true });
    });
    store.expenses.forEach(e => {
      if (hidden.has(e.id)) return;
      txns.push({ id: e.id, type: 'expense', title: e.title, amount: e.amount, date: e.expense_date, category: e.category ?? e.module_type, isInflow: false });
    });
    store.liabilities.filter(l => l.status === 'PAID').forEach(l => {
      if (hidden.has(l.id)) return;
      txns.push({ id: l.id, type: 'liability', title: l.title, amount: l.amount, date: new Date().toISOString().split('T')[0], category: l.category, isInflow: false });
    });
    store.handyLoans.filter(h => h.status === 'PAID').forEach(h => {
      if (hidden.has(h.id)) return;
      txns.push({ id: h.id, type: h.is_lent ? 'handy-lent' : 'handy-borrowed', title: h.person_name, amount: h.amount, date: h.due_date ?? new Date().toISOString().split('T')[0], category: h.is_lent ? 'Lent Settled' : 'Borrowed Settled', isInflow: h.is_lent });
    });

    return txns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [store.incomeLogs, store.expenses, store.liabilities, store.handyLoans, store.prefs.currency, hiddenTxnIds]);

  // Compute running balance: sort oldest-first, accumulate from startingBalance
  const transactionsWithBalance = useMemo((): TransactionWithBalance[] => {
    const oldestFirst = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let running = store.startingBalance;
    const map = new Map<string, number>();

    oldestFirst.forEach(t => {
      running += t.isInflow ? t.amount : -t.amount;
      map.set(`${t.type}-${t.id}`, running);
    });

    return transactions.map(t => ({
      ...t,
      runningBalance: map.get(`${t.type}-${t.id}`) ?? store.startingBalance,
    }));
  }, [transactions, store.startingBalance]);

  const filtered = useMemo(() => {
    const now = new Date();
    return transactionsWithBalance.filter(t => {
      const d = new Date(t.date);
      if (filter === 'day') {
        if (d.toDateString() !== now.toDateString()) return false;
      } else if (filter === 'month') {
        if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
      } else if (filter === 'year') {
        if (d.getFullYear() !== now.getFullYear()) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        if (!t.title.toLowerCase().includes(q) && !t.category.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [transactionsWithBalance, filter, search]);

  const filterTabs: { id: FilterMode; label: string }[] = [
    { id: 'day', label: 'Today' },
    { id: 'month', label: 'This Month' },
    { id: 'year', label: 'This Year' },
  ];

  const handleClear = () => {
    clearTransactionHistory();
    setConfirmOpen(false);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2"><History size={16} /> Transaction History</h3>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 px-4 pt-3">
        {filterTabs.map(t => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === t.id ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search transactions..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </div>
      </div>

      {/* Transaction list — auto-expanding scrollable container */}
      <div
        className="divide-y divide-slate-50 dark:divide-slate-700 max-h-[70vh] overflow-y-auto overscroll-contain app-scroll touch-pan-y pb-28"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {filtered.length > 0 ? (
          filtered.map(t => (
            <div key={`${t.type}-${t.id}`} className="flex items-center gap-3 p-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                t.isInflow ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              }`}>
                {t.isInflow ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{t.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                    t.isInflow ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}>{t.isInflow ? 'Inflow' : 'Outflow'}</span>
                  <span className="text-xs text-slate-400">{t.category}</span>
                  <span className="text-xs text-slate-400">{new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Updated Balance: <span className="font-semibold text-slate-600 dark:text-slate-300">{fmt(t.runningBalance, store.prefs.currency)}</span>
                </p>
              </div>
              <span className={`text-sm font-bold flex-shrink-0 ${t.isInflow ? 'text-emerald-600' : 'text-rose-500'}`}>
                {t.isInflow ? '+' : '-'}{fmt(t.amount, store.prefs.currency)}
              </span>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-slate-400 text-sm">
            <History size={24} className="mx-auto mb-2 opacity-40" />
            No transactions found
          </div>
        )}
      </div>

      {/* Clear button */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-700">
        <button
          onClick={() => setConfirmOpen(true)}
          className="w-full flex items-center justify-center gap-2 text-rose-500 text-sm font-semibold py-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
        >
          <Trash2 size={16} /> Clear Transaction History
        </button>
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Clear Transaction History?">
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Are you sure you want to clear transaction history? This will <span className="font-semibold text-slate-700 dark:text-slate-200">not</span> affect your active balances or payables.</p>
          <div className="flex gap-3">
            <button onClick={() => setConfirmOpen(false)} className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm">Cancel</button>
            <button onClick={handleClear} className="flex-1 py-3 rounded-xl bg-rose-500 text-white font-semibold text-sm">Clear History</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TransactionHistory;
