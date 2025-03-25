import React, { useEffect, useState } from 'react';
import '../Stylesheets/profile_view.css';
import Header from './header';

function ProfileView({ set_current_page }) {
  const [userData, setUserData] = useState(null);
  const [editData, setEditData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
        setEditData(data);
      })
      .catch(err => setError(err.message));
  }, []);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setEditData(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = async () => {
    const userId = localStorage.getItem('userId');
    try {
      const res = await fetch(`http://localhost:8000/user/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });
  
      if (!res.ok) throw new Error('Failed to update profile');
  
      const updated = await res.json();
      setUserData(updated);
      setEditData(updated);
      setIsEditing(false);
      setError(''); 
    } catch (err) {
      setError(err.message);
    }
  };
  
  return (
    <div>
      <Header set_current_page={set_current_page} />
      <div className="profile-container">
        <h2>Your Profile</h2>

        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        {!userData ? (
          <p>Loading...</p>
        ) : (
          <div className="profile-field">
            <p><strong>Name:</strong> {userData.name}</p>
            <p><strong>Email:</strong> {userData.email}</p>

            {isEditing ? (
              <>
                <label>Date of Birth:
                  <input type="date" id="DOB" value={editData.DOB?.substring(0, 10)} onChange={handleChange} />
                </label>
                <label>State:
                  <input id="state" value={editData.state} onChange={handleChange} />
                </label>
                <label>Marital Status:
                  <select id="maritalStatus" value={editData.maritalStatus} onChange={handleChange}>
                    <option value="individual">individual</option>
                    <option value="married">married</option>
                  </select>
                </label>
              </>
            ) : (
              <>
                <p><strong>Date of Birth:</strong> {userData.DOB ? new Date(userData.DOB).toLocaleDateString() : 'N/A'}</p>
                <p><strong>State:</strong> {userData.state || 'N/A'}</p>
                <p><strong>Marital Status:</strong> {userData.maritalStatus || 'N/A'}</p>
              </>
            )}

            <p><strong>Account Created:</strong> {new Date(userData.createdAt).toLocaleString()}</p>
            <p><strong>Last Updated:</strong> {new Date(userData.updatedAt).toLocaleString()}</p>
          </div>
        )}

        {isEditing ? (
          <>
            <button className="submit-button" onClick={handleSave}>Save Changes</button>
            <button className="skip-button" onClick={() => setIsEditing(false)}>Cancel</button>
          </>
        ) : (
          <button className="submit-button" onClick={() => setIsEditing(true)}>Edit Profile</button>
        )}

        <button className="back-button" onClick={() => set_current_page('dashboard')}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export default ProfileView;
