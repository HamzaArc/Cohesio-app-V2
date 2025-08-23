-- Supabase Migration Script for Cohesio HR - Payroll and Time Off
--
-- Instructions:
-- 1. Navigate to your Supabase project.
-- 2. Go to the "SQL Editor" section.
-- 3. Click "+ New query".
-- 4. Copy the entire content of this file and paste it into the editor.
-- 5. Click "RUN" to execute the script.
--

-- Table for storing payroll runs
CREATE TABLE public.payroll_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  period text NOT NULL,
  period_label text,
  status text NOT NULL,
  total_net_pay numeric,
  finalized_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.payroll_runs IS 'Stores historical and in-progress payroll runs for each company.';

-- Table for storing time off requests
CREATE TABLE public.time_off_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  user_email text, -- Denormalized for easier access in the app
  leave_type text,
  start_date date,
  end_date date,
  total_days numeric,
  status text,
  requested_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.time_off_requests IS 'Contains all time off requests from employees.';

-- Table for the history of a time off request
CREATE TABLE public.time_off_request_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id uuid NOT NULL REFERENCES public.time_off_requests(id) ON DELETE CASCADE,
  action text,
  "timestamp" timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.time_off_request_history IS 'Logs the lifecycle of a time off request (created, approved, etc.).';

-- Table for company-specific time off policies
CREATE TABLE public.time_off_policies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
  weekends jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.time_off_policies IS 'Stores time off settings, like which days are considered weekends.';

-- Table for company holidays
CREATE TABLE public.holidays (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  "name" text,
  "date" date,
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.holidays IS 'Lists company-specific holidays to be excluded from leave calculations.';

-- Enable Row-Level Security (RLS) for the new tables.
-- While the policy definitions are out of scope for this migration,
-- it is a security best practice to enable RLS on all tables.
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_off_request_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_off_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

-- Note: Policies for RLS are not defined here as per project scope.
-- The application will currently rely on Supabase client-side queries.
-- For production, you would define policies here, for example:
-- CREATE POLICY "Allow users to see their own company data"
-- ON public.payroll_runs FOR SELECT
-- USING ( auth.uid() IN (SELECT user_id FROM company_users WHERE company_id = public.payroll_runs.company_id) );
