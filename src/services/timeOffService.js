// src/services/timeOffService.js
import { supabase } from '../supabaseClient';

// === DATA SUBSCRIPTIONS ===

/**
 * Subscribe to time off data for a company.
 * This includes requests, policies, and holidays.
 * @param {string} companyId - The ID of the company.
 * @param {function} onUpdate - Callback function to handle updates.
 * @returns {object} - The Supabase subscription channel.
 */
export const subscribeToTimeOffData = (companyId, onUpdate) => {
  const handleDataChange = async (payload) => {
    console.log('Change detected in', payload.table);
    // Refetch all data to ensure consistency
    const { data: requests, error: reqError } = await supabase.from('time_off_requests').select('*').eq('company_id', companyId);
    const { data: policy, error: polError } = await supabase.from('time_off_policies').select('*').eq('company_id', companyId).single();
    const { data: holidays, error: holError } = await supabase.from('holidays').select('*').eq('company_id', companyId);

    if (reqError || polError || holError) {
      console.error('Error fetching time off data:', reqError || polError || holError);
      return;
    }
    onUpdate({ requests, policy, holidays });
  };

  const channel = supabase
    .channel(`time-off-data:${companyId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'time_off_requests', filter: `company_id=eq.${companyId}` }, handleDataChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'time_off_policies', filter: `company_id=eq.${companyId}` }, handleDataChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'holidays', filter: `company_id=eq.${companyId}` }, handleDataChange)
    .subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        // Fetch initial data once subscribed
        handleDataChange({ table: 'initial_fetch' });
      }
      if (err) {
        console.error('Subscription error:', err);
      }
    });

  return channel;
};

// === ACTION FUNCTIONS ===

/**
 * Creates a new time off request and logs the creation action.
 * Note: This version does not handle leave balance updates during creation,
 * matching the original logic where balance is decremented on submission, not approval.
 * The original logic seems to decrement balance immediately. Let's replicate that.
 * @param {object} requestData - The data for the new request.
 * @returns {object} - The newly created request.
 */
export const createTimeOffRequest = async (requestData) => {
  const { company_id, employee_id, total_days, leave_type } = requestData;

  // Use a Supabase Edge Function to perform this as a transaction
  const { data, error } = await supabase.rpc('create_time_off_request_and_update_balance', {
    request_data: requestData,
    balance_change: -total_days, // Decrement balance
    leave_type_field: leave_type.toLowerCase().replace(' ', '_').replace('_(unpaid)', '') + '_balance'
  });

  if (error) {
    console.error('Error creating time off request:', error);
    throw error;
  }
  return data;
};

/**
 * Updates the status of a time off request.
 * If a 'Pending' request is 'Denied', it reverts the leave balance.
 * @param {string} requestId - The ID of the request to update.
 * @param {string} newStatus - The new status ('Approved', 'Denied').
 * @param {object} request - The full request object.
 */
export const updateRequestStatus = async (requestId, newStatus, request) => {
  // This should also be a transaction. Let's create an RPC for it.
  const { company_id, employee_id, total_days, leave_type, status: oldStatus } = request;

  let balanceChange = 0;
  // If a pending request is denied, we need to add the days back to the balance.
  if (oldStatus === 'Pending' && newStatus === 'Denied') {
    balanceChange = total_days;
  }

  const { data, error } = await supabase.rpc('update_request_status_and_balance', {
    p_request_id: requestId,
    p_new_status: newStatus,
    p_employee_id: employee_id,
    p_balance_change: balanceChange,
    p_leave_type_field: leave_type.toLowerCase().replace(' ', '_').replace('_(unpaid)', '') + '_balance',
    p_company_id: company_id,
    p_action_log: newStatus
  });

  if (error) {
    console.error(`Error updating request status to ${newStatus}:`, error);
    throw error;
  }
  return data;
};

/**
 * Deletes a time off request. If the request was 'Pending', it reverts the leave balance.
 * @param {object} request - The request object to be deleted.
 */
export const deleteTimeOffRequest = async (request) => {
  const { id: requestId, company_id, employee_id, total_days, leave_type, status } = request;

  let balanceChange = 0;
  // If a pending request is deleted/withdrawn, add the days back.
  if (status === 'Pending') {
    balanceChange = total_days;
  }

  // Use an RPC to ensure atomicity
  const { error } = await supabase.rpc('delete_time_off_request_and_update_balance', {
    p_request_id: requestId,
    p_employee_id: employee_id,
    p_balance_change: balanceChange,
    p_leave_type_field: leave_type.toLowerCase().replace(' ', '_').replace('_(unpaid)', '') + '_balance'
  });

  if (error) {
    console.error('Error deleting time off request:', error);
    throw error;
  }
  return { success: true };
};

/**
 * Adds a log entry to the time off request history.
 * This is now handled by the RPC functions, but we keep it here for potential standalone use.
 * @param {string} requestId - The ID of the request.
 * @param {string} action - The action performed (e.g., 'Created', 'Approved').
 */
export const addHistoryLog = async (requestId, action) => {
  const { error } = await supabase
    .from('time_off_request_history')
    .insert({ request_id: requestId, action: action });

  if (error) {
    console.error('Error adding history log:', error);
    throw error;
  }
};

/**
 * Executes the manual balance reset for all employees in a company.
 * @param {string} companyId - The ID of the company.
 * @param {object} resetPolicy - The current reset policy object.
 * @returns {string} - A success message from the RPC.
 */
export const runManualBalanceReset = async (companyId, resetPolicy) => {
    const currentYear = new Date().getFullYear();
    if (resetPolicy.lastResetYear === currentYear) {
        throw new Error(`Balances have already been reset for ${currentYear}. The reset can only be run once per year.`);
    }

    const { data, error } = await supabase.rpc('manual_balance_reset', {
        p_company_id: companyId,
        p_reset_policy: resetPolicy,
        p_current_year: currentYear
    });

    if (error) {
        console.error('Error running manual balance reset:', error);
        throw error;
    }

    return data;
};

// Note: The RPC functions (`create_time_off_request_and_update_balance`, etc.)
// need to be created in the Supabase SQL Editor. I will provide the SQL for these separately.

// === SETTINGS FUNCTIONS ===

/**
 * Updates the weekend settings for a company.
 * @param {string} companyId - The ID of the company.
 * @param {object} weekends - The weekend settings object (e.g., { sat: true, sun: true }).
 */
export const updateWeekendSettings = async (companyId, weekends) => {
  const { error } = await supabase
    .from('time_off_policies')
    .update({ weekends })
    .eq('company_id', companyId);

  if (error) {
    console.error('Error updating weekend settings:', error);
    throw error;
  }
};

/**
 * Adds a new holiday for a company.
 * @param {string} companyId - The ID of the company.
 * @param {object} holidayData - Object with { name, date }.
 */
export const addHoliday = async (companyId, holidayData) => {
  const { error } = await supabase
    .from('holidays')
    .insert({ company_id: companyId, ...holidayData });

  if (error) {
    console.error('Error adding holiday:', error);
    throw error;
  }
};

/**
 * Deletes a holiday.
 * @param {string} holidayId - The ID of the holiday to delete.
 */
export const deleteHoliday = async (holidayId) => {
  const { error } = await supabase
    .from('holidays')
    .delete()
    .eq('id', holidayId);

  if (error) {
    console.error('Error deleting holiday:', error);
    throw error;
  }
};

/**
 * Saves the annual reset policy for a company.
 * @param {string} companyId - The ID of the company.
 * @param {object} policyData - The reset policy object.
 */
export const saveResetPolicy = async (companyId, policyData) => {
  // Use upsert to create the policy if it doesn't exist, or update it if it does.
  const { error } = await supabase
    .from('time_off_policies')
    .upsert({ company_id: companyId, reset_policy: policyData }, { onConflict: 'company_id' });

  if (error) {
    console.error('Error saving reset policy:', error);
    throw error;
  }
};
