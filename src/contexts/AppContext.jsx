// src/contexts/AppContext.jsx

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCurrentUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setCurrentUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchCompanyId = async () => {
      if (currentUser) {
        setLoading(true);
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
        setCompanyId(null);
        setEmployees([]);
      }
    };

    fetchCompanyId();
  }, [currentUser]);
  
  // Create a reusable function to fetch employees
  const fetchEmployees = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
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
  }, [companyId]);

  // Fetch employees when companyId changes
  useEffect(() => {
    fetchEmployees();
  }, [companyId, fetchEmployees]);

  const value = {
    employees,
    loading,
    companyId,
    currentUser,
    session,
    refetchEmployees: fetchEmployees, // Expose the refetch function
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};