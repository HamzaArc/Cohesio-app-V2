-- Supabase Migration Script: Alter Payroll Runs Table
--
-- Instructions:
-- 1. Navigate to your Supabase project.
-- 2. Go to the "SQL Editor" section.
-- 3. Click "+ New query".
-- 4. Copy the entire content of this file and paste it into the editor.
-- 5. Click "RUN" to execute the script.
--
-- This script adds a JSONB column to store the detailed employee data for each payroll run.

ALTER TABLE public.payroll_runs
ADD COLUMN employee_data jsonb;

COMMENT ON COLUMN public.payroll_runs.employee_data IS 'Stores the detailed breakdown of salary, bonuses, and deductions for each employee in this run.';
