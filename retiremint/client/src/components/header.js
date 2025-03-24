import React from 'react';

function Header({ set_current_page }) {
  const isLoggedIn = !!localStorage.getItem('userId');

  const handleLogout = () => {
    localStorage.removeItem('userId');
    window.location.href = '/'; 
  };

  return (
    <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h1 className="header_text">Lifetime Financial Planner</h1>
      {isLoggedIn && (
        <div className="header-buttons">
          <button className="header-btn" onClick={() => set_current_page('profile_view')}>Profile</button>
          <button className="header-btn" onClick={handleLogout}>Logout</button>
        </div>
      )}
    </div>
  );
}

export default Header;

