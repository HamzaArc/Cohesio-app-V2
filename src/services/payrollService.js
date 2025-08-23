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
