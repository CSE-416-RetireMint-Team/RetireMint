import './App.css';
import React, { useState } from 'react';
import Dashboard from './components/dashboard';
import New_scenario from './components/new_scenario';
import LoginPage from './components/login_page';

function App() {

  const [current_page, set_current_page] = useState('login');
  let content;
  if (current_page === 'login') {
    content = <LoginPage set_current_page={set_current_page} />;
  } 
  else if (current_page === 'dashboard') {
    content = <Dashboard set_current_page={set_current_page} />;
  } else if (current_page === 'new_scenario') {
    content = <New_scenario set_current_page={set_current_page} />;
  }
  return (
    <div>
      {content}
      
    </div>
  );
}

export default App;
