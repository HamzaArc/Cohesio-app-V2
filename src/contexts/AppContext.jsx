import React, { createContext, useState, useEffect, useContext } from 'react';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, doc, getDoc } from 'firebase/firestore';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Start loading whenever the user changes
        setLoading(true); 
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setCompanyId(userData.companyId);
          // The employee useEffect will now run and set loading to false
        } else {
          console.error("User profile not found in Firestore.");
          setCompanyId(null);
          setLoading(false);
        }
      } else {
        // No user, not loading
        setCompanyId(null);
        setEmployees([]); // Clear data on logout
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);
  
  useEffect(() => {
    // If there's no companyId, we can't fetch data.
    if (!companyId) {
      return;
    }

    const employeesCollectionRef = collection(db, 'companies', companyId, 'employees');
    const q = query(employeesCollectionRef, orderBy("name"));
    
    const unsubscribeEmployees = onSnapshot(q, (snapshot) => {
      const emps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEmployees(emps);
      setLoading(false); // Data is loaded, stop loading
    }, (error) => {
      console.error("Error fetching employees:", error);
      setLoading(false);
    });

    return () => unsubscribeEmployees();
  }, [companyId]); // This effect now depends only on companyId

  const value = {
    employees,
    loading,
    companyId,
    currentUser,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};