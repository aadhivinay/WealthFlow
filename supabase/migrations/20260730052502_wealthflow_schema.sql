/*
# WealthFlow Engine — Core Schema & RLS

## Overview
Creates the 5-table schema for WealthFlow Engine, a personal finance app
with per-user data isolation via Supabase Auth and Row Level Security.

## New Tables
1. `account_balances` — Stores the user's starting/manual balance (one row per user).
   - `current_balance` (numeric, default 0) — starting balance before income/obligations.
2. `income_logs` — Salary, bonuses, and side-income entries.
   - `source_name`, `amount`, `credit_date`, `recurring`, `frequency`.
3. `liabilities` — All obligations: SIPs, insurance, loans, savings goals.
   - `category` distinguishes type (GOLD, SHG, PERSONAL, HOME, SIP, INSURANCE, SAVINGS).
   - `title`, `amount`, `due_day`, `status` (PAID/UNPAID).
   - Extra nullable fields for interest_rate, principal, tenure, yield, coverage, etc.
4. `handy_loans` — Money lent to or borrowed from friends.
   - `person_name`, `phone`, `amount`, `is_lent`, `due_date`, `status`, `partial_paid`.
5. `general_expenses` — Personal expenses and trip expenses.
   - `module_type` (EXPENSE or TRIP), `title`, `amount`, `expense_date`, `category`, `trip_name`.

## Security
- RLS enabled on ALL tables.
- All policies scope to `authenticated` users with `auth.uid() = user_id`.
- Owner columns default to `auth.uid()` so inserts work without explicit user_id.

## Balance Formula
Live Balance = account_balances.current_balance
  + SUM(income_logs.amount)
  - SUM(liabilities.amount WHERE status = 'PAID')
  - SUM(general_expenses.amount)
*/

-- 1. account_balances
CREATE TABLE IF NOT EXISTS account_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  current_balance numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE account_balances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_balance" ON account_balances;
CREATE POLICY "select_own_balance" ON account_balances FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_balance" ON account_balances;
CREATE POLICY "insert_own_balance" ON account_balances FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_balance" ON account_balances;
CREATE POLICY "update_own_balance" ON account_balances FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_balance" ON account_balances;
CREATE POLICY "delete_own_balance" ON account_balances FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 2. income_logs
CREATE TABLE IF NOT EXISTS income_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  source_name text NOT NULL,
  amount numeric NOT NULL,
  credit_date date NOT NULL,
  recurring boolean DEFAULT false,
  frequency text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE income_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_income" ON income_logs;
CREATE POLICY "select_own_income" ON income_logs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_income" ON income_logs;
CREATE POLICY "insert_own_income" ON income_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_income" ON income_logs;
CREATE POLICY "update_own_income" ON income_logs FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_income" ON income_logs;
CREATE POLICY "delete_own_income" ON income_logs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 3. liabilities
CREATE TABLE IF NOT EXISTS liabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  title text NOT NULL,
  amount numeric NOT NULL,
  due_day int,
  status text NOT NULL DEFAULT 'UNPAID',
  interest_rate numeric,
  principal numeric,
  remaining_tenure int,
  target_yield numeric,
  coverage_amount numeric,
  renewal_date date,
  total_invested numeric DEFAULT 0,
  monthly_contrib numeric DEFAULT 0,
  target_amount numeric DEFAULT 0,
  current_saved numeric DEFAULT 0,
  sip_date int,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE liabilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_liabilities" ON liabilities;
CREATE POLICY "select_own_liabilities" ON liabilities FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_liabilities" ON liabilities;
CREATE POLICY "insert_own_liabilities" ON liabilities FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_liabilities" ON liabilities;
CREATE POLICY "update_own_liabilities" ON liabilities FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_liabilities" ON liabilities;
CREATE POLICY "delete_own_liabilities" ON liabilities FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 4. handy_loans
CREATE TABLE IF NOT EXISTS handy_loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  person_name text NOT NULL,
  phone text,
  amount numeric NOT NULL,
  is_lent boolean NOT NULL DEFAULT true,
  due_date date,
  status text NOT NULL DEFAULT 'UNPAID',
  partial_paid numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE handy_loans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_handy" ON handy_loans;
CREATE POLICY "select_own_handy" ON handy_loans FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_handy" ON handy_loans;
CREATE POLICY "insert_own_handy" ON handy_loans FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_handy" ON handy_loans;
CREATE POLICY "update_own_handy" ON handy_loans FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_handy" ON handy_loans;
CREATE POLICY "delete_own_handy" ON handy_loans FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 5. general_expenses
CREATE TABLE IF NOT EXISTS general_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  module_type text NOT NULL DEFAULT 'EXPENSE',
  title text NOT NULL,
  amount numeric NOT NULL,
  expense_date date NOT NULL,
  category text,
  trip_name text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE general_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_expenses" ON general_expenses;
CREATE POLICY "select_own_expenses" ON general_expenses FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_expenses" ON general_expenses;
CREATE POLICY "insert_own_expenses" ON general_expenses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_expenses" ON general_expenses;
CREATE POLICY "update_own_expenses" ON general_expenses FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_expenses" ON general_expenses;
CREATE POLICY "delete_own_expenses" ON general_expenses FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_income_logs_user ON income_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_liabilities_user ON liabilities(user_id);
CREATE INDEX IF NOT EXISTS idx_handy_loans_user ON handy_loans(user_id);
CREATE INDEX IF NOT EXISTS idx_general_expenses_user ON general_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_account_balances_user ON account_balances(user_id);
