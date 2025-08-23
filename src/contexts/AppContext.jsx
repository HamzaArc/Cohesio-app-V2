// src/contexts/AppContext.jsx

import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient'; // UPDATED: Import Supabase client instead of Firebase

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [session, setSession] = useState(null); // ADDED: State for Supabase session

  // SUPABASE AUTH LISTENER: Replaces Firebase's onAuthStateChanged
  useEffect(() => {
    // Fetch the initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCurrentUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setCurrentUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Cleanup the listener on component unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // FETCH COMPANY ID: This effect runs when the current user changes
  useEffect(() => {
    const fetchCompanyId = async () => {
      if (currentUser) {
        setLoading(true);
        // Fetch the user's profile to get their company_id
        const { data, error } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', currentUser.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          setCompanyId(null);
        } else if (data) {
          setCompanyId(data.company_id);
        }
        setLoading(false);
      } else {
        // Clear data on logout
        setCompanyId(null);
        setEmployees([]);
      }
    };

    fetchCompanyId();
  }, [currentUser]);

  // FETCH EMPLOYEES: This effect runs when the companyId is available
  useEffect(() => {
    if (companyId) {
      const fetchEmployees = async () => {
        setLoading(true);
        // Fetch all employees for the current company
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .eq('company_id', companyId)
          .order('name', { ascending: true });

        if (error) {
          console.error('Error fetching employees:', error);
        } else {
          setEmployees(data);
        }
        setLoading(false);
      };

      fetchEmployees();
    }
  }, [companyId]);

  const value = {
    employees,
    loading,
    companyId,
    currentUser,
    session, // Pass session down for other components
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};