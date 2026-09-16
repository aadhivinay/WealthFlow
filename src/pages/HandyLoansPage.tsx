import React, { useState } from 'react';
import { useAppStore, fmt } from '@/store/AppContext';
import Modal from '@/components/Modal';
import StatusBadge from '@/components/StatusBadge';
import { Plus, Trash2, Users, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import DocumentVault from '@/components/DocumentVault';
import { motion } from 'framer-motion';

const HandyLoansPage: React.FC = () => {
  const handyLoans = useAppStore(s => s.handyLoans);
  const addHandyLoan = useAppStore(s => s.addHandyLoan);
  const toggleHandy = useAppStore(s => s.toggleHandy);
  const deleteHandy = useAppStore(s => s.deleteHandy);
  const currency = useAppStore(s => s.prefs.currency);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ personName: '', phone: '', amount: '', isLent: 'true', dueDate: '' });

  const totalLent = handyLoans.filter(h => h.is_lent).reduce((s, h) => s + (h.amount - h.partial_paid), 0);
  const totalBorrowed = handyLoans.filter(h => !h.is_lent).reduce((s, h) => s + (h.amount - h.partial_paid), 0);

  const submit = async () => {
    if (!form.personName || !form.amount) return;
    addHandyLoan({ person_name: form.personName, phone: form.phone || null, amount: Number(form.amount), is_lent: form.isLent === 'true', due_date: form.dueDate || null });
    setForm({ personName: '', phone: '', amount: '', isLent: 'true', dueDate: '' });
    setOpen(false);
  };

  return (
    <div className="space-y-5 page-enter">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-slate-900">Friends Handy Loans</h2><p className="text-xs text-slate-500">Money lent to or borrowed from friends</p></div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setOpen(true)} className="flex items-center gap-1.5 bg-indigo-600 text-white px-3.5 py-2.5 rounded-xl text-sm font-semibold"><Plus size={18} /> Add</motion.button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-1.5"><ArrowUpRight size={18} className="text-emerald-600" /><p className="text-xs text-slate-500 uppercase font-medium">Lent</p></div>
          <p className="text-xl font-bold text-emerald-600 mt-1">{fmt(totalLent, currency)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-1.5"><ArrowDownLeft size={18} className="text-rose-600" /><p className="text-xs text-slate-500 uppercase font-medium">Borrowed</p></div>
          <p className="text-xl font-bold text-rose-600 mt-1">{fmt(totalBorrowed, currency)}</p>
        </div>
      </div>

      {handyLoans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 px-4 py-10 text-center text-slate-400 text-sm"><Users size={28} className="mx-auto mb-2 opacity-50" />No handy loans yet. Tap "Add" to log one.</div>
      ) : (
        <div className="space-y-3">
          {handyLoans.map(h => (
            <div key={h.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${h.is_lent ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}><Users size={16} /></div>
                  <div><h4 className="font-semibold text-slate-900 text-sm">{h.person_name}</h4><p className="text-xs text-slate-500">{h.phone ?? '—'}</p></div>
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${h.is_lent ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{h.is_lent ? 'Lent' : 'Borrowed'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div><p className="text-[10px] text-slate-400">Amount</p><p className="font-semibold text-slate-900 text-sm">{fmt(h.amount, currency)}</p></div>
                <div><p className="text-[10px] text-slate-400">Partial Paid</p><p className="font-semibold text-slate-900 text-sm">{fmt(h.partial_paid, currency)}</p></div>
              </div>
              <div className="flex items-center justify-between mt-2"><p className="text-xs text-slate-500">Due: {h.due_date ?? '—'}</p><StatusBadge status={h.status} /></div>
              <div className="flex items-center gap-2 mt-3">
                <button onClick={() => toggleHandy(h.id)} className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${h.status === 'UNPAID' ? 'bg-indigo-600 text-white active:scale-95' : 'bg-slate-100 text-slate-600'}`}>{h.status === 'UNPAID' ? 'Mark Settled' : 'Reopen'}</button>
                <button onClick={() => deleteHandy(h.id)} className="p-2 rounded-xl text-slate-300 hover:text-rose-500"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <DocumentVault moduleType="handy" accentClass="bg-indigo-50 text-indigo-700 border-indigo-100" />

      <Modal open={open} onClose={() => setOpen(false)} title="Add Handy Loan">
        <div className="space-y-4">
          <div><label className="text-sm font-medium text-slate-700">Person Name</label><input value={form.personName} onChange={e => setForm({ ...form, personName: e.target.value })} placeholder="e.g. Rahul Sharma" className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none" /></div>
          <div><label className="text-sm font-medium text-slate-700">Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="9876543210" className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none" /></div>
          <div><label className="text-sm font-medium text-slate-700">Amount</label><input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="15000" className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none" /></div>
          <div><label className="text-sm font-medium text-slate-700">Type</label><select value={form.isLent} onChange={e => setForm({ ...form, isLent: e.target.value })} className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"><option value="true">I lent money (owed to me)</option><option value="false">I borrowed money (I owe)</option></select></div>
          <div><label className="text-sm font-medium text-slate-700">Payback Date</label><input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none" /></div>
          <button onClick={submit} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700">Add Entry</button>
        </div>
      </Modal>
    </div>
  );
};

export default HandyLoansPage;
