import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { createOffCyclePayroll } from '../services/payrollService';

function CreateOffCyclePayrollModal({ isOpen, onClose, onPayrollRun }) {
  const { employees, companyId } = useAppContext();
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [payDay, setPayDay] = useState('');
  const [reason, setReason] = useState('Final Pay');
  const [lineItems, setLineItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { id: Date.now(), description: '', total: 0 }]);
  };

  const handleRemoveLineItem = (id) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const handleLineItemChange = (id, field, value) => {
    setLineItems(lineItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmployee || !payDay) {
      setError('Please select an employee and a pay day.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      await createOffCyclePayroll(companyId, { selectedEmployee, payDay, reason, lineItems });
      onPayrollRun(); // This should trigger a refetch in the parent component
      handleClose();
    } catch (err) {
      setError('Failed to run off-cycle payroll.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedEmployee(null); setPayDay(''); setReason('Final Pay');
    setLineItems([]); setError(''); onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Create Off-Cycle Payroll</h2>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-200"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto p-1">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label htmlFor="employee" className="block text-sm font-medium text-gray-700">Select Employee</label><select id="employee" onChange={(e) => setSelectedEmployee(employees.find(emp => emp.id === e.target.value))} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"><option value="">Choose employee...</option>{employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}</select></div>
                <div><label htmlFor="payDay" className="block text-sm font-medium text-gray-700">Pay Day</label><input type="date" id="payDay" value={payDay} onChange={(e) => setPayDay(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" /></div>
            </div>
            <div><label htmlFor="reason" className="block text-sm font-medium text-gray-700">Reason</label><input type="text" id="reason" value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" /></div>
            
            <div className="pt-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Earnings & Deductions</h3>
                <div className="space-y-2">
                    {lineItems.map(item => (
                        <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-7"><input type="text" value={item.description} onChange={e => handleLineItemChange(item.id, 'description', e.target.value)} placeholder="Description (e.g., Final Pay, Bonus)" className="w-full p-1 border rounded-md text-sm" /></div>
                            <div className="col-span-4"><input type="number" value={item.total} onChange={e => handleLineItemChange(item.id, 'total', e.target.value)} placeholder="Amount" className="w-full p-1 border rounded-md text-sm" /></div>
                            <div className="col-span-1"><button type="button" onClick={() => handleRemoveLineItem(item.id)} className="p-1 text-red-500 hover:bg-red-100 rounded-full"><Trash2 size={16}/></button></div>
                        </div>
                    ))}
                </div>
                <button type="button" onClick={handleAddLineItem} className="mt-2 text-xs font-semibold text-blue-600 flex items-center gap-1 hover:underline"><Plus size={14}/>Add Line</button>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          <div className="mt-8 pt-6 border-t flex justify-end">
            <button type="button" onClick={handleClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300">Cancel</button>
            <button type="submit" disabled={loading} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400">{loading ? 'Saving...' : 'Run Off-Cycle Payroll'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateOffCyclePayrollModal;