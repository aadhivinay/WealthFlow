import React, { useState } from 'react';
import { useAppStore, fmt } from '@/store/AppContext';
import Modal from '@/components/Modal';
import StatusBadge from '@/components/StatusBadge';
import { Plus, Trash2, TrendingUp } from 'lucide-react';
import DocumentVault from '@/components/DocumentVault';
import { motion } from 'framer-motion';

const SIPPage: React.FC = () => {
  const liabilities = useAppStore(s => s.liabilities);
  const addLiability = useAppStore(s => s.addLiability);
  const toggleLiability = useAppStore(s => s.toggleLiability);
  const deleteLiability = useAppStore(s => s.deleteLiability);
  const updateLiability = useAppStore(s => s.updateLiability);
  const currency = useAppStore(s => s.prefs.currency);
  const [open, setOpen] = useState(false);
  const [contribOpen, setContribOpen] = useState<string | null>(null);
  const [contribAmount, setContribAmount] = useState('');
  const [form, setForm] = useState({ fundName: '', monthlyAmount: '', sipDate: '5', targetYield: '12' });

  const sips = liabilities.filter(l => l.category === 'SIP');
  const totalMonthly = sips.reduce((s, e) => s + e.amount, 0);
  const totalInvested = sips.reduce((s, e) => s + e.total_invested, 0);
  const pendingTotal = sips.filter(s => s.status === 'UNPAID').reduce((s, e) => s + e.amount, 0);

  const submit = async () => {
    if (!form.fundName || !form.monthlyAmount) return;
    addLiability({ category: 'SIP', title: form.fundName, amount: Number(form.monthlyAmount), sip_date: Number(form.sipDate), target_yield: Number(form.targetYield), total_invested: 0 });
    setForm({ fundName: '', monthlyAmount: '', sipDate: '5', targetYield: '12' });
    setOpen(false);
  };

  const addContrib = async (id: string) => {
    if (!contribAmount) return;
    const item = sips.find(s => s.id === id);
    if (!item) return;
    updateLiability(id, { total_invested: item.total_invested + Number(contribAmount) });
    setContribAmount('');
    setContribOpen(null);
  };

  return (
    <div className="space-y-5 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">SIP & Investments</h2>
          <p className="text-xs text-slate-500">Recurring SIP tracking</p>
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setOpen(true)} className="flex items-center gap-1.5 bg-blue-600 text-white px-3.5 py-2.5 rounded-xl text-sm font-semibold">
          <Plus size={18} /> Add
        </motion.button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100"><p className="text-[10px] text-slate-500 uppercase font-medium">Monthly</p><p className="text-lg font-bold text-blue-600 mt-1">{fmt(totalMonthly, currency)}</p></div>
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100"><p className="text-[10px] text-slate-500 uppercase font-medium">Invested</p><p className="text-lg font-bold text-slate-900 mt-1">{fmt(totalInvested, currency)}</p></div>
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100"><p className="text-[10px] text-slate-500 uppercase font-medium">Pending</p><p className="text-lg font-bold text-rose-600 mt-1">{fmt(pendingTotal, currency)}</p></div>
      </div>

      {sips.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 px-4 py-10 text-center text-slate-400 text-sm"><TrendingUp size={28} className="mx-auto mb-2 opacity-50" />No SIPs yet. Tap "Add" to start tracking.</div>
      ) : (
        <div className="space-y-3">
          {sips.map(s => (
            <div key={s.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="flex items-start justify-between">
                <div><h4 className="font-semibold text-slate-900 text-sm">{s.title}</h4><p className="text-xs text-slate-500 mt-0.5">SIP Date: {s.sip_date}th</p></div>
                <StatusBadge status={s.status} />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div><p className="text-[10px] text-slate-400">Monthly</p><p className="font-semibold text-slate-900 text-sm">{fmt(s.amount, currency)}</p></div>
                <div><p className="text-[10px] text-slate-400">Invested</p><p className="font-semibold text-slate-900 text-sm">{fmt(s.total_invested, currency)}</p></div>
                <div><p className="text-[10px] text-slate-400">Yield</p><p className="font-semibold text-emerald-600 text-sm">{s.target_yield ?? 0}%</p></div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button onClick={() => toggleLiability(s.id)} className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${s.status === 'UNPAID' ? 'bg-blue-600 text-white active:scale-95' : 'bg-slate-100 text-slate-600'}`}>{s.status === 'UNPAID' ? 'Mark Paid' : 'Mark Unpaid'}</button>
                <button onClick={() => setContribOpen(s.id)} className="px-3 py-2 rounded-xl text-sm font-semibold bg-blue-50 text-blue-700 active:scale-95">Invest +</button>
                <button onClick={() => deleteLiability(s.id)} className="p-2 rounded-xl text-slate-300 hover:text-rose-500"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <DocumentVault moduleType="sip" accentClass="bg-blue-50 text-blue-700 border-blue-100" />

      <Modal open={open} onClose={() => setOpen(false)} title="Add SIP">
        <div className="space-y-4">
          <div><label className="text-sm font-medium text-slate-700">Fund Name</label><input value={form.fundName} onChange={e => setForm({ ...form, fundName: e.target.value })} placeholder="e.g. Axis Bluechip Fund" className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none" /></div>
          <div><label className="text-sm font-medium text-slate-700">Monthly Amount</label><input type="number" value={form.monthlyAmount} onChange={e => setForm({ ...form, monthlyAmount: e.target.value })} placeholder="5000" className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium text-slate-700">SIP Date</label><input type="number" value={form.sipDate} onChange={e => setForm({ ...form, sipDate: e.target.value })} className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none" /></div>
            <div><label className="text-sm font-medium text-slate-700">Target Yield (%)</label><input type="number" value={form.targetYield} onChange={e => setForm({ ...form, targetYield: e.target.value })} className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none" /></div>
          </div>
          <button onClick={submit} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700">Add SIP</button>
        </div>
      </Modal>

      <Modal open={contribOpen !== null} onClose={() => setContribOpen(null)} title="Add Investment">
        <div className="space-y-4">
          <input type="number" value={contribAmount} onChange={e => setContribAmount(e.target.value)} placeholder="5000" className="w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none" />
          <button onClick={() => contribOpen && addContrib(contribOpen)} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700">Add to Investment</button>
        </div>
      </Modal>
    </div>
  );
};

export default SIPPage;
