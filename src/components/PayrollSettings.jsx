import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { getPayrollSettings, savePayrollSettings } from '../services/payrollService';

function PayrollSettings() {
  const { companyId } = useAppContext();
  const [settings, setSettings] = useState({
    companyName: '',
    companyAddress: '',
    rcNumber: '',
    cnssNumber: '',
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    const fetchSettings = async () => {
      setLoading(true);
      const fetchedSettings = await getPayrollSettings(companyId);
      if (fetchedSettings) {
        setSettings(fetchedSettings);
      }
      setLoading(false);
    };
    fetchSettings();
  }, [companyId]);

  const handleSave = async () => {
    if (!companyId) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await savePayrollSettings(companyId, settings);
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
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">Legal Company Name</label>
            <input type="text" id="companyName" value={settings.companyName} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
           <div>
            <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700">Company Address</label>
            <input type="text" id="companyAddress" value={settings.companyAddress} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
           <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="rcNumber" className="block text-sm font-medium text-gray-700">N° Registre de Commerce (RC)</label>
                <input type="text" id="rcNumber" value={settings.rcNumber} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
              </div>
              <div>
                <label htmlFor="cnssNumber" className="block text-sm font-medium text-gray-700">N° d'affiliation CNSS</label>
                <input type="text" id="cnssNumber" value={settings.cnssNumber} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
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