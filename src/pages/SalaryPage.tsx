import React, { useState } from 'react';
import { useAppStore, fmt } from '@/store/AppContext';
import Modal from '@/components/Modal';
import { Plus, Trash2, TrendingUp } from 'lucide-react';
import DocumentVault from '@/components/DocumentVault';
import { motion } from 'framer-motion';

const SalaryPage: React.FC = () => {
  const incomeLogs = useAppStore(s => s.incomeLogs);
  const addIncome = useAppStore(s => s.addIncome);
  const deleteIncome = useAppStore(s => s.deleteIncome);
  const currency = useAppStore(s => s.prefs.currency);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ source: '', amount: '', recurring: false, frequency: 'Monthly' });

  const totalIncome = incomeLogs.reduce((s, e) => s + e.amount, 0);
  const recurringTotal = incomeLogs.filter(e => e.recurring).reduce((s, e) => s + e.amount, 0);

  const submit = async () => {
    if (!form.source || !form.amount) return;
    addIncome(form.source, Number(form.amount), form.recurring, form.frequency);
    setForm({ source: '', amount: '', recurring: false, frequency: 'Monthly' });
    setOpen(false);
  };

  return (
    <div className="space-y-5 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Salary & Income</h2>
          <p className="text-xs text-slate-500">Monthly salary, bonuses, side-income</p>
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setOpen(true)} className="flex items-center gap-1.5 bg-emerald-600 text-white px-3.5 py-2.5 rounded-xl text-sm font-semibold">
          <Plus size={18} /> Add
        </motion.button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-500 uppercase font-medium">Total Income</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{fmt(totalIncome, currency)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-500 uppercase font-medium">Recurring</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{fmt(recurringTotal, currency)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100"><h3 className="font-bold text-slate-900 text-sm">Income History</h3></div>
        {incomeLogs.length === 0 ? (
          <div className="px-4 py-10 text-center text-slate-400 text-sm"><TrendingUp size={28} className="mx-auto mb-2 opacity-50" />No income entries yet. Tap "Add" to log your first salary.</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {incomeLogs.map(e => (
              <div key={e.id} className="flex items-center justify-between p-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0"><TrendingUp size={16} /></div>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 text-sm truncate">{e.source_name}</p>
                    <p className="text-xs text-slate-500">{e.credit_date}{e.recurring && ` · ${e.frequency}`}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-semibold text-emerald-600 text-sm">+{fmt(e.amount, currency)}</span>
                  <button onClick={() => deleteIncome(e.id)} className="text-slate-300 hover:text-rose-500"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <DocumentVault moduleType="salary" accentClass="bg-blue-50 text-blue-700 border-blue-100" />

      <Modal open={open} onClose={() => setOpen(false)} title="Add Income">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Source</label>
            <input value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} placeholder="e.g. Monthly Salary" className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Amount</label>
            <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="85000" className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none" />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.recurring} onChange={e => setForm({ ...form, recurring: e.target.checked })} className="w-4 h-4 rounded" /> Recurring income
          </label>
          {form.recurring && (
            <div>
              <label className="text-sm font-medium text-slate-700">Frequency</label>
              <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })} className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none">
                <option>Monthly</option><option>Quarterly</option><option>Yearly</option>
              </select>
            </div>
          )}
          <button onClick={submit} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700">Add to Balance</button>
        </div>
      </Modal>
    </div>
  );
};

export default SalaryPage;
