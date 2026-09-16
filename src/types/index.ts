export type Page =
  | 'dashboard'
  | 'salary'
  | 'sip'
  | 'insurance'
  | 'savings'
  | 'expenses'
  | 'loans'
  | 'handy'
  | 'trips'
  | 'profile'
  | 'interest-calc';

export type LiabilityCategory = 'GOLD' | 'SHG' | 'PERSONAL' | 'HOME' | 'SIP' | 'INSURANCE' | 'SAVINGS';

export type CurrencyCode = 'INR' | 'USD' | 'EUR';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface UserPrefs {
  fullName: string;
  currency: CurrencyCode;
  monthlyIncomeBenchmark: number;
}

export interface IncomeLog {
  id: string;
  source_name: string;
  amount: number;
  credit_date: string;
  recurring: boolean;
  frequency: string | null;
}

export interface Liability {
  id: string;
  category: LiabilityCategory;
  title: string;
  amount: number;
  due_day: number | null;
  status: 'PAID' | 'UNPAID';
  interest_rate: number | null;
  principal: number | null;
  remaining_tenure: number | null;
  target_yield: number | null;
  coverage_amount: number | null;
  renewal_date: string | null;
  total_invested: number;
  monthly_contrib: number;
  target_amount: number;
  current_saved: number;
  sip_date: number | null;
}

export interface HandyLoan {
  id: string;
  person_name: string;
  phone: string | null;
  amount: number;
  is_lent: boolean;
  due_date: string | null;
  status: 'PAID' | 'UNPAID';
  partial_paid: number;
}

export interface GeneralExpense {
  id: string;
  module_type: 'EXPENSE' | 'TRIP';
  title: string;
  amount: number;
  expense_date: string;
  category: string | null;
  trip_name: string | null;
}

export interface AccountBalance {
  id: string;
  current_balance: number;
}

export interface DocumentRecord {
  id: string;
  module_type: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number;
  created_at: string;
}

export interface TransactionEntry {
  id: string;
  type: 'income' | 'expense' | 'liability' | 'handy-lent' | 'handy-borrowed' | 'savings';
  title: string;
  amount: number;
  date: string;
  category: string;
  isInflow: boolean;
}
