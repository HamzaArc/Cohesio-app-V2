-- Supabase Migration Script for Cohesio HR - Balance Reset RPC Function
--
-- Instructions:
-- 1. Navigate to your Supabase project.
-- 2. Go to the "SQL Editor" section.
-- 3. Click "+ New query".
-- 4. Copy the entire content of this file and paste it into the editor.
-- 5. Click "RUN" to execute the script.
--
-- This function allows for a safe, atomic reset of all employee leave
-- balances for a given company.
--

CREATE OR REPLACE FUNCTION manual_balance_reset(
  p_company_id uuid,
  p_reset_policy jsonb,
  p_current_year integer
)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  employee_count integer := 0;
BEGIN
  -- Update employee balances based on the reset policy
  IF (p_reset_policy->>'resetVacation')::boolean THEN
    UPDATE public.employees
    SET vacation_balance = (p_reset_policy->>'vacationMax')::numeric
    WHERE company_id = p_company_id;
  END IF;

  IF (p_reset_policy->>'resetSick')::boolean THEN
    UPDATE public.employees
    SET sick_balance = (p_reset_policy->>'sickMax')::numeric
    WHERE company_id = p_company_id;
  END IF;

  IF (p_reset_policy->>'resetPersonal')::boolean THEN
    UPDATE public.employees
    SET personal_balance = (p_reset_policy->>'personalMax')::numeric
    WHERE company_id = p_company_id;
  END IF;

  GET DIAGNOSTICS employee_count = ROW_COUNT;

  -- Update the last reset year in the policy to prevent re-running
  UPDATE public.time_off_policies
  SET reset_policy = reset_policy || jsonb_build_object('lastResetYear', p_current_year)
  WHERE company_id = p_company_id;

  RETURN 'Successfully reset balances for ' || employee_count || ' employees.';
END;
$$;
