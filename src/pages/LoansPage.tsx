import React, { useState } from 'react';
import { useAppStore, fmt } from '@/store/AppContext';
import Modal from '@/components/Modal';
import StatusBadge from '@/components/StatusBadge';
import { Plus, Trash2, Landmark } from 'lucide-react';
import DocumentVault from '@/components/DocumentVault';
import { motion } from 'framer-motion';
import type { LiabilityCategory } from '@/types';

const categoryColors: Record<string, string> = { GOLD: 'bg-amber-50 text-amber-700', SHG: 'bg-cyan-50 text-cyan-700', PERSONAL: 'bg-rose-50 text-rose-700', HOME: 'bg-blue-50 text-blue-700' };

const LoansPage: React.FC = () => {
  const liabilities = useAppStore(s => s.liabilities);
  const addLiability = useAppStore(s => s.addLiability);
  const toggleLiability = useAppStore(s => s.toggleLiability);
  const deleteLiability = useAppStore(s => s.deleteLiability);
  const currency = useAppStore(s => s.prefs.currency);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ category: 'GOLD' as LiabilityCategory, title: '', principal: '', interestRate: '', emi: '', dueDay: '5', remainingTenure: '12' });

  const loanCats: LiabilityCategory[] = ['GOLD', 'SHG', 'PERSONAL', 'HOME'];
  const loans = liabilities.filter(l => loanCats.includes(l.category));
  const totalEmi = loans.reduce((s, l) => s + l.amount, 0);
  const totalPrincipal = loans.reduce((s, l) => s + (l.principal ?? 0), 0);
  const pendingEmi = loans.filter(l => l.status === 'UNPAID').reduce((s, l) => s + l.amount, 0);

  const submit = async () => {
    if (!form.title || !form.emi) return;
    addLiability({ category: form.category, title: form.title, amount: Number(form.emi), principal: Number(form.principal) || 0, interest_rate: Number(form.interestRate) || 0, due_day: Number(form.dueDay), remaining_tenure: Number(form.remainingTenure) });
    setForm({ category: 'GOLD', title: '', principal: '', interestRate: '', emi: '', dueDay: '5', remainingTenure: '12' });
    setOpen(false);
  };

  return (
    <div className="space-y-5 page-enter">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-slate-900">Loans & Liabilities</h2><p className="text-xs text-slate-500">Gold, SHG, Personal, Home loans</p></div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setOpen(true)} className="flex items-center gap-1.5 bg-rose-600 text-white px-3.5 py-2.5 rounded-xl text-sm font-semibold"><Plus size={18} /> Add</motion.button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100"><p className="text-[10px] text-slate-500 uppercase font-medium">Monthly EMI</p><p className="text-lg font-bold text-rose-600 mt-1">{fmt(totalEmi, currency)}</p></div>
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100"><p className="text-[10px] text-slate-500 uppercase font-medium">Principal</p><p className="text-lg font-bold text-slate-900 mt-1">{fmt(totalPrincipal, currency)}</p></div>
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100"><p className="text-[10px] text-slate-500 uppercase font-medium">Pending</p><p className="text-lg font-bold text-rose-600 mt-1">{fmt(pendingEmi, currency)}</p></div>
      </div>

      {loans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 px-4 py-10 text-center text-slate-400 text-sm"><Landmark size={28} className="mx-auto mb-2 opacity-50" />No loans tracked yet. Tap "Add" to start.</div>
      ) : (
        <div className="space-y-3">
          {loans.map(l => (
            <div key={l.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center"><Landmark size={16} /></div>
                  <div><h4 className="font-semibold text-slate-900 text-sm">{l.title}</h4><span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${categoryColors[l.category] ?? 'bg-slate-50 text-slate-600'}`}>{l.category}</span></div>
                </div>
                <StatusBadge status={l.status} />
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div><p className="text-[10px] text-slate-400">EMI</p><p className="font-semibold text-slate-900 text-sm">{fmt(l.amount, currency)}</p></div>
                <div><p className="text-[10px] text-slate-400">Principal</p><p className="font-semibold text-slate-900 text-sm">{fmt(l.principal ?? 0, currency)}</p></div>
                <div><p className="text-[10px] text-slate-400">Interest</p><p className="font-semibold text-slate-900 text-sm">{l.interest_rate ?? 0}%</p></div>
                <div><p className="text-[10px] text-slate-400">Tenure Left</p><p className="font-semibold text-slate-900 text-sm">{l.remaining_tenure ?? 0} mo</p></div>
              </div>
              <p className="text-xs text-slate-500 mt-2">Due: {l.due_day ?? '—'}th of every month</p>
              <div className="flex items-center gap-2 mt-3">
                <button onClick={() => toggleLiability(l.id)} className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${l.status === 'UNPAID' ? 'bg-rose-600 text-white active:scale-95' : 'bg-slate-100 text-slate-600'}`}>{l.status === 'UNPAID' ? 'Mark Paid' : 'Mark Unpaid'}</button>
                <button onClick={() => deleteLiability(l.id)} className="p-2 rounded-xl text-slate-300 hover:text-rose-500"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <DocumentVault moduleType="loans" accentClass="bg-rose-50 text-rose-700 border-rose-100" />

      <Modal open={open} onClose={() => setOpen(false)} title="Add Loan">
        <div className="space-y-4">
          <div><label className="text-sm font-medium text-slate-700">Category</label><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as LiabilityCategory })} className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-rose-500 outline-none"><option value="GOLD">Gold Loan</option><option value="SHG">SHG (Self Help Group)</option><option value="PERSONAL">Personal Loan</option><option value="HOME">Home Loan</option></select></div>
          <div><label className="text-sm font-medium text-slate-700">Title</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Gold Loan - SBI" className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium text-slate-700">Principal</label><input type="number" value={form.principal} onChange={e => setForm({ ...form, principal: e.target.value })} placeholder="150000" className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-rose-500 outline-none" /></div>
            <div><label className="text-sm font-medium text-slate-700">Interest (%)</label><input type="number" value={form.interestRate} onChange={e => setForm({ ...form, interestRate: e.target.value })} placeholder="7.5" className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-rose-500 outline-none" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-sm font-medium text-slate-700">EMI</label><input type="number" value={form.emi} onChange={e => setForm({ ...form, emi: e.target.value })} placeholder="4800" className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-rose-500 outline-none" /></div>
            <div><label className="text-sm font-medium text-slate-700">Due Day</label><input type="number" value={form.dueDay} onChange={e => setForm({ ...form, dueDay: e.target.value })} className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-rose-500 outline-none" /></div>
            <div><label className="text-sm font-medium text-slate-700">Tenure</label><input type="number" value={form.remainingTenure} onChange={e => setForm({ ...form, remainingTenure: e.target.value })} className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-rose-500 outline-none" /></div>
          </div>
          <button onClick={submit} className="w-full bg-rose-600 text-white py-3 rounded-xl font-semibold hover:bg-rose-700">Add Loan</button>
        </div>
      </Modal>
    </div>
  );
};

export default LoansPage;
