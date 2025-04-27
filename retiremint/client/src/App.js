import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/DashboardComp';
import NewScenario from './components/NewScenario';
import LoginPage from './components/LoginPage';
import UserProfileForm from './components/ProfileSetup';
import ProfileView from './components/ProfileView';
import SimulationResults from './components/SimulationResults';
import { useState, useEffect } from 'react';
import React from 'react';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('userId');
    const firstTime = params.get('firstTime') === 'true';

    if (userId) {
      localStorage.setItem('userId', userId);
      window.history.replaceState(null, '', '/');
      setIsLoggedIn(true);
      setIsFirstTime(firstTime);
    } else {
      // Check if user is already logged in
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        setIsLoggedIn(true);
      }
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          isLoggedIn ? (
            isFirstTime ? <Navigate to="/profile-setup" /> : <Navigate to="/dashboard" />
          ) : (
            <LoginPage />
          )
        } />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/new-scenario/:reportId" element={<NewScenario />} />
        <Route path="/profile-setup" element={<UserProfileForm onComplete={() => setIsFirstTime(false)} />} />
        <Route path="/profile" element={<ProfileView />} />
        <Route path="/simulation-results" element={<SimulationResults />} />
        <Route path="/simulation-results/:reportId" element={<SimulationResults />} />
      </Routes>
    </Router>
  );
}

export default App;
