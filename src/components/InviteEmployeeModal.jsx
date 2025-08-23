// src/components/InviteEmployeeModal.jsx

import React, { useState } from 'react';
import { supabase } from '../supabaseClient'; // UPDATED: Import Supabase
import { X, AtSign } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

function InviteEmployeeModal({ isOpen, onClose, onInvitationSent }) {
  const { companyId } = useAppContext();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // SUPABASE: Send invitation logic
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !companyId) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // Check if user already exists in this company
      const { data: existingEmployee, error: employeeError } = await supabase
        .from('employees')
        .select('id')
        .eq('company_id', companyId)
        .eq('email', email)
        .maybeSingle();

      if (employeeError) throw employeeError;
      if (existingEmployee) {
        setError('An employee with this email already exists in your company.');
        setLoading(false);
        return;
      }
      
      // Check if an invitation already exists
      const { data: existingInvite, error: inviteError } = await supabase
        .from('invitations')
        .select('id')
        .eq('company_id', companyId)
        .eq('email', email)
        .maybeSingle();
      
      if (inviteError) throw inviteError;
      if (existingInvite) {
        setError('An invitation has already been sent to this email address.');
        setLoading(false);
        return;
      }

      // Insert new invitation
      const { error: insertError } = await supabase
        .from('invitations')
        .insert({ email, company_id: companyId });

      if (insertError) throw insertError;

      onInvitationSent();
      handleClose();
    } catch (err) {
      setError('Failed to send invitation. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Invite Employee</h2>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-200"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Employee Email</label>
              <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <AtSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input 
                    type="email" 
                    id="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="name@company.com"
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
              </div>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          <div className="mt-8 flex justify-end">
            <button type="button" onClick={handleClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300">Cancel</button>
            <button type="submit" disabled={loading} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
              {loading ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InviteEmployeeModal;