-- ============================================
-- BRIM INDIA - Complete Database Schema
-- Run this in Supabase: SQL Editor → New Query
-- ============================================

-- 1. Income sources
CREATE TABLE IF NOT EXISTS income (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  amount numeric NOT NULL,
  type text NOT NULL DEFAULT 'salary',
  month int NOT NULL,
  year int NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. Budget categories
CREATE TABLE IF NOT EXISTS budget_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  limit_amount numeric NOT NULL,
  spent_amount numeric DEFAULT 0,
  icon text,
  color text,
  month int NOT NULL,
  year int NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 3. Transactions (daily spends)
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  amount numeric NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  category text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 4. Subscriptions (Netflix, Spotify, etc.)
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  amount numeric NOT NULL,
  billing_cycle text DEFAULT 'monthly',
  due_day int,
  category text,
  status text DEFAULT 'active',
  next_due date,
  created_at timestamptz DEFAULT now()
);

-- 5. EMIs
CREATE TABLE IF NOT EXISTS emis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  principal numeric NOT NULL,
  emi_amount numeric NOT NULL,
  interest_rate numeric,
  tenure_months int NOT NULL,
  paid_months int DEFAULT 0,
  start_date date NOT NULL,
  due_day int,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- 6. Credit cards
CREATE TABLE IF NOT EXISTS credit_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  bank text,
  credit_limit numeric NOT NULL,
  outstanding numeric DEFAULT 0,
  minimum_due numeric DEFAULT 0,
  due_date date,
  billing_date int,
  created_at timestamptz DEFAULT now()
);

-- 7. Loans
CREATE TABLE IF NOT EXISTS loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  principal numeric NOT NULL,
  outstanding numeric NOT NULL,
  interest_rate numeric,
  emi_amount numeric NOT NULL,
  due_day int,
  start_date date,
  end_date date,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- 8. Investments & Savings (SIP, FD, PPF, etc.)
CREATE TABLE IF NOT EXISTS investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  invested_amount numeric NOT NULL,
  current_value numeric,
  monthly_contribution numeric DEFAULT 0,
  start_date date,
  maturity_date date,
  expected_return numeric,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- Enable Row Level Security (recommended)
-- ============================================
ALTER TABLE income ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE emis ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon key (single-user app)
CREATE POLICY "Allow all for anon" ON income FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON budget_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON subscriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON emis FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON credit_cards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON loans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON investments FOR ALL USING (true) WITH CHECK (true);
