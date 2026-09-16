import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import type { Page, IncomeLog, Liability, HandyLoan, GeneralExpense, LiabilityCategory, CurrencyCode, UserPrefs, DocumentRecord } from '@/types';

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`);
const today = () => new Date().toISOString().split('T')[0];

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = { INR: '₹', USD: '$', EUR: '€' };
export const CURRENCY_LOCALES: Record<CurrencyCode, string> = { INR: 'en-IN', USD: 'en-US', EUR: 'de-DE' };

export function fmt(amount: number, currency: CurrencyCode = 'INR') {
  try {
    return new Intl.NumberFormat(CURRENCY_LOCALES[currency], { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${CURRENCY_SYMBOLS[currency]}${amount}`;
  }
}

export function computeBalance(starting: number, income: IncomeLog[], liabilities: Liability[], expenses: GeneralExpense[], handyLoans: HandyLoan[]): number {
  // Live Net Balance = Total Active Incomes - Total Paid Expenses - Paid EMIs - Lended Loans
  const totalIncome = income.reduce((s, e) => s + Math.max(0, e.amount), 0);
  const totalPaidLiabilities = liabilities.filter(l => l.status === 'PAID').reduce((s, l) => s + Math.max(0, l.amount), 0);
  const totalExpenses = expenses.filter(e => e.category !== 'Budget').reduce((s, e) => s + Math.max(0, e.amount), 0);

  // Handy loans: only ACTIVE (UNPAID) loans affect the balance.
  // Lent + active: money left your pocket → deduct from balance
  // Borrowed + active: money came to you → add to balance
  const lentActive = handyLoans.filter(h => h.is_lent && h.status === 'UNPAID').reduce((s, h) => s + Math.max(0, h.amount), 0);
  const borrowedActive = handyLoans.filter(h => !h.is_lent && h.status === 'UNPAID').reduce((s, h) => s + Math.max(0, h.amount), 0);

  return Math.max(0, starting) + totalIncome - totalPaidLiabilities - totalExpenses - lentActive + borrowedActive;
}

async function syncInsert(table: string, row: Record<string, unknown> | object) {
  try {
    const { id, ...rest } = row as Record<string, unknown>;
    void id;
    await supabase.from(table).insert(rest);
  } catch { /* offline — data stays in local store */ }
}

async function syncUpdate(table: string, id: string, data: Record<string, unknown>) {
  try { await supabase.from(table).update(data).eq('id', id); } catch { /* offline */ }
}

async function syncDelete(table: string, id: string) {
  try { await supabase.from(table).delete().eq('id', id); } catch { /* offline */ }
}

async function syncBalance(balance: number) {
  try {
    const { data: existing } = await supabase.from('account_balances').select('id').maybeSingle();
    if (existing) {
      await supabase.from('account_balances').update({ current_balance: balance, updated_at: new Date().toISOString() }).eq('id', (existing as { id: string }).id);
    } else {
      await supabase.from('account_balances').insert({ current_balance: balance });
    }
  } catch { /* offline */ }
}

interface AppStore {
  currentPage: Page;
  startingBalance: number;
  incomeLogs: IncomeLog[];
  liabilities: Liability[];
  handyLoans: HandyLoan[];
  expenses: GeneralExpense[];
  documents: DocumentRecord[];
  hiddenTxnIds: string[];
  prefs: UserPrefs;
  loading: boolean;
  synced: boolean;
  authUserId: string | null;

  setPage: (p: Page) => void;
  setStartingBalance: (n: number) => void;
  setPrefs: (p: Partial<UserPrefs>) => void;
  addIncome: (source: string, amount: number, recurring: boolean, frequency: string) => void;
  deleteIncome: (id: string) => void;
  addLiability: (data: Partial<Liability> & { category: LiabilityCategory; title: string; amount: number }) => void;
  toggleLiability: (id: string) => void;
  deleteLiability: (id: string) => void;
  updateLiability: (id: string, data: Partial<Liability>) => void;
  addHandyLoan: (data: Omit<HandyLoan, 'id' | 'partial_paid' | 'status'>) => void;
  toggleHandy: (id: string) => void;
  deleteHandy: (id: string) => void;
  addExpense: (title: string, amount: number, category: string, moduleType: 'EXPENSE' | 'TRIP', tripName?: string) => void;
  deleteExpense: (id: string) => void;
  addDocument: (doc: DocumentRecord) => void;
  deleteDocument: (id: string) => void;
  loadFromSupabase: (userId: string) => Promise<void>;
  clearUserData: () => void;
  clearTransactionHistory: () => void;
  exportData: () => string;
  importData: (json: string) => boolean;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      currentPage: 'dashboard',
      startingBalance: 0,
      incomeLogs: [],
      liabilities: [],
      handyLoans: [],
      expenses: [],
      documents: [],
      hiddenTxnIds: [],
      prefs: { fullName: '', currency: 'INR', monthlyIncomeBenchmark: 0 },
      loading: false,
      synced: false,
      authUserId: null,

