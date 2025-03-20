import './App.css';
import React, { useState } from 'react';
import Dashboard from './components/dashboard';
import New_scenario from './components/new_scenario';

function App() {

  const [current_page, set_current_page] = useState('dashboard');
  let content;
  if (current_page === 'dashboard') {
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
