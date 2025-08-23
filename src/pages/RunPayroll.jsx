import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Check, Save } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { subscribeToPayrollRun, savePayrollDraft, finalizePayroll } from '../services/payrollService';

const Step = ({ number, label, isActive }) => ( <div className="flex items-center"><div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>{isActive ? <Check size={20} /> : number}</div><p className={`ml-3 font-semibold ${isActive ? 'text-blue-600' : 'text-gray-600'}`}>{label}</p></div> );

function RunPayroll() {
  const { runId } = useParams();
  const { employees, loading: employeesLoading } = useAppContext();
  const [payrollRun, setPayrollRun] = useState(null);
  const [employeeData, setEmployeeData] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!runId) {
      setLoading(false);
      return;
    }
    const subscription = subscribeToPayrollRun(runId, (run) => {
      if (run) {
        setPayrollRun({ ...run, periodLabel: run.period_label });

        if (employees.length > 0 && Object.keys(employeeData).length === 0) {
          const initialData = {};
          employees.forEach(emp => {
            initialData[emp.id] = run.employee_data?.[emp.id] || {
              baseSalary: emp.compensation?.includes('/year') ? parseFloat(emp.compensation.replace(/[^0-9.]/g, '')) / 12 : 0,
              overtime: 0,
              bonuses: 0,
              benefits: 0,
              cnss: 0,
              amo: 0,
              ir: 0,
              otherDeductions: 0,
            };
          });
          setEmployeeData(initialData);
        }
      } else {
        navigate('/payroll');
      }
      setLoading(false);
    });
    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, [runId, employees, navigate]);

  const handleDataChange = useCallback((empId, field, value) => {
    setEmployeeData(prev => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        [field]: Number(value) || 0
      }
    }));
  }, []);

  const calculatedData = useMemo(() => {
    const calculated = {};
    let totalGross = 0;
    let totalNet = 0;
    Object.keys(employeeData).forEach(empId => {
      const data = employeeData[empId];
      const grossPay = (data.baseSalary || 0) + (data.overtime || 0) + (data.bonuses || 0) + (data.benefits || 0);
      const totalDeductions = (data.cnss || 0) + (data.amo || 0) + (data.ir || 0) + (data.otherDeductions || 0);
      const netPay = grossPay - totalDeductions;
      calculated[empId] = { grossPay, netPay };
      totalGross += grossPay;
      totalNet += netPay;
    });
    return { employeeTotals: calculated, companyTotals: { totalGross, totalNet } };
  }, [employeeData]);

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      await savePayrollDraft(runId, employeeData);
    } catch (error) {
      console.error("Failed to save draft:", error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleFinalize = async () => {
    if (!window.confirm("Are you sure you want to finalize this payroll run? This action cannot be undone.")) return;
    setIsSaving(true);
    try {
      await finalizePayroll(runId, employeeData, calculatedData.companyTotals);
      navigate(`/payroll/records/${runId}`);
    } catch (error) {
      console.error("Failed to finalize payroll:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || employeesLoading) { return <div className="p-8">Loading Payroll Worksheet...</div>; }

  return (
    <div className="p-8">
      <header className="mb-8">
        <Link to="/payroll" className="text-sm text-blue-600 font-semibold inline-block hover:underline mb-2">&larr; Back to Payroll Hub</Link>
        <h1 className="text-3xl font-bold text-gray-800">Run Payroll: {payrollRun?.periodLabel}</h1>
      </header>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="p-2 font-semibold text-gray-600">Employee</th>
                        <th className="p-2 font-semibold text-gray-600">Base Salary</th>
                        <th className="p-2 font-semibold text-gray-600">Bonuses</th>
                        <th className="p-2 font-semibold text-gray-600">Gross Pay</th>
                        <th className="p-2 font-semibold text-gray-600">CNSS/AMO</th>
                        <th className="p-2 font-semibold text-gray-600">IR</th>
                        <th className="p-2 font-semibold text-gray-600">Other Deductions</th>
                        <th className="p-2 font-semibold text-gray-600">Net Pay</th>
                    </tr>
                </thead>
                <tbody>
                    {employees.map(emp => (
                        <tr key={emp.id} className="border-b">
                            <td className="p-2 font-semibold">{emp.name}</td>
                            <td><input type="number" value={employeeData[emp.id]?.baseSalary || ''} onChange={e => handleDataChange(emp.id, 'baseSalary', e.target.value)} className="w-24 p-1 border rounded-md" /></td>
                            <td><input type="number" value={employeeData[emp.id]?.bonuses || ''} onChange={e => handleDataChange(emp.id, 'bonuses', e.target.value)} className="w-24 p-1 border rounded-md" /></td>
                            <td className="p-2 font-semibold text-green-600 bg-green-50">${(calculatedData.employeeTotals[emp.id]?.grossPay || 0).toFixed(2)}</td>
                            <td><input type="number" value={employeeData[emp.id]?.cnss || ''} onChange={e => handleDataChange(emp.id, 'cnss', e.target.value)} className="w-24 p-1 border rounded-md" /></td>
                            <td><input type="number" value={employeeData[emp.id]?.ir || ''} onChange={e => handleDataChange(emp.id, 'ir', e.target.value)} className="w-24 p-1 border rounded-md" /></td>
                            <td><input type="number" value={employeeData[emp.id]?.otherDeductions || ''} onChange={e => handleDataChange(emp.id, 'otherDeductions', e.target.value)} className="w-24 p-1 border rounded-md" /></td>
                            <td className="p-2 font-bold text-red-600 bg-red-50">${(calculatedData.employeeTotals[emp.id]?.netPay || 0).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <div className="mt-6 pt-6 border-t flex justify-between items-center">
            <div>
                <p className="text-gray-600">Total Gross Pay: <span className="font-bold text-green-600">${(calculatedData.companyTotals.totalGross || 0).toFixed(2)}</span></p>
                <p className="text-gray-600">Total Net Pay: <span className="font-bold text-red-600">${(calculatedData.companyTotals.totalNet || 0).toFixed(2)}</span></p>
            </div>
            <div className="flex gap-4">
                <button onClick={handleSaveDraft} disabled={isSaving} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 flex items-center"><Save size={16} className="mr-2"/>{isSaving ? 'Saving...' : 'Save Draft'}</button>
                <button onClick={handleFinalize} disabled={isSaving} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 flex items-center"><Check size={16} className="mr-2"/>Finalize Payroll</button>
            </div>
        </div>
      </div>
    </div>
  );
}

export default RunPayroll;