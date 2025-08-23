import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { X, AlertCircle } from 'lucide-react';
import DatalistInput from './DatalistInput'; // Import the new component
import { useAppContext } from '../contexts/AppContext';

// A reusable input component with validation display
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

function AddEmployeeModal({ isOpen, onClose, onEmployeeAdded }) {
  const { companyId } = useAppContext();
  const [formData, setFormData] = useState({
    name: '', email: '', position: '', department: '', hireDate: '', status: 'active',
    phone: '', address: '', gender: '', compensation: '', employmentType: 'Full-time',
    vacationBalance: 15, sickBalance: 5, personalBalance: 3,
    managerEmail: '',
    emergencyContactName: '', emergencyContactRelationship: '', emergencyContactPhone: '',
  });
  const [errors, setErrors] = useState({});
  const [allEmployees, setAllEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && companyId) {
      const fetchData = async () => {
        const snapshot = await getDocs(collection(db, 'companies', companyId, 'employees'));
        const employeesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllEmployees(employeesList);

        // Extract unique department names
        const deptSet = new Set(employeesList.map(emp => emp.department).filter(Boolean));
        setDepartments([...deptSet]);
      };
      fetchData();
    }
  }, [isOpen, companyId]);

  const validate = (data = formData) => {
      const newErrors = {};
      if (!data.name) newErrors.name = 'Full name is required.';
      if (!data.email) {
          newErrors.email = 'Email is required.';
      } else if (!/\S+@\S+\.\S+/.test(data.email)) {
          newErrors.email = 'Email address is invalid.';
      }
      if (!data.position) newErrors.position = 'Position is required.';
      if (!data.hireDate) newErrors.hireDate = 'Hire date is required.';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || !companyId) {
      return;
    }
    setLoading(true);

    try {
      await addDoc(collection(db, 'companies', companyId, 'employees'), {
        ...formData,
        vacationBalance: Number(formData.vacationBalance) || 0,
        sickBalance: Number(formData.sickBalance) || 0,
        personalBalance: Number(formData.personalBalance) || 0,
      });
      onEmployeeAdded();
      handleClose();
    } catch (err) {
      setErrors({ form: 'Failed to add employee. Please try again.' });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
        name: '', email: '', position: '', department: '', hireDate: '', status: 'active',
        phone: '', address: '', gender: '', compensation: '', employmentType: 'Full-time',
        vacationBalance: 15, sickBalance: 5, personalBalance: 3, managerEmail: '',
        emergencyContactName: '', emergencyContactRelationship: '', emergencyContactPhone: '',
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  const isFormValid = Object.keys(errors).length === 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl flex flex-col max-h-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Add New Employee</h2>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-200"><X size={24} /></button>
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

            <ValidatedInput id="hireDate" label="Hire Date" value={formData.hireDate} onChange={handleChange} error={errors.hireDate} type="date" required />
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
              <select id="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"><option value="active">Active</option><option value="onboarding">Onboarding</option></select>
            </div>
            <ValidatedInput id="employmentType" label="Employment Type" value={formData.employmentType} onChange={handleChange} error={errors.employmentType} type="text" />
            <ValidatedInput id="compensation" label="Compensation" value={formData.compensation} onChange={handleChange} error={errors.compensation} type="text" placeholder="e.g., 50000 / year" />
            <div className="md:col-span-2">
                <label htmlFor="managerEmail" className="block text-sm font-medium text-gray-700">Reports To</label>
                <select id="managerEmail" value={formData.managerEmail} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"><option value="">No Manager</option>{allEmployees.map(emp => <option key={emp.id} value={emp.email}>{emp.name}</option>)}</select>
            </div>

            <h3 className="md:col-span-2 text-lg font-semibold text-gray-700 border-b pb-2 mt-4">Emergency Contact</h3>
            <ValidatedInput id="emergencyContactName" label="Contact Name" value={formData.emergencyContactName} onChange={handleChange} error={errors.emergencyContactName} type="text" />
            <ValidatedInput id="emergencyContactRelationship" label="Relationship" value={formData.emergencyContactRelationship} onChange={handleChange} error={errors.emergencyContactRelationship} type="text" />
            <ValidatedInput id="emergencyContactPhone" label="Contact Phone" value={formData.emergencyContactPhone} onChange={handleChange} error={errors.emergencyContactPhone} type="tel" />
            
            <h3 className="md:col-span-2 text-lg font-semibold text-gray-700 border-b pb-2 mt-4">Time Off Balances (Days)</h3>
            <ValidatedInput id="vacationBalance" label="Vacation" value={formData.vacationBalance} onChange={handleChange} error={errors.vacationBalance} type="number" />
            <ValidatedInput id="sickBalance" label="Sick" value={formData.sickBalance} onChange={handleChange} error={errors.sickBalance} type="number" />
            <ValidatedInput id="personalBalance" label="Personal" value={formData.personalBalance} onChange={handleChange} error={errors.personalBalance} type="number" />
          </div>
          {errors.form && <p className="text-red-500 text-sm mt-4 text-center">{errors.form}</p>}
          <div className="mt-8 pt-6 border-t flex justify-end">
            <button type="button" onClick={handleClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300">Cancel</button>
            <button type="submit" disabled={loading || !isFormValid} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                {loading ? 'Saving...' : 'Save Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddEmployeeModal;