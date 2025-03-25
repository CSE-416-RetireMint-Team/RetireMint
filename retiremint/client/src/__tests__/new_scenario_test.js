import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import New_scenario from '../components/new_scenario';

test('completes Page 1 and moves to Page 2 when inputs are valid', () => {
  render(<New_scenario set_current_page={() => {}} />);

  // Fill scenario name
  fireEvent.change(screen.getByPlaceholderText(/Enter scenario name/i), {
    target: { value: 'My Test Scenario' },
  });

  // Select scenario type: individual
  fireEvent.click(screen.getByLabelText(/Individual/i));

  // Fill birth year
  fireEvent.change(screen.getByPlaceholderText(/Enter your birth year/i), {
    target: { value: '1995' },
  });

  // Click life expectancy method button
  fireEvent.click(screen.getByText(/Enter Fixed Age/i));

  // Fill fixed value
  fireEvent.change(screen.getByPlaceholderText(/Enter fixed age/i), {
    target: { value: '85' },
  });

  // Click next
  fireEvent.click(screen.getByText(/Next/i));

  // Page 2 should now be visible (Investment form)
  expect(screen.getByText(/Number of Investments/i)).toBeInTheDocument();
});
