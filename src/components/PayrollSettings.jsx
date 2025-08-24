// src/components/PayrollSettings.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // PAYROLL MIGRATION: Import Supabase
import { Save } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

function PayrollSettings() {
  const { companyId } = useAppContext();
  const [settings, setSettings] = useState({
    company_name: '',
    company_address: '',
    rc_number: '',
    cnss_number: '',
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // PAYROLL MIGRATION: Fetch settings from the 'payroll_settings' table
  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('payroll_settings')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching payroll settings:", error);
      } else if (data) {
        setSettings(data);
      }
      setLoading(false);
    };
    fetchSettings();
  }, [companyId]);

  // PAYROLL MIGRATION: Save settings using Supabase 'upsert'
  const handleSave = async () => {
    if (!companyId) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const { error } = await supabase
        .from('payroll_settings')
        .upsert({ ...settings, company_id: companyId }, { onConflict: 'company_id' });

      if (error) throw error;

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error("Error saving payroll settings:", error);
      alert("Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setSettings(prev => ({...prev, [id]: value}));
  }

  if (loading) {
    return <div className="p-6 text-center">Loading settings...</div>;
  }

  return (
    <div className="p-6 bg-white rounded-b-lg">
      <div className="max-w-2xl mx-auto">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Company Payroll Information</h3>
        <p className="text-sm text-gray-600 mb-6">This information will appear on all generated payslips.</p>
        <div className="bg-gray-50 p-6 rounded-lg border space-y-4">
          <div>
            {/* PAYROLL MIGRATION: Field id updated to company_name */}
            <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">Legal Company Name</label>
            <input type="text" id="company_name" value={settings.company_name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
           <div>
            {/* PAYROLL MIGRATION: Field id updated to company_address */}
            <label htmlFor="company_address" className="block text-sm font-medium text-gray-700">Company Address</label>
            <input type="text" id="company_address" value={settings.company_address} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
           <div className="grid grid-cols-2 gap-4">
              <div>
                {/* PAYROLL MIGRATION: Field id updated to rc_number */}
                <label htmlFor="rc_number" className="block text-sm font-medium text-gray-700">N° Registre de Commerce (RC)</label>
                <input type="text" id="rc_number" value={settings.rc_number} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
              </div>
              <div>
                {/* PAYROLL MIGRATION: Field id updated to cnss_number */}
                <label htmlFor="cnss_number" className="block text-sm font-medium text-gray-700">N° d'affiliation CNSS</label>
                <input type="text" id="cnss_number" value={settings.cnss_number} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
              </div>
           </div>
        </div>
        <div className="mt-6 flex justify-end items-center">
            {saveSuccess && <p className="text-sm text-green-600 mr-4">Settings saved!</p>}
            <button onClick={handleSave} disabled={isSaving} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm disabled:bg-blue-400">
                <Save size={16} className="mr-2" />
                {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
        </div>
      </div>
    </div>
  );
}

export default PayrollSettings;