import React, { useState } from 'react';
import { X } from 'lucide-react';

function RunSpecificMonthModal({ isOpen, onClose, onRun, existingRuns }) {
  const [month, setMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [year, setYear] = useState(new Date().getFullYear());
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const periodId = `${year}-${month}`;
    if (existingRuns.some(run => run.period === periodId)) {
        setError('A payroll run for this month already exists. You can continue it from the Payroll History table.');
        return;
    }
    setError('');
    onRun(month, year);
  };
  
  const handleClose = () => {
      setError('');
      onClose();
  }

  if (!isOpen) return null;

  const months = [
    { value: '01', name: 'January' }, { value: '02', name: 'February' },
    { value: '03', name: 'March' }, { value: '04', name: 'April' },
    { value: '05', name: 'May' }, { value: '06', name: 'June' },
    { value: '07', name: 'July' }, { value: '08', name: 'August' },
    { value: '09', name: 'September' }, { value: '10', name: 'October' },
    { value: '11', name: 'November' }, { value: '12', name: 'December' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Run Payroll for a Specific Month</h2>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-200"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="month" className="block text-sm font-medium text-gray-700">Month</label>
              <select id="month" value={month} onChange={(e) => setMonth(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                {months.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700">Year</label>
              <input type="number" id="year" value={year} onChange={(e) => setYear(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          <div className="mt-8 flex justify-end">
            <button type="button" onClick={handleClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300">Cancel</button>
            <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">Start Payroll</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RunSpecificMonthModal;