      setPage: (p) => set({ currentPage: p }),

      setStartingBalance: (n) => {
        set({ startingBalance: n });
        syncBalance(n);
      },

      setPrefs: (p) => set(s => ({ prefs: { ...s.prefs, ...p } })),

      addIncome: (source, amount, recurring, frequency) => {
        const row: IncomeLog = { id: uid(), source_name: source, amount, credit_date: today(), recurring, frequency: recurring ? frequency : null };
        set(s => ({ incomeLogs: [row, ...s.incomeLogs] }));
        syncInsert('income_logs', row);
      },

      deleteIncome: (id) => {
        set(s => ({ incomeLogs: s.incomeLogs.filter(e => e.id !== id) }));
        syncDelete('income_logs', id);
      },

      addLiability: (data) => {
        const row: Liability = {
          id: uid(), category: data.category, title: data.title, amount: data.amount,
          due_day: data.due_day ?? null, status: 'UNPAID',
          interest_rate: data.interest_rate ?? null, principal: data.principal ?? null,
          remaining_tenure: data.remaining_tenure ?? null, target_yield: data.target_yield ?? null,
          coverage_amount: data.coverage_amount ?? null, renewal_date: data.renewal_date ?? null,
          total_invested: data.total_invested ?? 0, monthly_contrib: data.monthly_contrib ?? 0,
          target_amount: data.target_amount ?? 0, current_saved: data.current_saved ?? 0,
          sip_date: data.sip_date ?? null,
        };
        set(s => ({ liabilities: [row, ...s.liabilities] }));
        syncInsert('liabilities', row);
      },

      toggleLiability: (id) => {
        let newStatus: 'PAID' | 'UNPAID' = 'UNPAID';
        set(s => {
          const liabilities = s.liabilities.map(l => {
            if (l.id === id) { newStatus = l.status === 'PAID' ? 'UNPAID' : 'PAID'; return { ...l, status: newStatus }; }
            return l;
          });
          return { liabilities };
        });
        syncUpdate('liabilities', id, { status: newStatus });
      },

      deleteLiability: (id) => {
        set(s => ({ liabilities: s.liabilities.filter(l => l.id !== id) }));
        syncDelete('liabilities', id);
      },

      updateLiability: (id, data) => {
        set(s => ({ liabilities: s.liabilities.map(l => l.id === id ? { ...l, ...data } : l) }));
        syncUpdate('liabilities', id, data);
      },

      addHandyLoan: (data) => {
        const row: HandyLoan = { id: uid(), person_name: data.person_name, phone: data.phone, amount: data.amount, is_lent: data.is_lent, due_date: data.due_date, status: 'UNPAID', partial_paid: 0 };
        set(s => ({ handyLoans: [row, ...s.handyLoans] }));
        syncInsert('handy_loans', row);
      },

      toggleHandy: (id) => {
        let newStatus: 'PAID' | 'UNPAID' = 'UNPAID';
        set(s => {
          const handyLoans = s.handyLoans.map(h => {
            if (h.id === id) { newStatus = h.status === 'PAID' ? 'UNPAID' : 'PAID'; return { ...h, status: newStatus }; }
            return h;
          });
          return { handyLoans };
        });
        syncUpdate('handy_loans', id, { status: newStatus });
      },

      deleteHandy: (id) => {
        set(s => ({ handyLoans: s.handyLoans.filter(h => h.id !== id) }));
        syncDelete('handy_loans', id);
      },

