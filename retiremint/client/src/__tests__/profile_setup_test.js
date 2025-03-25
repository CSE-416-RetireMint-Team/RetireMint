import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserProfileForm from '../components/profile_setup';

// Mock localStorage and fetch
beforeEach(() => {
  localStorage.setItem('userId', '12345');
  jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({}), 
  });
});

afterEach(() => {
  global.fetch.mockRestore();
  localStorage.clear();
});

test('submits profile setup form and calls onComplete()', async () => {
  const mockOnComplete = jest.fn();

  render(<UserProfileForm onComplete={mockOnComplete} />);

  // Fill in form fields
  fireEvent.change(screen.getByLabelText(/Date of Birth/i), {
    target: { value: '1995-06-15' },
  });

  fireEvent.change(screen.getByLabelText(/State of Residence/i), {
    target: { value: 'NY' },
  });

  fireEvent.change(screen.getByLabelText(/Marital Status/i), {
    target: { value: 'individual' },
  });

  // Submit form
  fireEvent.click(screen.getByRole('button', { name: /Save Profile/i }));

  // Wait for fetch and onComplete call
  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/user/12345'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({
          DOB: '1995-06-15',
          state: 'NY',
          maritalStatus: 'individual',
        }),
      })
    );

    expect(mockOnComplete).toHaveBeenCalled();
  });
});
