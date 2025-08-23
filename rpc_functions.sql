-- Supabase Migration Script for Cohesio HR - RPC Functions for Time Off
--
-- Instructions:
-- 1. Navigate to your Supabase project.
-- 2. Go to the "SQL Editor" section.
-- 3. Click "+ New query".
-- 4. Copy the entire content of this file and paste it into the editor.
-- 5. Click "RUN" to execute the script.
--
-- These functions are crucial for ensuring that multi-step operations
-- (like creating a request and updating a balance) are "atomic",
-- meaning they either both succeed or both fail, preventing data inconsistency.
--

-- Function 1: Create a time off request and update the corresponding employee's leave balance.
CREATE OR REPLACE FUNCTION create_time_off_request_and_update_balance(
  request_data jsonb,
  balance_change numeric,
  leave_type_field text
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  new_request_id uuid;
  new_request jsonb;
  employee_id uuid;
BEGIN
  -- Insert the new request and get its ID
  INSERT INTO public.time_off_requests (company_id, employee_id, user_email, leave_type, start_date, end_date, total_days, status, requested_at)
  VALUES (
    (request_data->>'company_id')::uuid,
    (request_data->>'employee_id')::uuid,
    request_data->>'user_email',
    request_data->>'leave_type',
    (request_data->>'start_date')::date,
    (request_data->>'end_date')::date,
    (request_data->>'total_days')::numeric,
    'Pending',
    (request_data->>'requested_at')::timestamptz
  ) RETURNING id INTO new_request_id;

  employee_id := (request_data->>'employee_id')::uuid;

  -- Update the employee's balance if the balance change is not zero
  IF balance_change != 0 THEN
    EXECUTE format('UPDATE public.employees SET %I = %I + %s WHERE id = %L',
                   leave_type_field, leave_type_field, balance_change, employee_id);
  END IF;

  -- Add to history
  INSERT INTO public.time_off_request_history (request_id, action)
  VALUES (new_request_id, 'Created');

  -- Return the newly created request
  SELECT to_jsonb(t) INTO new_request FROM public.time_off_requests t WHERE t.id = new_request_id;

  RETURN new_request;
END;
$$;


-- Function 2: Update a request's status and adjust balance if necessary (e.g., for denial).
CREATE OR REPLACE FUNCTION update_request_status_and_balance(
  p_request_id uuid,
  p_new_status text,
  p_employee_id uuid,
  p_balance_change numeric,
  p_leave_type_field text,
  p_company_id uuid, -- For history log, though not strictly needed for the update itself
  p_action_log text
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update the request status
  UPDATE public.time_off_requests
  SET status = p_new_status
  WHERE id = p_request_id;

  -- Update the employee's balance if the balance change is not zero
  IF p_balance_change != 0 THEN
    EXECUTE format('UPDATE public.employees SET %I = %I + %s WHERE id = %L',
                   p_leave_type_field, p_leave_type_field, p_balance_change, p_employee_id);
  END IF;

  -- Add to history
  INSERT INTO public.time_off_request_history (request_id, action)
  VALUES (p_request_id, p_action_log);
END;
$$;


-- Function 3: Delete a request and update balance if it was a pending request.
CREATE OR REPLACE FUNCTION delete_time_off_request_and_update_balance(
  p_request_id uuid,
  p_employee_id uuid,
  p_balance_change numeric,
  p_leave_type_field text
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete the request
  DELETE FROM public.time_off_requests
  WHERE id = p_request_id;

  -- Update the employee's balance if the balance change is not zero
  IF p_balance_change != 0 THEN
    EXECUTE format('UPDATE public.employees SET %I = %I + %s WHERE id = %L',
                   p_leave_type_field, p_leave_type_field, p_balance_change, p_employee_id);
  END IF;

  -- Note: The history for this request is deleted automatically
  -- because of the ON DELETE CASCADE constraint on the foreign key.
END;
$$;
