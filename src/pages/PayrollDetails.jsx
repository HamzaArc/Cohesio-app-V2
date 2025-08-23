import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Payslip from '../components/Payslip'; 
import { useAppContext } from '../contexts/AppContext';
import { subscribeToPayrollRun, getPayrollSettings } from '../services/payrollService';

function PayrollDetails() {
  const { runId } = useParams();
  const { employees, companyId } = useAppContext();
  const [payrollRun, setPayrollRun] = useState(null);
  const [payrollSettings, setPayrollSettings] = useState(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!runId || !companyId) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchSettings = async () => {
      const settings = await getPayrollSettings(companyId);
      if (isMounted) {
        setPayrollSettings(settings);
      }
    };

    fetchSettings();

    const subscription = subscribeToPayrollRun(runId, (runData) => {
      if (isMounted) {
        if (runData) {
          const formattedRun = {
            ...runData,
            periodLabel: runData.period_label,
            employeeData: runData.employee_data || {},
          };
          setPayrollRun(formattedRun);
          if (!selectedEmployeeId && formattedRun.employeeData && Object.keys(formattedRun.employeeData).length > 0) {
            setSelectedEmployeeId(Object.keys(formattedRun.employeeData)[0]);
          }
        } else {
          console.error("Payroll run not found!");
        }
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, [runId, companyId, selectedEmployeeId]);

  if (loading) { return <div className="p-8">Loading Payroll Record...</div>; }
  if (!payrollRun) { return <div className="p-8">Payroll Record not found.</div>; }

  const selectedEmployeePayslipData = payrollRun.employeeData?.[selectedEmployeeId];
  const selectedEmployeeProfile = employees.find(emp => emp.id === selectedEmployeeId);

  return (
    <div className="p-8">
      <header className="mb-8">
        <Link to="/payroll" className="text-sm text-blue-600 font-semibold inline-block hover:underline mb-2">&larr; Back to Payroll Hub</Link>
        <h1 className="text-3xl font-bold text-gray-800">Payroll Record: {payrollRun.periodLabel}</h1>
        <p className="text-gray-500">Status: <span className="font-semibold">{payrollRun.status}</span></p>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-sm border border-gray-200 self-start">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Employees ({Object.keys(payrollRun.employeeData).length})</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {Object.keys(payrollRun.employeeData).map(empId => {
              const empProfile = employees.find(e => e.id === empId);
              return (
                <button 
                  key={empId} 
                  onClick={() => setSelectedEmployeeId(empId)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${selectedEmployeeId === empId ? 'bg-blue-100 text-blue-700 font-semibold' : 'hover:bg-gray-50'}`}
                >
                  {empProfile?.name || 'Unknown Employee'}
                </button>
              )
            })}
          </div>
        </div>
        <div className="lg:col-span-2">
          {selectedEmployeePayslipData && selectedEmployeeProfile && payrollSettings ? (
            <Payslip payrollRun={payrollRun} employeeData={selectedEmployeePayslipData} employeeProfile={selectedEmployeeProfile} companyInfo={payrollSettings} />
          ) : (
            <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-500">Select an employee to view their payslip.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PayrollDetails;