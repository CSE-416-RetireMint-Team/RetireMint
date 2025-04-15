import { render, screen } from '@testing-library/react';

test('renders the app without crashing', () => {
  render(<App />);
  expect(screen.getByText(/Lifetime Financial Planner/i)).toBeInTheDocument();
});
