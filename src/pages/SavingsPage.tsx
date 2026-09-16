import React, { useState } from 'react';
import { useAppStore, fmt } from '@/store/AppContext';
import Modal from '@/components/Modal';
import { Plus, Trash2, Target, PiggyBank } from 'lucide-react';
import DocumentVault from '@/components/DocumentVault';
import { motion } from 'framer-motion';

const SavingsPage: React.FC = () => {
  const liabilities = useAppStore(s => s.liabilities);
  const addLiability = useAppStore(s => s.addLiability);
  const updateLiability = useAppStore(s => s.updateLiability);
  const deleteLiability = useAppStore(s => s.deleteLiability);
  const currency = useAppStore(s => s.prefs.currency);
  const [open, setOpen] = useState(false);
  const [contribOpen, setContribOpen] = useState<string | null>(null);
  const [contribAmount, setContribAmount] = useState('');
  const [form, setForm] = useState({ goalName: '', targetAmount: '', monthlyContrib: '' });

  const goals = liabilities.filter(l => l.category === 'SAVINGS');
  const totalSaved = goals.reduce((s, g) => s + g.current_saved, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target_amount, 0);

  const submit = async () => {
    if (!form.goalName || !form.targetAmount) return;
    addLiability({ category: 'SAVINGS', title: form.goalName, amount: 0, target_amount: Number(form.targetAmount), current_saved: 0, monthly_contrib: Number(form.monthlyContrib) || 0 });
    setForm({ goalName: '', targetAmount: '', monthlyContrib: '' });
    setOpen(false);
  };

  const addContrib = async (id: string) => {
    if (!contribAmount) return;
    const item = goals.find(g => g.id === id);
    if (!item) return;
    const newSaved = item.current_saved + Number(contribAmount);
    updateLiability(id, { current_saved: newSaved, amount: newSaved, status: 'PAID' });
    setContribAmount('');
    setContribOpen(null);
  };

  return (
    <div className="space-y-5 page-enter">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-slate-900">Savings Goals</h2><p className="text-xs text-slate-500">Emergency fund & savings buckets</p></div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setOpen(true)} className="flex items-center gap-1.5 bg-teal-600 text-white px-3.5 py-2.5 rounded-xl text-sm font-semibold"><Plus size={18} /> Add</motion.button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100"><p className="text-xs text-slate-500 uppercase font-medium">Total Saved</p><p className="text-xl font-bold text-teal-600 mt-1">{fmt(totalSaved, currency)}</p></div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100"><p className="text-xs text-slate-500 uppercase font-medium">Total Target</p><p className="text-xl font-bold text-slate-900 mt-1">{fmt(totalTarget, currency)}</p></div>
      </div>

      {goals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 px-4 py-10 text-center text-slate-400 text-sm"><PiggyBank size={28} className="mx-auto mb-2 opacity-50" />No savings goals yet. Tap "Add" to create one.</div>
      ) : (
        <div className="space-y-3">
          {goals.map(g => {
            const pct = g.target_amount > 0 ? Math.min(100, (g.current_saved / g.target_amount) * 100) : 0;
            return (
              <div key={g.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">{g.title.toLowerCase().includes('emergency') ? <PiggyBank size={16} /> : <Target size={16} />}</div>
                    <div><h4 className="font-semibold text-slate-900 text-sm">{g.title}</h4><p className="text-xs text-slate-500">Monthly: {fmt(g.monthly_contrib, currency)}</p></div>
                  </div>
                  <button onClick={() => deleteLiability(g.id)} className="p-2 rounded-xl text-slate-300 hover:text-rose-500"><Trash2 size={16} /></button>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1"><span className="text-slate-600">{fmt(g.current_saved, currency)} saved</span><span className="font-semibold text-slate-900">{pct.toFixed(0)}%</span></div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-teal-400 to-teal-600 rounded-full transition-all" style={{ width: `${pct}%` }} /></div>
                  <p className="text-xs text-slate-500 mt-2">Target: {fmt(g.target_amount, currency)}</p>
                </div>
                <button onClick={() => setContribOpen(g.id)} className="w-full mt-3 py-2 rounded-xl text-sm font-semibold bg-teal-50 text-teal-700 active:scale-95 transition-transform">Add Contribution</button>
              </div>
            );
          })}
        </div>
      )}

      <DocumentVault moduleType="savings" accentClass="bg-teal-50 text-teal-700 border-teal-100" />

      <Modal open={open} onClose={() => setOpen(false)} title="Add Savings Goal">
        <div className="space-y-4">
          <div><label className="text-sm font-medium text-slate-700">Goal Name</label><input value={form.goalName} onChange={e => setForm({ ...form, goalName: e.target.value })} placeholder="e.g. Emergency Fund" className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none" /></div>
          <div><label className="text-sm font-medium text-slate-700">Target Amount</label><input type="number" value={form.targetAmount} onChange={e => setForm({ ...form, targetAmount: e.target.value })} placeholder="200000" className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none" /></div>
          <div><label className="text-sm font-medium text-slate-700">Monthly Contribution</label><input type="number" value={form.monthlyContrib} onChange={e => setForm({ ...form, monthlyContrib: e.target.value })} placeholder="5000" className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none" /></div>
          <button onClick={submit} className="w-full bg-teal-600 text-white py-3 rounded-xl font-semibold hover:bg-teal-700">Add Goal</button>
        </div>
      </Modal>

      <Modal open={contribOpen !== null} onClose={() => setContribOpen(null)} title="Add Contribution">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">This amount will be deducted from your live balance and the obligation marked as paid.</p>
          <input type="number" value={contribAmount} onChange={e => setContribAmount(e.target.value)} placeholder="5000" className="w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none" />
          <button onClick={() => contribOpen && addContrib(contribOpen)} className="w-full bg-teal-600 text-white py-3 rounded-xl font-semibold hover:bg-teal-700">Add to Goal</button>
        </div>
      </Modal>
    </div>
  );
};

export default SavingsPage;
