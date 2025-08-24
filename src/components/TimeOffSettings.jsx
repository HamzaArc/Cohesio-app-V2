// src/components/TimeOffSettings.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // TIME OFF MIGRATION: Using Supabase
import { Plus, Trash2, Save, Zap } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

function TimeOffSettings() {
  const { companyId, employees } = useAppContext(); // Get employees for manual reset
  const [weekends, setWeekends] = useState({ sat: true, sun: true });
  const [holidays, setHolidays] = useState([]);
  const [resetPolicy, setResetPolicy] = useState({
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

  const [newHolidayName, setNewHolidayName] = useState('');
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // TIME OFF MIGRATION: Fetch policies and holidays from Supabase
  useEffect(() => {
    if (!companyId) {
        setLoading(false);
        return;
    }
    const fetchSettings = async () => {
        // Fetch main policy (weekends, reset policy)
        const { data: policyData, error: policyError } = await supabase
            .from('time_off_policies')
            .select('*')
            .eq('company_id', companyId)
            .maybeSingle();

        if (policyError) console.error("Error fetching policy:", policyError);
        if (policyData) {
            setWeekends(policyData.weekends || { sat: true, sun: true });
            if (policyData.reset_policy) {
                setResetPolicy(prev => ({ ...prev, ...policyData.reset_policy }));
            }
        }

        // Fetch holidays
        const { data: holidaysData, error: holidaysError } = await supabase
            .from('time_off_holidays')
            .select('*')
            .eq('company_id', companyId);

        if (holidaysError) console.error("Error fetching holidays:", holidaysError);
        else setHolidays(holidaysData);

        setLoading(false);
    };

    fetchSettings();

    // Set up realtime listeners
    const holidaysChannel = supabase.channel(`holidays:${companyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'time_off_holidays', filter: `company_id=eq.${companyId}` }, fetchSettings)
      .subscribe();

    return () => {
      supabase.removeChannel(holidaysChannel);
    };
  }, [companyId]);

  const handleWeekendChange = async (day) => {
    if (!companyId) return;
    const newWeekends = { ...weekends, [day]: !weekends[day] };
    setWeekends(newWeekends);
    await supabase.from('time_off_policies').upsert({ company_id: companyId, weekends: newWeekends }, { onConflict: 'company_id' });
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if (!newHolidayName || !newHolidayDate || !companyId) return;
    await supabase.from('time_off_holidays').insert({ company_id: companyId, name: newHolidayName, date: newHolidayDate });
    setNewHolidayName('');
    setNewHolidayDate('');
  };

  const handleDeleteHoliday = async (holidayId) => {
    if (!companyId) return;
    await supabase.from('time_off_holidays').delete().eq('id', holidayId);
  };

  const handlePolicyChange = (e) => {
    const { id, value, type, checked } = e.target;
    setResetPolicy(prev => ({ ...prev, [id]: type === 'checkbox' ? checked : value }));
  };

  const handleSavePolicy = async () => {
    if (!companyId) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await supabase.from('time_off_policies').upsert({ company_id: companyId, reset_policy: resetPolicy }, { onConflict: 'company_id' });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error("Error saving policy:", error);
      alert("Failed to save policy.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualReset = async () => {
    if (!companyId) return;
    const currentYear = new Date().getFullYear();
    if (resetPolicy.lastResetYear === currentYear) {
      alert(`Balances have already been reset for ${currentYear}. The reset can only be run once per year.`);
      return;
    }
    if (!window.confirm(`Are you sure you want to manually reset all employee balances for ${currentYear}? This action cannot be undone.`)) {
      return;
    }

    setIsResetting(true);
    try {
        const updates = employees.map(employee => {
            const updateData = {};
            if (resetPolicy.resetVacation) updateData.vacation_balance = Number(resetPolicy.vacationMax);
            if (resetPolicy.resetSick) updateData.sick_balance = Number(resetPolicy.sickMax);
            if (resetPolicy.resetPersonal) updateData.personal_balance = Number(resetPolicy.personalMax);
            return supabase.from('employees').update(updateData).eq('id', employee.id);
        });

        await Promise.all(updates);

      const newResetPolicy = { ...resetPolicy, lastResetYear: currentYear };
      await supabase.from('time_off_policies').upsert({ company_id: companyId, reset_policy: newResetPolicy }, { onConflict: 'company_id' });
      setResetPolicy(newResetPolicy);

      alert(`Successfully reset balances for ${employees.length} employees.`);
    } catch (error) {
        console.error("Error resetting balances:", error);
        alert("An error occurred while resetting balances.");
    } finally {
        setIsResetting(false);
    }
  };


  if (loading) {
    return <div className="p-6 text-center">Loading settings...</div>;
  }

  return (
    <div className="p-6 bg-white rounded-b-lg shadow-sm border border-gray-200 border-t-0">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">Weekend Definition</h3>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-3">Select the days of the week that are considered non-working days.</p>
                <div className="flex gap-2">
                  {['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map(day => (
                    <button key={day} onClick={() => handleWeekendChange(day)} className={`capitalize w-12 h-12 rounded-lg font-semibold transition-colors ${weekends[day] ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">Public Holidays</h3>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                  {holidays.map(holiday => (
                    <div key={holiday.id} className="flex justify-between items-center bg-white p-2 rounded-md border">
                      <p className="text-sm font-semibold text-gray-700">{holiday.name}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-500">{holiday.date}</p>
                        <button onClick={() => handleDeleteHoliday(holiday.id)}><Trash2 size={16} className="text-red-500 hover:text-red-700" /></button>
                      </div>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleAddHoliday} className="flex gap-2">
                  <input type="text" value={newHolidayName} onChange={e => setNewHolidayName(e.target.value)} placeholder="Holiday Name" className="flex-grow border border-gray-300 rounded-md shadow-sm p-2 text-sm" />
                  <input type="date" value={newHolidayDate} onChange={e => setNewHolidayDate(e.target.value)} className="border border-gray-300 rounded-md shadow-sm p-2 text-sm" />
                  <button type="submit" className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold p-2 rounded-lg"><Plus size={20} /></button>
                </form>
              </div>
            </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-4">Annual Balance Reset Policy</h3>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Reset Date</label>
              <p className="text-xs text-gray-500 mb-1">On this day each year, selected balances will be reset to their maximums.</p>
              <div className="flex gap-2">
                <select id="resetMonth" value={resetPolicy.resetMonth} onChange={handlePolicyChange} className="border border-gray-300 rounded-md shadow-sm p-2">
                  {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={String(m).padStart(2, '0')}>{new Date(0, m-1).toLocaleString('default', { month: 'long' })}</option>)}
                </select>
                <select id="resetDay" value={resetPolicy.resetDay} onChange={handlePolicyChange} className="border border-gray-300 rounded-md shadow-sm p-2">
                  {Array.from({length: 31}, (_, i) => i + 1).map(d => <option key={d} value={String(d).padStart(2, '0')}>{d}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Maximum Balances</label>
              <p className="text-xs text-gray-500 mb-1">Enter the total number of days each employee receives annually for each leave type.</p>
              <div className="space-y-2">
                  <div className="flex items-center gap-2"><input type="checkbox" id="resetVacation" checked={resetPolicy.resetVacation} onChange={handlePolicyChange} className="h-4 w-4 rounded"/> <input type="number" id="vacationMax" value={resetPolicy.vacationMax} onChange={handlePolicyChange} className="w-24 p-1 border rounded-md text-sm"/> <label>Vacation Days</label></div>
                  <div className="flex items-center gap-2"><input type="checkbox" id="resetSick" checked={resetPolicy.resetSick} onChange={handlePolicyChange} className="h-4 w-4 rounded"/> <input type="number" id="sickMax" value={resetPolicy.sickMax} onChange={handlePolicyChange} className="w-24 p-1 border rounded-md text-sm"/> <label>Sick Days</label></div>
                  <div className="flex items-center gap-2"><input type="checkbox" id="resetPersonal" checked={resetPolicy.resetPersonal} onChange={handlePolicyChange} className="h-4 w-4 rounded"/> <input type="number" id="personalMax" value={resetPolicy.personalMax} onChange={handlePolicyChange} className="w-24 p-1 border rounded-md text-sm"/> <label>Personal Days</label></div>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-between items-center bg-orange-50 p-3 rounded-lg border border-orange-200">
            <div><p className="text-sm font-semibold text-orange-800">Manual Reset</p><p className="text-xs text-orange-700">This will immediately reset all employee balances. Use with caution.</p></div>
            <button onClick={handleManualReset} disabled={isResetting} className="bg-orange-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors flex items-center shadow-sm disabled:opacity-50"><Zap size={16} className="mr-2" />{isResetting ? 'Resetting...' : `Run Reset Now`}</button>
          </div>
          <div className="mt-6 flex justify-end items-center border-t pt-4">
              {saveSuccess && <p className="text-sm text-green-600 mr-4">Policy saved successfully!</p>}
              <button onClick={handleSavePolicy} disabled={isSaving} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm disabled:bg-blue-400"><Save size={16} className="mr-2" />{isSaving ? 'Saving...' : 'Save Policy'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TimeOffSettings;