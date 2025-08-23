-- Supabase Migration Script: Finalize Payroll RPC Function
--
-- Instructions:
-- 1. Navigate to your Supabase project.
-- 2. Go to the "SQL Editor" section.
-- 3. Click "+ New query".
-- 4. Copy the entire content of this file and paste it into the editor.
-- 5. Click "RUN" to execute the script.
--

CREATE OR REPLACE FUNCTION finalize_payroll_run(
  p_run_id uuid,
  p_employee_data jsonb,
  p_total_gross_pay numeric,
  p_total_net_pay numeric
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.payroll_runs
  SET
    employee_data = p_employee_data,
    status = 'Finalized',
    total_gross_pay = p_total_gross_pay,
    total_net_pay = p_total_net_pay,
    finalized_at = now()
  WHERE id = p_run_id;
END;
$$;
