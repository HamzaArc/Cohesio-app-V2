// src/components/InviteEmployeeModal.jsx

import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { X, AtSign, Clipboard, Check } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

function InviteEmployeeModal({ isOpen, onClose, onInvitationSent }) {
  const { companyId } = useAppContext();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [invitationLink, setInvitationLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !companyId) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setError('');
    setInvitationLink('');

    try {
      // Call the new, secure Supabase function to create the invite
      const { data: newInvite, error: rpcError } = await supabase.rpc('create_invitation', {
        invite_email: email,
        invite_company_id: companyId
      });

      if (rpcError) throw rpcError;

      // The RPC function returns an array, we need the first element
      const inviteData = newInvite[0];

      if (!inviteData || !inviteData.token) {
        throw new Error("Failed to retrieve invitation token from server.");
      }

      const url = `${window.location.origin}/accept-invite/${inviteData.token}`;
      setInvitationLink(url);

    } catch (err) {
      // Check for a unique constraint violation specifically
      if (err.message && err.message.includes('duplicate key value violates unique constraint "invitations_company_email_unique"')) {
        setError('An invitation has already been sent to this email address.');
      } else {
        setError('Failed to create invitation. Please try again or contact support.');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(invitationLink).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleClose = () => {
    setEmail('');
    setError('');
    setInvitationLink('');
    setCopied(false);
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

        {invitationLink ? (
            <div>
                <p className="text-sm text-gray-600 mb-2">Invitation created! Share this link with the new employee to set up their account.</p>
                <div className="relative">
                    <input type="text" value={invitationLink} readOnly className="w-full p-2 pr-10 border border-gray-300 rounded-md bg-gray-50 text-sm" />
                    <button onClick={handleCopy} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-blue-600">
                        {copied ? <Check size={16} className="text-green-600" /> : <Clipboard size={16} />}
                    </button>
                </div>
                <button onClick={handleClose} className="mt-6 w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">
                    Done
                </button>
            </div>
        ) : (
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
                    {loading ? 'Creating...' : 'Create Invitation Link'}
                    </button>
                </div>
            </form>
        )}
      </div>
    </div>
  );
}

export default InviteEmployeeModal;