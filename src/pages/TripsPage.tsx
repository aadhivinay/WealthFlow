import React, { useState } from 'react';
import { useAppStore, fmt } from '@/store/AppContext';
import Modal from '@/components/Modal';
import { Plus, Trash2, Plane, MapPin } from 'lucide-react';
import DocumentVault from '@/components/DocumentVault';
import { motion } from 'framer-motion';

const TripsPage: React.FC = () => {
  const expenses = useAppStore(s => s.expenses);
  const addExpense = useAppStore(s => s.addExpense);
  const deleteExpense = useAppStore(s => s.deleteExpense);
  const currency = useAppStore(s => s.prefs.currency);
  const [open, setOpen] = useState(false);
  const [expOpen, setExpOpen] = useState<string | null>(null);
  const [form, setForm] = useState({ tripName: '', budget: '' });
  const [expForm, setExpForm] = useState({ title: '', amount: '', category: 'Transport' });

  const tripExpenses = expenses.filter(e => e.module_type === 'TRIP');
  const tripNames = [...new Set(tripExpenses.map(e => e.trip_name).filter(Boolean))] as string[];

  const submit = async () => {
    if (!form.tripName) return;
    addExpense(`Trip: ${form.tripName}`, Number(form.budget) || 0, 'Budget', 'TRIP', form.tripName);
    setForm({ tripName: '', budget: '' });
    setOpen(false);
  };

  const addTripExpense = async (tripName: string) => {
    if (!expForm.title || !expForm.amount) return;
    addExpense(expForm.title, Number(expForm.amount), expForm.category, 'TRIP', tripName);
    setExpForm({ title: '', amount: '', category: 'Transport' });
    setExpOpen(null);
  };

  return (
    <div className="space-y-5 page-enter">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-slate-900">Trip Expenses</h2><p className="text-xs text-slate-500">Trip budgets & expense tracking</p></div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setOpen(true)} className="flex items-center gap-1.5 bg-pink-600 text-white px-3.5 py-2.5 rounded-xl text-sm font-semibold"><Plus size={18} /> Add Trip</motion.button>
      </div>

      {tripNames.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 px-4 py-10 text-center text-slate-400 text-sm"><Plane size={28} className="mx-auto mb-2 opacity-50" />No trips yet. Tap "Add Trip" to create one.</div>
      ) : (
        <div className="space-y-3">
          {tripNames.map(tripName => {
            const tripItems = tripExpenses.filter(e => e.trip_name === tripName);
            const budgetItem = tripItems.find(e => e.category === 'Budget');
            const budget = budgetItem?.amount ?? 0;
            const spentItems = tripItems.filter(e => e.category !== 'Budget');
            const spent = spentItems.reduce((s, e) => s + e.amount, 0);
            const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
            return (
              <div key={tripName} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center"><Plane size={16} /></div>
                    <div><h4 className="font-semibold text-slate-900 text-sm">{tripName}</h4><p className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={10} /> {spentItems.length} expenses</p></div>
                  </div>
                  {budgetItem && <button onClick={() => deleteExpense(budgetItem.id)} className="p-2 rounded-xl text-slate-300 hover:text-rose-500"><Trash2 size={16} /></button>}
                </div>
                {budget > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1"><span className="text-slate-600">{fmt(spent, currency)} spent</span><span className="font-semibold text-slate-900">of {fmt(budget, currency)}</span></div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-rose-500' : 'bg-pink-500'}`} style={{ width: `${pct}%` }} /></div>
                  </div>
                )}
                <div className="mt-3 space-y-1.5">
                  {spentItems.map(e => (
                    <div key={e.id} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
                      <div><p className="font-medium text-slate-700 text-sm">{e.title}</p><p className="text-xs text-slate-400">{e.category} · {e.expense_date}</p></div>
                      <div className="flex items-center gap-2"><span className="font-semibold text-slate-900">{fmt(e.amount, currency)}</span><button onClick={() => deleteExpense(e.id)} className="text-slate-300 hover:text-rose-500"><Trash2 size={14} /></button></div>
                    </div>
                  ))}
                  {spentItems.length === 0 && <p className="text-xs text-slate-400 text-center py-1">No expenses logged yet</p>}
                </div>
                <button onClick={() => setExpOpen(tripName)} className="w-full mt-3 py-2 rounded-xl text-sm font-semibold bg-pink-50 text-pink-700 active:scale-95 transition-transform">Add Expense</button>
              </div>
            );
          })}
        </div>
      )}

      <DocumentVault moduleType="trips" accentClass="bg-pink-50 text-pink-700 border-pink-100" />

      <Modal open={open} onClose={() => setOpen(false)} title="Add Trip">
        <div className="space-y-4">
          <div><label className="text-sm font-medium text-slate-700">Trip Name</label><input value={form.tripName} onChange={e => setForm({ ...form, tripName: e.target.value })} placeholder="e.g. Goa Beach Trip" className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none" /></div>
          <div><label className="text-sm font-medium text-slate-700">Total Budget</label><input type="number" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} placeholder="35000" className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none" /></div>
          <button onClick={submit} className="w-full bg-pink-600 text-white py-3 rounded-xl font-semibold hover:bg-pink-700">Add Trip</button>
        </div>
      </Modal>

      <Modal open={expOpen !== null} onClose={() => setExpOpen(null)} title="Add Trip Expense">
        <div className="space-y-4">
          <div><label className="text-sm font-medium text-slate-700">Title</label><input value={expForm.title} onChange={e => setExpForm({ ...expForm, title: e.target.value })} placeholder="e.g. Flight Tickets" className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none" /></div>
          <div><label className="text-sm font-medium text-slate-700">Category</label><select value={expForm.category} onChange={e => setExpForm({ ...expForm, category: e.target.value })} className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-pink-500 outline-none"><option>Transport</option><option>Accommodation</option><option>Food</option><option>Activities</option><option>Shopping</option><option>Other</option></select></div>
          <div><label className="text-sm font-medium text-slate-700">Amount</label><input type="number" value={expForm.amount} onChange={e => setExpForm({ ...expForm, amount: e.target.value })} placeholder="12000" className="mt-1 w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 outline-none" /></div>
          <button onClick={() => expOpen && addTripExpense(expOpen)} className="w-full bg-pink-600 text-white py-3 rounded-xl font-semibold hover:bg-pink-700">Add Expense</button>
        </div>
      </Modal>
    </div>
  );
};

export default TripsPage;
