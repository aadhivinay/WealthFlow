import React, { useState } from 'react';
import { useAppStore, fmt } from '@/store/AppContext';
import Modal from '@/components/Modal';
import { Plus, Trash2, ShoppingBag } from 'lucide-react';
import DocumentVault from '@/components/DocumentVault';
import { motion } from 'framer-motion';

const ExpensesPage: React.FC = () => {
  const expenses = useAppStore(s => s.expenses);
  const addExpense = useAppStore(s => s.addExpense);
  const deleteExpense = useAppStore(s => s.deleteExpense);
  const currency = useAppStore(s => s.prefs.currency);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ category: 'Food', title: '', amount: '' });

  const exp = expenses.filter(e => e.module_type === 'EXPENSE');
  const total = exp.reduce((s, e) => s + e.amount, 0);
  const categories = ['Food', 'Utilities', 'Shopping', 'Transport', 'Entertainment', 'Health', 'Other'];

  const byCategory = categories.map(c => ({ category: c, total: exp.filter(e => e.category === c).reduce((s, e) => s + e.amount, 0), count: exp.filter(e => e.category === c).length })).filter(c => c.count > 0);
  const maxCat = Math.max(...byCategory.map(c => c.total), 1);

  const submit = async () => {
    if (!form.title || !form.amount) return;
    addExpense(form.title, Number(form.amount), form.category, 'EXPENSE');
    setForm({ category: 'Food', title: '', amount: '' });
    setOpen(false);
  };

  return (
    <div className="space-y-5 page-enter">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-slate-900">Personal Expenses</h2><p className="text-xs text-slate-500">Daily & monthly discretionary spend</p></div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setOpen(true)} className="flex items-center gap-1.5 bg-orange-600 text-white px-3.5 py-2.5 rounded-xl text-sm font-semibold"><Plus size={18} /> Add</motion.button>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <p className="text-xs text-slate-500 uppercase font-medium">Total This Month</p>
        <p className="text-2xl font-bold text-orange-600 mt-1">{fmt(total, currency)}</p>
        <p className="text-xs text-slate-500 mt-1">{exp.length} transactions</p>
      </div>

      {byCategory.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-900 text-sm mb-3">By Category</h3>
          <div className="space-y-2.5">
            {byCategory.map(c => (
              <div key={c.category}>
                <div className="flex items-center justify-between text-xs mb-1"><span className="text-slate-600">{c.category}</span><span className="font-semibold text-slate-900">{fmt(c.total, currency)}</span></div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-orange-500 rounded-full" style={{ width: `${(c.total / maxCat) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100"><h3 className="font-bold text-slate-900 text-sm">Transactions</h3></div>
        {exp.length === 0 ? (
          <div className="px-4 py-10 text-center text-slate-400 text-sm"><ShoppingBag size={28} className="mx-auto mb-2 opacity-50" />No expenses logged yet. Tap "Add" to log one.</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {exp.map(e => (
              <div key={e.id} className="flex items-center justify-between p-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0"><ShoppingBag size={16} /></div>
                  <div className="min-w-0"><p className="font-medium text-slate-900 text-sm truncate">{e.title}</p><p className="text-xs text-slate-500">{e.category} · {e.expense_date}</p></div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0"><span className="font-semibold text-rose-600 text-sm">-{fmt(e.amount, currency)}</span><button onClick={() => deleteExpense(e.id)} className="text-slate-300 hover:text-rose-500"><Trash2 size={16} /></button></div>
              </div>
            ))}
          </div>
        )}
      </div>

      <DocumentVault moduleType="expenses" accentClass="bg-orange-50 text-orange-700 border-orange-100" />

      <Modal open={open} onClose={() => setOpen(false)} title="Add Expense">
        <div className="space-y-4">
          <div><label className="text-sm font-medium text-slate-700">Category</label><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-orange-500 outline-none">{categories.map(c => <option key={c}>{c}</option>)}</select></div>
          <div><label className="text-sm font-medium text-slate-700">Title</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Zomato Order" className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none" /></div>
          <div><label className="text-sm font-medium text-slate-700">Amount</label><input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="500" className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none" /></div>
          <button onClick={submit} className="w-full bg-orange-600 text-white py-3 rounded-xl font-semibold hover:bg-orange-700">Add Expense</button>
        </div>
      </Modal>
    </div>
  );
};

export default ExpensesPage;
