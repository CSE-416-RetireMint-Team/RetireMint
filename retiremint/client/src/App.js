import './App.css';
import React, { useState, useEffect } from 'react';
import Dashboard from './components/dashboard';
import New_scenario from './components/new_scenario';
import LoginPage from './components/login_page';
import UserProfileForm from './components/profile_setup';
import ProfileView from './components/profile_view';


function App() {
  const [current_page, set_current_page] = useState('login');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('userId');
    const firstTime = params.get('firstTime') === 'true';

    if (userId) {
      localStorage.setItem('userId', userId);
      window.history.replaceState(null, '', '/');

      if (firstTime) {
        set_current_page('profile_setup');
      } else {
        set_current_page('dashboard');
      }
    }
  }, []);

  let content;
  if (current_page === 'login') {
    content = <LoginPage set_current_page={set_current_page} />;
  } 
  else if (current_page === 'dashboard') {
    content = <Dashboard set_current_page={set_current_page} />;
  } else if (current_page === 'new_scenario') {
    content = <New_scenario set_current_page={set_current_page} />;
  }else if (current_page === 'profile_setup') {
    content = <UserProfileForm onComplete={() => set_current_page('dashboard')} />;
  }else if (current_page === 'profile_view') {
    content = <ProfileView set_current_page={set_current_page} />;
  }  

  return (
    <div>
      {content}
      
    </div>
  );
}

export default App;
