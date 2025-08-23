-- Supabase Migration Script for Cohesio HR - Reschedule RPC Function
--
-- Instructions:
-- 1. Navigate to your Supabase project.
-- 2. Go to the "SQL Editor" section.
-- 3. Click "+ New query".
-- 4. Copy the entire content of this file and paste it into the editor.
-- 5. Click "RUN" to execute the script.
--

CREATE OR REPLACE FUNCTION reschedule_time_off_request(
  p_request_id uuid,
  p_new_start_date date,
  p_new_end_date date,
  p_new_total_days numeric
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update the request's dates, total days, and reset status to 'Pending'
  UPDATE public.time_off_requests
  SET
    start_date = p_new_start_date,
    end_date = p_new_end_date,
    total_days = p_new_total_days,
    status = 'Pending'
  WHERE id = p_request_id;

  -- Add a log entry for the reschedule action
  INSERT INTO public.time_off_request_history (request_id, action)
  VALUES (p_request_id, 'Rescheduled');

END;
$$;
