import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

import Layout from './components/Layout';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import People from './pages/People';
import EmployeeProfile from './pages/EmployeeProfile';
import Payroll from './pages/Payroll';
import RunPayroll from './pages/RunPayroll';
import PayrollDetails from './pages/PayrollDetails';
import TimeOff from './pages/TimeOff';
import Performance from './pages/Performance';
import TemplateEditor from './pages/TemplateEditor';
import TakeReview from './pages/TakeReview';
import ReviewSummary from './pages/ReviewSummary';
import Surveys from './pages/Surveys';
import SurveyStudio from './pages/SurveyStudio';
import TakeSurvey from './pages/TakeSurvey'; // Import new page
import SurveyResults from './pages/SurveyResults'; // Import new page
import Documents from './pages/Documents';
import Training from './pages/Training';
import Reporting from './pages/Reporting';
import Company from './pages/Company';
import Settings from './pages/Settings';
import Features from './pages/Features';
import Pricing from './pages/Pricing';
import Integrations from './pages/Integrations';
import About from './pages/About';
import Careers from './pages/Careers';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const ProtectedRoute = ({ children }) => {
    const location = useLocation();
    if (!currentUser) { return <Navigate to="/landing" state={{ from: location }} replace />; }
    return children;
  };

  const PublicRoute = ({ children }) => {
    return currentUser ? <Navigate to="/dashboard" /> : children;
  };
  
  const SurveyStudioWrapper = () => {
    const location = useLocation();
    return <SurveyStudio key={location.pathname} />;
  }

  if (loading) { return <div className="flex items-center justify-center h-screen">Loading Application...</div>; }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="people" element={<People />} />
          <Route path="people/:employeeId" element={<EmployeeProfile />} />
          <Route path="payroll" element={<Payroll />} />
          <Route path="payroll/run/:runId" element={<RunPayroll />} />
          <Route path="payroll/records/:runId" element={<PayrollDetails />} />
          <Route path="time-off" element={<TimeOff />} />
          {/* Performance routes are now removed */}
          <Route path="surveys" element={<Surveys />} />
          <Route path="surveys/create" element={<SurveyStudioWrapper />} />
          <Route path="surveys/edit/:surveyId" element={<SurveyStudioWrapper />} /> 
          <Route path="surveys/take/:surveyId" element={<TakeSurvey />} />
          <Route path="surveys/results/:surveyId" element={<SurveyResults />} /> 
          <Route path="documents" element={<Documents />} />
          <Route path="training" element={<Training />} />
          <Route path="reporting" element={<Reporting />} />
          <Route path="company" element={<Company />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        
        {/* Public Routes */}
        <Route path="/landing" element={<PublicRoute><LandingPage /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />
        <Route path="/features" element={<PublicRoute><Features /></PublicRoute>} />
        <Route path="/pricing" element={<PublicRoute><Pricing /></PublicRoute>} />
        <Route path="/integrations" element={<PublicRoute><Integrations /></PublicRoute>} />
        <Route path="/about" element={<PublicRoute><About /></PublicRoute>} />
        <Route path="/careers" element={<PublicRoute><Careers /></PublicRoute>} />
        <Route path="/contact" element={<PublicRoute><Contact /></PublicRoute>} />
        <Route path="/privacy" element={<PublicRoute><Privacy /></PublicRoute>} />
        <Route path="/terms" element={<PublicRoute><Terms /></PublicRoute>} />

        <Route path="*" element={<Navigate to="/landing" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;