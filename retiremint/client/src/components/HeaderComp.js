import { useNavigate } from 'react-router-dom';
import React from 'react';
import '../Stylesheets/Header.css';

function Header() {
  const isLoggedIn = !!localStorage.getItem('userId');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('latestReportId');
    navigate('/login');
  };

  const navigateTo = (path) => {
    navigate(path);
  };

  return (
    <div className="header">
      <h1 className="header-title" onClick={() => navigateTo('/dashboard')}>RetireMint</h1>
      <div className="header-subtitle">Lifetime Financial Planner</div>
      
      {isLoggedIn && (
        <div className="header-buttons">
          <button className="header-btn" onClick={() => navigateTo('/profile')}>Profile</button>
          <button className="header-btn" onClick={handleLogout}>Logout</button>
        </div>
      )}
    </div>
  );
}

export default Header;

