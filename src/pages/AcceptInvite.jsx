// src/pages/AcceptInvite.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { User, Lock, CheckCircle } from 'lucide-react';

function AcceptInvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState(null);
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError("Invitation token is missing.");
        setLoading(false);
        return;
      }

      // This is the key change: Querying the table directly instead of using an RPC function.
      const { data, error: selectError } = await supabase
        .from('invitations')
        .select('email, company_id')
        .eq('token', token)
        .single();

      if (selectError || !data) {
        console.error('Error verifying token:', selectError);
        setError("This invitation is invalid or has expired.");
        setInvitation(null);
      } else {
        setInvitation(data);
      }
      setLoading(false);
    };

    verifyToken();
  }, [token]);

  const handleAccept = async (e) => {
    e.preventDefault();
    if (!fullName || !password) {
      setError('Please fill out all fields.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password: password,
      });
      if (authError) throw authError;
      const user = authData.user;
      if (!user) throw new Error("Sign up failed, user not created.");

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ id: user.id, company_id: invitation.company_id, email: user.email });
      if (profileError) throw profileError;

      const { error: employeeError } = await supabase
        .from('employees')
        .insert({
          user_id: user.id,
          company_id: invitation.company_id,
          name: fullName,
          email: invitation.email,
          status: 'active',
          position: 'New Hire',
          hire_date: new Date().toISOString().split('T')[0],
        });
      if (employeeError) throw employeeError;

      const { error: deleteError } = await supabase
        .from('invitations')
        .delete()
        .eq('token', token);
      if (deleteError) throw deleteError;

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: invitation.email,
        password: password,
      });
      if (signInError) throw signInError;

      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2000);

    } catch (err) {
      setError(err.message || 'Failed to create account. The user may already exist.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Verifying invitation...</div>;
  }

  if (success) {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800">Account Created!</h2>
            <p className="text-gray-600">Redirecting you to your dashboard...</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <Link to="/landing" className="text-3xl font-bold text-primary">Cohesio</Link>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              {invitation ? `Join Your Team` : 'Invalid Invitation'}
            </h2>
        </div>

        {invitation ? (
            <div className="bg-white p-8 rounded-lg shadow-md border">
                <p className="text-center text-sm text-gray-600 mb-6">
                    You've been invited to join your company on Cohesio. Complete your account setup below.
                </p>
                <form onSubmit={handleAccept} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                        <input id="email" type="email" value={invitation.email} readOnly disabled className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed" />
                    </div>
                    <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name</label>
                        <div className="mt-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User className="h-5 w-5 text-gray-400" /></div>
                            <input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-highlight" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Create Password</label>
                        <div className="mt-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-gray-400" /></div>
                            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength="6" className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-highlight" />
                        </div>
                    </div>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <div>
                        <button type="submit" disabled={loading} className="w-full py-2 px-4 bg-primary text-white font-bold rounded-md hover:bg-secondary transition-colors disabled:bg-gray-400">
                            {loading ? 'Creating Account...' : 'Accept Invitation & Create Account'}
                        </button>
                    </div>
                </form>
            </div>
        ) : (
            <div className="bg-white p-8 rounded-lg shadow-md border text-center">
                <p className="text-red-600">{error}</p>
                <Link to="/login" className="mt-4 inline-block font-medium text-highlight hover:underline">
                    Go to Login
                </Link>
            </div>
        )}
      </div>
    </div>
  );
}

export default AcceptInvite;