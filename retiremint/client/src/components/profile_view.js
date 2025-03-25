import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Stylesheets/profile_view.css';
import Header from './header';

function ProfileView() {
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      setError('User not logged in');
      return;
    }

    fetch(`http://localhost:8000/user/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.message) throw new Error(data.message);
        setUserData(data);
      })
      .catch(err => setError(err.message));
  }, []);

  return (
    <div>
      <Header />
      <div className="profile-container">
        <h2>Your Profile</h2>

        {error && <p className="error-message">{error}</p>}

        {!userData ? (
            <p>Loading...</p>
        ) : (
            <div className="profile-field">
            <p><strong>Name:</strong> {userData.name}</p>
            <p><strong>Email:</strong> {userData.email}</p>
            <p><strong>Date of Birth:</strong> {userData.DOB ? new Date(userData.DOB).toLocaleDateString() : 'N/A'}</p>
            <p><strong>State:</strong> {userData.state || 'N/A'}</p>
            <p><strong>Marital Status:</strong> {userData.maritalStatus || 'N/A'}</p>
            <p><strong>Account Created:</strong> {new Date(userData.createdAt).toLocaleString()}</p>
            <p><strong>Last Updated:</strong> {new Date(userData.updatedAt).toLocaleString()}</p>
            </div>
        )}

        <button className="back-button" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
        </button>
        </div>
    </div>
  );
}

export default ProfileView;
