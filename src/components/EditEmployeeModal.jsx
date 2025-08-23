// src/components/EditEmployeeModal.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // UPDATED: Import Supabase client
import { X, AlertCircle } from 'lucide-react';
import DatalistInput from './DatalistInput';
import { useAppContext } from '../contexts/AppContext';

const ValidatedInput = ({ id, label, value, onChange, error, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
        <input
            id={id}
            value={value}
            onChange={onChange}
            className={`mt-1 block w-full border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500`}
            {...props}
        />
        {error && <p className="mt-1 text-xs text-red-600 flex items-center"><AlertCircle size={14} className="mr-1"/>{error}</p>}
    </div>
);

function EditEmployeeModal({ isOpen, onClose, employee, onEmployeeUpdated }) {
  const { companyId, employees } = useAppContext();
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [allEmployees, setAllEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || '', email: employee.email || '', position: employee.position || '',
        department: employee.department || '', hire_date: employee.hire_date || '', status: employee.status || 'active',
        phone: employee.phone || '', address: employee.address || '', gender: employee.gender || '',
        compensation: employee.compensation || '', employment_type: employee.employment_type || 'Full-time',
        manager_email: employee.manager_email || '',
        emergency_contact_name: employee.emergency_contact_name || '', emergency_contact_relationship: employee.emergency_contact_relationship || '', emergency_contact_phone: employee.emergency_contact_phone || '',
        vacation_balance: employee.vacation_balance ?? 15, sick_balance: employee.sick_balance ?? 5, personal_balance: employee.personal_balance ?? 3,
      });
      setErrors({});
    }
    if (isOpen && employee && companyId) {
        const otherEmployees = employees.filter(e => e.id !== employee?.id);
        setAllEmployees(otherEmployees);

        const deptSet = new Set(employees.map(emp => emp.department).filter(Boolean));
        setDepartments([...deptSet]);
    }
  }, [isOpen, employee, companyId, employees]);

  const validate = (data = formData) => {
      const newErrors = {};
      if (!data.name) newErrors.name = 'Full name is required.';
      if (!data.email) {
          newErrors.email = 'Email is required.';
      } else if (!/\S+@\S+\.\S+/.test(data.email)) {
          newErrors.email = 'Email address is invalid.';
      }
      if (!data.position) newErrors.position = 'Position is required.';
      if (!data.hire_date) newErrors.hire_date = 'Hire date is required.';
      if (data.phone && !/^[0-9\s+()-]*$/.test(data.phone)) {
        newErrors.phone = 'Invalid phone number format.';
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    const newFormData = { ...formData, [id]: value };
    setFormData(newFormData);
    validate(newFormData);
  };

  // SUPABASE UPDATE LOGIC
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || !companyId) {
      return;
    }
    setLoading(true);

    try {
      // Update the employee record in the 'employees' table
      const { error } = await supabase
        .from('employees')
        .update({
            ...formData,
            vacation_balance: Number(formData.vacation_balance) || 0,
            sick_balance: Number(formData.sick_balance) || 0,
            personal_balance: Number(formData.personal_balance) || 0,
        })
        .eq('id', employee.id);

        if (error) throw error;

      onEmployeeUpdated();
      onClose();
    } catch (err) {
      setErrors({ form: 'Failed to update employee. Please try again.' });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen || !employee) return null;

  const isFormValid = Object.keys(errors).length === 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl flex flex-col max-h-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Edit Employee</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6" noValidate>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <h3 className="md:col-span-2 text-lg font-semibold text-gray-700 border-b pb-2">Basic Information</h3>
            <ValidatedInput id="name" label="Full Name" value={formData.name} onChange={handleChange} error={errors.name} type="text" required />
            <ValidatedInput id="email" label="Email" value={formData.email} onChange={handleChange} error={errors.email} type="email" required />
            <ValidatedInput id="phone" label="Phone (Work)" value={formData.phone} onChange={handleChange} error={errors.phone} type="tel" />
            <ValidatedInput id="address" label="Address" value={formData.address} onChange={handleChange} error={errors.address} type="text" />
            
            <h3 className="md:col-span-2 text-lg font-semibold text-gray-700 border-b pb-2 mt-4">Job Information</h3>
            <ValidatedInput id="position" label="Position" value={formData.position} onChange={handleChange} error={errors.position} type="text" required />
            
            <DatalistInput id="department" label="Department" value={formData.department} onChange={handleChange} error={errors.department} options={departments} type="text" placeholder="Select or type to create new"/>

            {/* UPDATED: id changed to match database schema */}
            <ValidatedInput id="hire_date" label="Hire Date" value={formData.hire_date} onChange={handleChange} error={errors.hire_date} type="date" required />
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
              <select id="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"><option value="active">Active</option><option value="onboarding">Onboarding</option></select>
            </div>
            {/* UPDATED: id changed to match database schema */}
            <ValidatedInput id="employment_type" label="Employment Type" value={formData.employment_type} onChange={handleChange} error={errors.employment_type} type="text" />
            <ValidatedInput id="compensation" label="Compensation" value={formData.compensation} onChange={handleChange} error={errors.compensation} type="text" placeholder="e.g., 50000 / year" />
            <div className="md:col-span-2">
                {/* UPDATED: id changed to match database schema */}
                <label htmlFor="manager_email" className="block text-sm font-medium text-gray-700">Reports To</label>
                <select id="manager_email" value={formData.manager_email} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"><option value="">No Manager</option>{allEmployees.map(emp => <option key={emp.id} value={emp.email}>{emp.name}</option>)}</select>
            </div>

            <h3 className="md:col-span-2 text-lg font-semibold text-gray-700 border-b pb-2 mt-4">Emergency Contact</h3>
            {/* UPDATED: ids changed to match database schema */}
            <ValidatedInput id="emergency_contact_name" label="Contact Name" value={formData.emergency_contact_name} onChange={handleChange} error={errors.emergency_contact_name} type="text" />
            <ValidatedInput id="emergency_contact_relationship" label="Relationship" value={formData.emergency_contact_relationship} onChange={handleChange} error={errors.emergency_contact_relationship} type="text" />
            <ValidatedInput id="emergency_contact_phone" label="Contact Phone" value={formData.emergency_contact_phone} onChange={handleChange} error={errors.emergency_contact_phone} type="tel" />
            
            <h3 className="md:col-span-2 text-lg font-semibold text-gray-700 border-b pb-2 mt-4">Time Off Balances (Days)</h3>
            {/* UPDATED: ids changed to match database schema */}
            <ValidatedInput id="vacation_balance" label="Vacation" value={formData.vacation_balance} onChange={handleChange} error={errors.vacation_balance} type="number" />
            <ValidatedInput id="sick_balance" label="Sick" value={formData.sick_balance} onChange={handleChange} error={errors.sick_balance} type="number" />
            <ValidatedInput id="personal_balance" label="Personal" value={formData.personal_balance} onChange={handleChange} error={errors.personal_balance} type="number" />
          </div>
          {errors.form && <p className="text-red-500 text-sm mt-4 text-center">{errors.form}</p>}
          <div className="mt-8 pt-6 border-t flex justify-end">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300">Cancel</button>
            <button type="submit" disabled={loading || !isFormValid} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditEmployeeModal;