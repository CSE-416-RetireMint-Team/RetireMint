import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ProfileView from '../components/profile_view';

beforeEach(() => {
  // Set up a dummy userId in localStorage
  localStorage.setItem('userId', '12345');

  // Mock fetch with jest.spyOn to ensure it hooks properly
  jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({
      name: 'Test User',
      email: 'test@example.com',
      DOB: '1990-01-01',
      state: 'NY',
      maritalStatus: 'individual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
  });
});

afterEach(() => {
  // Clean up mocks
  global.fetch.mockRestore();
  localStorage.clear();
});

test('renders user profile after fetching data', async () => {
  render(<ProfileView set_current_page={() => {}} />);

  await waitFor(() => {
    expect(screen.getByText(/Test User/i)).toBeInTheDocument();
    expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/Date of Birth:/i)).toBeInTheDocument();
    expect(screen.getByText(/State:/i)).toBeInTheDocument();
    expect(screen.getByText(/Marital Status:/i)).toBeInTheDocument();
  });
});
