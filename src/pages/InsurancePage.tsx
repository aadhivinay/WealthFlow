import React, { useState } from 'react';
import { useAppStore, fmt } from '@/store/AppContext';
import Modal from '@/components/Modal';
import StatusBadge from '@/components/StatusBadge';
import { Plus, Trash2, Shield } from 'lucide-react';
import DocumentVault from '@/components/DocumentVault';
import { motion } from 'framer-motion';

const InsurancePage: React.FC = () => {
  const liabilities = useAppStore(s => s.liabilities);
  const addLiability = useAppStore(s => s.addLiability);
  const toggleLiability = useAppStore(s => s.toggleLiability);
  const deleteLiability = useAppStore(s => s.deleteLiability);
  const currency = useAppStore(s => s.prefs.currency);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ policyName: '', insurer: '', premium: '', renewalDate: '', coverageAmount: '' });

  const policies = liabilities.filter(l => l.category === 'INSURANCE');
  const totalPremium = policies.reduce((s, e) => s + e.amount, 0);
  const totalCoverage = policies.reduce((s, e) => s + (e.coverage_amount ?? 0), 0);
  const pendingTotal = policies.filter(i => i.status === 'UNPAID').reduce((s, e) => s + e.amount, 0);

  const submit = async () => {
    if (!form.policyName || !form.premium) return;
    addLiability({ category: 'INSURANCE', title: form.policyName, amount: Number(form.premium), coverage_amount: Number(form.coverageAmount) || 0, renewal_date: form.renewalDate || null });
    setForm({ policyName: '', insurer: '', premium: '', renewalDate: '', coverageAmount: '' });
    setOpen(false);
  };

  return (
    <div className="space-y-5 page-enter">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-slate-900">Parental Insurance</h2><p className="text-xs text-slate-500">Premiums, coverage, claim tracking</p></div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setOpen(true)} className="flex items-center gap-1.5 bg-purple-600 text-white px-3.5 py-2.5 rounded-xl text-sm font-semibold"><Plus size={18} /> Add</motion.button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100"><p className="text-[10px] text-slate-500 uppercase font-medium">Premium</p><p className="text-lg font-bold text-purple-600 mt-1">{fmt(totalPremium, currency)}</p></div>
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100"><p className="text-[10px] text-slate-500 uppercase font-medium">Coverage</p><p className="text-lg font-bold text-slate-900 mt-1">{fmt(totalCoverage, currency)}</p></div>
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100"><p className="text-[10px] text-slate-500 uppercase font-medium">Pending</p><p className="text-lg font-bold text-rose-600 mt-1">{fmt(pendingTotal, currency)}</p></div>
      </div>

      {policies.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 px-4 py-10 text-center text-slate-400 text-sm"><Shield size={28} className="mx-auto mb-2 opacity-50" />No policies yet. Tap "Add" to start tracking.</div>
      ) : (
        <div className="space-y-3">
          {policies.map(ins => (
            <div key={ins.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"><Shield size={16} /></div>
                  <div><h4 className="font-semibold text-slate-900 text-sm">{ins.title}</h4><p className="text-xs text-slate-500">Renewal: {ins.renewal_date ?? '—'}</p></div>
                </div>
                <StatusBadge status={ins.status} />
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div><p className="text-[10px] text-slate-400">Premium</p><p className="font-semibold text-slate-900 text-sm">{fmt(ins.amount, currency)}</p></div>
                <div><p className="text-[10px] text-slate-400">Coverage</p><p className="font-semibold text-slate-900 text-sm">{fmt(ins.coverage_amount ?? 0, currency)}</p></div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button onClick={() => toggleLiability(ins.id)} className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${ins.status === 'UNPAID' ? 'bg-purple-600 text-white active:scale-95' : 'bg-slate-100 text-slate-600'}`}>{ins.status === 'UNPAID' ? 'Mark Paid' : 'Mark Unpaid'}</button>
                <button onClick={() => deleteLiability(ins.id)} className="p-2 rounded-xl text-slate-300 hover:text-rose-500"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <DocumentVault moduleType="insurance" accentClass="bg-purple-50 text-purple-700 border-purple-100" />

      <Modal open={open} onClose={() => setOpen(false)} title="Add Insurance Policy">
        <div className="space-y-4">
          <div><label className="text-sm font-medium text-slate-700">Policy Name</label><input value={form.policyName} onChange={e => setForm({ ...form, policyName: e.target.value })} placeholder="e.g. Star Health Family Floater" className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none" /></div>
          <div><label className="text-sm font-medium text-slate-700">Insurer</label><input value={form.insurer} onChange={e => setForm({ ...form, insurer: e.target.value })} placeholder="e.g. Star Health" className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium text-slate-700">Premium</label><input type="number" value={form.premium} onChange={e => setForm({ ...form, premium: e.target.value })} placeholder="18500" className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-purple-500 outline-none" /></div>
            <div><label className="text-sm font-medium text-slate-700">Coverage</label><input type="number" value={form.coverageAmount} onChange={e => setForm({ ...form, coverageAmount: e.target.value })} placeholder="500000" className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-purple-500 outline-none" /></div>
          </div>
          <div><label className="text-sm font-medium text-slate-700">Renewal Date</label><input type="date" value={form.renewalDate} onChange={e => setForm({ ...form, renewalDate: e.target.value })} className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-purple-500 outline-none" /></div>
          <button onClick={submit} className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700">Add Policy</button>
        </div>
      </Modal>
    </div>
  );
};

export default InsurancePage;