      addExpense: (title, amount, category, moduleType, tripName) => {
        const row: GeneralExpense = { id: uid(), module_type: moduleType, title, amount, expense_date: today(), category, trip_name: tripName ?? null };
        set(s => ({ expenses: [row, ...s.expenses] }));
        syncInsert('general_expenses', row);
      },

      deleteExpense: (id) => {
        set(s => ({ expenses: s.expenses.filter(e => e.id !== id) }));
        syncDelete('general_expenses', id);
      },

      addDocument: (doc) => {
        set(s => ({ documents: [doc, ...s.documents] }));
        syncInsert('documents', doc);
      },

      deleteDocument: (id) => {
        const doc = get().documents.find(d => d.id === id);
        if (doc) {
          try { supabase.storage.from('documents').remove([doc.file_path]); } catch { /* offline */ }
        }
        set(s => ({ documents: s.documents.filter(d => d.id !== id) }));
        syncDelete('documents', id);
      },

      loadFromSupabase: async (userId) => {
        set({ loading: true, authUserId: userId });
        try {
          const [balRes, incomeRes, liabRes, handyRes, expRes, docRes] = await Promise.all([
            supabase.from('account_balances').select('id, current_balance').maybeSingle(),
            supabase.from('income_logs').select('*').order('created_at', { ascending: false }),
            supabase.from('liabilities').select('*').order('created_at', { ascending: false }),
            supabase.from('handy_loans').select('*').order('created_at', { ascending: false }),
            supabase.from('general_expenses').select('*').order('created_at', { ascending: false }),
            supabase.from('documents').select('*').order('created_at', { ascending: false }),
          ]);
          set({
            startingBalance: (balRes.data as { current_balance: number } | null)?.current_balance ?? 0,
            incomeLogs: (incomeRes.data as IncomeLog[]) ?? [],
            liabilities: (liabRes.data as Liability[]) ?? [],
            handyLoans: (handyRes.data as HandyLoan[]) ?? [],
            expenses: (expRes.data as GeneralExpense[]) ?? [],
            documents: (docRes.data as DocumentRecord[]) ?? [],
            synced: true, loading: false,
          });
        } catch {
          set({ synced: false, loading: false });
        }
      },

      clearUserData: () => set({
        startingBalance: 0, incomeLogs: [], liabilities: [], handyLoans: [], expenses: [], documents: [], hiddenTxnIds: [], authUserId: null,
      }),

      clearTransactionHistory: () => set(s => ({
        // Only hide transactions from the history view — do NOT touch active data
        hiddenTxnIds: [
          ...s.incomeLogs.map(e => e.id),
          ...s.expenses.map(e => e.id),
          ...s.liabilities.filter(l => l.status === 'PAID').map(l => l.id),
          ...s.handyLoans.filter(h => h.status === 'PAID').map(h => h.id),
          ...s.hiddenTxnIds,
        ],
      })),

      exportData: () => {
        const s = get();
        return JSON.stringify({
          startingBalance: s.startingBalance, incomeLogs: s.incomeLogs, liabilities: s.liabilities,
          handyLoans: s.handyLoans, expenses: s.expenses, documents: s.documents, prefs: s.prefs, exportedAt: new Date().toISOString(),
        }, null, 2);
      },

      importData: (json) => {
        try {
          const d = JSON.parse(json);
          set({
            startingBalance: d.startingBalance ?? 0, incomeLogs: d.incomeLogs ?? [],
            liabilities: d.liabilities ?? [], handyLoans: d.handyLoans ?? [],
            expenses: d.expenses ?? [], documents: d.documents ?? [], prefs: d.prefs ?? get().prefs,
          });
          return true;
        } catch { return false; }
      },
    }),
    {
      name: 'wealthflow-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        startingBalance: s.startingBalance, incomeLogs: s.incomeLogs, liabilities: s.liabilities,
        handyLoans: s.handyLoans, expenses: s.expenses, documents: s.documents, hiddenTxnIds: s.hiddenTxnIds,
        prefs: s.prefs, authUserId: s.authUserId,
      }),
    }
  )
);

export function useApp() {
  const store = useAppStore();
  const balance = computeBalance(store.startingBalance, store.incomeLogs, store.liabilities, store.expenses, store.handyLoans);
  return { state: { ...store, balance }, ...store };
}
