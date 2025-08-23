-- Supabase Migration Script: Create Payroll Settings Table
--
-- Instructions:
-- 1. Navigate to your Supabase project.
-- 2. Go to the "SQL Editor" section.
-- 3. Click "+ New query".
-- 4. Copy the entire content of this file and paste it into the editor.
-- 5. Click "RUN" to execute the script.
--

CREATE TABLE public.payroll_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
  settings jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update the timestamp on row update
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.payroll_settings
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

ALTER TABLE public.payroll_settings ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.payroll_settings IS 'Stores company-specific payroll settings like legal name, address, and tax IDs.';
