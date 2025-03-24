import React, { useState } from 'react';
import Header from './header';
import '../Stylesheets/profile_setup.css';

function UserProfileForm({ onComplete }) {
  const [formData, setFormData] = useState({
    DOB: '',
    state: '',
    maritalStatus: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
  
    const userId = localStorage.getItem('userId');
    if (!userId) {
      setError('User not logged in');
      setLoading(false);
      return;
    }
  
    try {
      const res = await fetch(`http://localhost:8000/user/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
  
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to save profile');
      }
  
      if (onComplete) onComplete();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };  

  const createInput = (id, label, type = 'text', extra = {}) =>
    React.createElement('div', { className: 'form-group' }, [
      React.createElement('label', { htmlFor: id, key: id + '-label' }, label),
      React.createElement('input', {
        id,
        key: id + '-input',
        type,
        required: true,
        value: formData[id],
        onChange: handleChange,
        ...extra,
        className: 'form-control',
      }),
    ]);

  const createSelect = (id, label, options) =>
    React.createElement('div', { className: 'form-group' }, [
      React.createElement('label', { htmlFor: id, key: id + '-label' }, label),
      React.createElement(
        'select',
        {
          id,
          key: id + '-select',
          required: true,
          value: formData[id],
          onChange: handleChange,
          className: 'form-control',
        },
        [React.createElement('option', { value: '', key: 'default' }, '-- Select --')].concat(
          options.map((opt) =>
            React.createElement('option', { value: opt, key: opt }, opt)
          )
        )
      ),
    ]);

    return React.createElement(React.Fragment, null, [
      React.createElement(Header, { key: 'header' }),
      React.createElement('div', { className: 'user-profile-form', key: 'form-container' }, [
        React.createElement('h2', { key: 'title' }, 'Complete Your Profile'),
        React.createElement(
          'form',
          { onSubmit: handleSubmit, key: 'form' },
          [
            createInput('DOB', 'Date of Birth', 'date'),
            createSelect('state', 'State of Residence', states),
            createSelect('maritalStatus', 'Marital Status', ['individual', 'married']),
            error
              ? React.createElement('div', { className: 'error-text', key: 'error' }, error)
              : null,
            React.createElement(
              'button',
              {
                type: 'submit',
                disabled: loading,
                className: 'submit-button',
                key: 'submit',
              },
              loading ? 'Saving...' : 'Save Profile'
            ),
            React.createElement(
              'button',
              {
                type: 'button',
                onClick: () => onComplete(),
                className: 'skip-button',
                key: 'skip',
              },
              'Skip for now'
            )
          ]
        ),
      ])
    ]);    
}

export default UserProfileForm;
