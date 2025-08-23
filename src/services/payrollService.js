// src/services/payrollService.js
import { supabase } from '../supabaseClient';

/**
 * Subscribe to real-time updates for payroll runs for a specific company.
 * @param {string} companyId - The ID of the company.
 * @param {function} callback - The function to call with the updated payroll runs.
 * @returns {object} - The Supabase subscription object.
 */
export const subscribeToPayrollRuns = (companyId, callback) => {
  const subscription = supabase
    .channel(`payroll_runs:${companyId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'payroll_runs', filter: `company_id=eq.${companyId}` },
      async (payload) => {
        // Refetch all data to ensure consistency
        const { data, error } = await supabase
          .from('payroll_runs')
          .select('*')
          .eq('company_id', companyId)
          .order('period', { ascending: false });

        if (error) {
          console.error('Error fetching payroll runs after change:', error);
        } else {
          callback(data);
        }
      }
    )
    .subscribe();

  // Initial fetch
  const initialFetch = async () => {
    const { data, error } = await supabase
      .from('payroll_runs')
      .select('*')
      .eq('company_id', companyId)
      .order('period', { ascending: false });

    if (error) {
      console.error('Error fetching initial payroll runs:', error);
    } else {
      callback(data);
    }
  };

  initialFetch();

  return subscription;
};

/**
 * Starts a new payroll run for a specific period or finds the existing one.
 * @param {string} companyId - The ID of the company.
 * @param {string} month - The month for the payroll period (e.g., '08').
 * @param {number} year - The year for the payroll period (e.g., 2024).
 * @returns {object} - The payroll run object (either existing or new).
 */
export const startPayrollRun = async (companyId, month, year) => {
  if (!companyId || !month || !year) {
    throw new Error('Company ID, month, and year are required.');
  }

  const periodId = `${year}-${month}`;

  // Check if a run for this period already exists
  const { data: existingRun, error: existingRunError } = await supabase
    .from('payroll_runs')
    .select('id')
    .eq('company_id', companyId)
    .eq('period', periodId)
    .single();

  if (existingRunError && existingRunError.code !== 'PGRST116') { // PGRST116: "exact one row not found"
    console.error('Error checking for existing payroll run:', existingRunError);
    throw existingRunError;
  }

  if (existingRun) {
    return { id: existingRun.id, isNew: false };
  }

  // If no run exists, create a new one
  const periodLabel = `${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} ${year}`;
  const newRunData = {
    company_id: companyId,
    period: periodId,
    period_label: periodLabel,
    status: 'Draft',
    // employeeData would be handled in the run itself, not here
  };

  const { data: newRun, error: newRunError } = await supabase
    .from('payroll_runs')
    .insert(newRunData)
    .select('id')
    .single();

  if (newRunError) {
    console.error('Error creating new payroll run:', newRunError);
    throw newRunError;
  }

  return { id: newRun.id, isNew: true };
};

/**
 * Subscribe to real-time updates for a single payroll run.
 * @param {string} runId - The ID of the payroll run.
 * @param {function} callback - The function to call with the updated payroll run data.
 * @returns {object} - The Supabase subscription object.
 */
export const subscribeToPayrollRun = (runId, callback) => {
  const subscription = supabase
    .channel(`payroll_run:${runId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'payroll_runs', filter: `id=eq.${runId}` },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  // Initial fetch
  const initialFetch = async () => {
    const { data, error } = await supabase
      .from('payroll_runs')
      .select('*')
      .eq('id', runId)
      .single();
    if (error) {
      console.error('Error fetching initial payroll run:', error);
    } else {
      callback(data);
    }
  };
  initialFetch();

  return subscription;
};

/**
 * Saves the draft of a payroll run.
 * @param {string} runId - The ID of the payroll run.
 * @param {object} employeeData - The JSON object of employee payroll data.
 */
export const savePayrollDraft = async (runId, employeeData) => {
  const { error } = await supabase
    .from('payroll_runs')
    .update({ employee_data: employeeData })
    .eq('id', runId);

  if (error) {
    console.error('Error saving payroll draft:', error);
    throw error;
  }
};

/**
 * Creates a new off-cycle payroll run.
 * @param {string} companyId - The ID of the company.
 * @param {object} runData - Data for the off-cycle run.
 */
export const createOffCyclePayroll = async (companyId, runData) => {
  const { selectedEmployee, payDay, reason, lineItems } = runData;

  const grossPay = lineItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);

  const newRunData = {
    company_id: companyId,
    period: payDay, // Use payDay as the period identifier
    period_label: `Off-Cycle: ${reason}`,
    status: 'Finalized', // Off-cycle runs are typically finalized immediately
    total_gross_pay: grossPay,
    total_net_pay: grossPay, // Assuming gross is net for simplicity, as in original
    finalized_at: new Date().toISOString(),
    employee_data: {
      [selectedEmployee.id]: {
        lineItems: lineItems.map(({id, ...rest}) => rest)
      }
    }
  };

  const { error } = await supabase
    .from('payroll_runs')
    .insert(newRunData);

  if (error) {
    console.error('Error creating off-cycle payroll:', error);
    throw error;
  }
};

/**
 * Gets the payroll settings for a company.
 * @param {string} companyId - The ID of the company.
 * @returns {object|null} - The settings object or null if not found.
 */
export const getPayrollSettings = async (companyId) => {
  const { data, error } = await supabase
    .from('payroll_settings')
    .select('settings')
    .eq('company_id', companyId)
    .single();

  if (error && error.code !== 'PGRST116') { // Ignore "row not found" error
    console.error('Error getting payroll settings:', error);
    throw error;
  }
  return data ? data.settings : null;
};

/**
 * Saves the payroll settings for a company.
 * @param {string} companyId - The ID of the company.
 * @param {object} settings - The settings object to save.
 */
export const savePayrollSettings = async (companyId, settings) => {
  const { error } = await supabase
    .from('payroll_settings')
    .upsert({ company_id: companyId, settings: settings }, { onConflict: 'company_id' });

  if (error) {
    console.error('Error saving payroll settings:', error);
    throw error;
  }
};

/**
 * Finalizes a payroll run by calling the RPC function.
 * @param {string} runId - The ID of the payroll run.
 * @param {object} employeeData - The final employee data.
 * @param {object} totals - An object with { totalGross, totalNet }.
 */
export const finalizePayroll = async (runId, employeeData, totals) => {
  const { error } = await supabase.rpc('finalize_payroll_run', {
    p_run_id: runId,
    p_employee_data: employeeData,
    p_total_gross_pay: totals.totalGross,
    p_total_net_pay: totals.totalNet,
  });

  if (error) {
    console.error('Error finalizing payroll:', error);
    throw error;
  }
};
