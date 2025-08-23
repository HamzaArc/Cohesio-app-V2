import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { Save, Zap, AlertCircle } from 'lucide-react';

function TimeOffPolicy() {
  const [policy, setPolicy] = useState({
    resetMonth: '01',
    resetDay: '01',
    vacationMax: 15,
    sickMax: 5,
    personalMax: 3,
    resetVacation: true,
    resetSick: true,
    resetPersonal: true,
    lastResetYear: null,
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch the current policy from the database when the component loads
  useEffect(() => {
    const fetchPolicy = async () => {
      const docRef = doc(db, 'companyPolicies', 'timeOff');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().resetPolicy) {
        // If a policy exists, merge it with our default state
        setPolicy(prev => ({ ...prev, ...docSnap.data().resetPolicy }));
      }
      setLoading(false);
    };
    fetchPolicy();
  }, []);

  // Handle saving the policy settings to the database
  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const docRef = doc(db, 'companyPolicies', 'timeOff');
      // We use 'merge: true' to avoid overwriting other settings like weekends/holidays
      await setDoc(docRef, { resetPolicy: policy }, { merge: true });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000); // Hide success message after 2s
    } catch (error) {
      console.error("Error saving policy:", error);
      alert("Failed to save policy.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle the manual, one-time reset of all employee balances
  const handleManualReset = async () => {
    const currentYear = new Date().getFullYear();
    if (policy.lastResetYear === currentYear) {
      alert(`Balances have already been reset for ${currentYear}. The reset can only be run once per year.`);
      return;
    }
    if (!window.confirm(`Are you sure you want to manually reset all employee balances for ${currentYear}? This action cannot be undone.`)) {
      return;
    }

    setIsResetting(true);
    try {
      const employeesSnapshot = await getDocs(collection(db, 'employees'));
      const batch = writeBatch(db);
      
      employeesSnapshot.forEach(employeeDoc => {
        const employeeRef = doc(db, 'employees', employeeDoc.id);
        const updateData = {};
        if (policy.resetVacation) updateData.vacationBalance = Number(policy.vacationMax);
        if (policy.resetSick) updateData.sickBalance = Number(policy.sickMax);
        if (policy.resetPersonal) updateData.personalBalance = Number(policy.personalMax);
        
        // Only update if there's something to change
        if (Object.keys(updateData).length > 0) {
            batch.update(employeeRef, updateData);
        }
      });

      // After updating all employees, update the policy to prevent re-running this year
      const policyRef = doc(db, 'companyPolicies', 'timeOff');
      batch.set(policyRef, { resetPolicy: { ...policy, lastResetYear: currentYear } }, { merge: true });

      await batch.commit();
      alert(`Successfully reset balances for ${employeesSnapshot.size} employees.`);
    } catch (error) {
        console.error("Error resetting balances:", error);
        alert("An error occurred while resetting balances.");
    } finally {
        setIsResetting(false);
    }
  };

  // Handle changes to any form input
  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setPolicy(prev => ({ ...prev, [id]: type === 'checkbox' ? checked : value }));
  };

  if (loading) {
    return <div className="p-6 text-center">Loading policy...</div>;
  }

  return (
    <div className="p-6 bg-white rounded-b-lg shadow-sm border border-gray-200 border-t-0">
      <div className="max-w-2xl mx-auto">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Annual Balance Reset Policy</h3>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Reset Date</label>
            <p className="text-xs text-gray-500 mb-1">On this day each year, selected balances will be reset to their maximums.</p>
            <div className="flex gap-2">
              <select id="resetMonth" value={policy.resetMonth} onChange={handleChange} className="border border-gray-300 rounded-md shadow-sm p-2">
                {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={String(m).padStart(2, '0')}>{new Date(0, m-1).toLocaleString('default', { month: 'long' })}</option>)}
              </select>
              <select id="resetDay" value={policy.resetDay} onChange={handleChange} className="border border-gray-300 rounded-md shadow-sm p-2">
                {Array.from({length: 31}, (_, i) => i + 1).map(d => <option key={d} value={String(d).padStart(2, '0')}>{d}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Maximum Balances</label>
            <p className="text-xs text-gray-500 mb-1">Enter the total number of days each employee receives annually for each leave type.</p>
            <div className="space-y-2">
                <div className="flex items-center gap-2"><input type="checkbox" id="resetVacation" checked={policy.resetVacation} onChange={handleChange} className="h-4 w-4 rounded"/> <input type="number" id="vacationMax" value={policy.vacationMax} onChange={handleChange} className="w-24 p-1 border rounded-md text-sm"/> <label>Vacation Days</label></div>
                <div className="flex items-center gap-2"><input type="checkbox" id="resetSick" checked={policy.resetSick} onChange={handleChange} className="h-4 w-4 rounded"/> <input type="number" id="sickMax" value={policy.sickMax} onChange={handleChange} className="w-24 p-1 border rounded-md text-sm"/> <label>Sick Days</label></div>
                <div className="flex items-center gap-2"><input type="checkbox" id="resetPersonal" checked={policy.resetPersonal} onChange={handleChange} className="h-4 w-4 rounded"/> <input type="number" id="personalMax" value={policy.personalMax} onChange={handleChange} className="w-24 p-1 border rounded-md text-sm"/> <label>Personal Days</label></div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-between items-center bg-orange-50 p-3 rounded-lg border border-orange-200">
            <div>
                <p className="text-sm font-semibold text-orange-800">Manual Reset</p>
                <p className="text-xs text-orange-700">This will immediately reset all employee balances. Use with caution.</p>
            </div>
            <button 
                onClick={handleManualReset} 
                disabled={isResetting}
                className="bg-orange-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors flex items-center shadow-sm disabled:opacity-50"
            >
                <Zap size={16} className="mr-2" />
                {isResetting ? 'Resetting...' : `Run Reset Now`}
            </button>
        </div>
        
        <div className="mt-6 flex justify-end items-center border-t pt-4">
            {saveSuccess && <p className="text-sm text-green-600 mr-4">Policy saved successfully!</p>}
            <button onClick={handleSave} disabled={isSaving} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm disabled:bg-blue-400">
                <Save size={16} className="mr-2" />
                {isSaving ? 'Saving...' : 'Save Policy'}
            </button>
        </div>
      </div>
    </div>
  );
}

export default TimeOffPolicy;
