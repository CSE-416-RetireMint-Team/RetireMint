import React from 'react';
import axios from 'axios';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import NewScenario from '../components/NewScenario';
import '@testing-library/jest-dom';

jest.mock('axios');

const minimalScenarioData = {
  scenarioName: '',
  scenarioType: 'individual',
  birthYear: '',
  lifeExpectancy: '',
  maximumCash: '',
  financialGoal: '',
  stateOfResidence: '',
  sharedUsers: [],
  events: [],
  investments: [],
  investmentTypes: []
};

describe('NewScenario multi-step flow', () => {
  beforeEach(() => {
    axios.get.mockResolvedValue({ data: minimalScenarioData });
  });

  it('renders all initial fields and lets me interact with them', async () => {
    render(
      <MemoryRouter initialEntries={['/new-scenario/xyz']}>
        <Routes>
          <Route path="/new-scenario/:reportId" element={<NewScenario />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for page 1 controls
    const nameInput = await screen.findByPlaceholderText(/Enter scenario name/i);
    const individualRadio = screen.getByRole('radio', { name: /individual/i });
    const marriedRadio   = screen.getByRole('radio', { name: /married/i });
    const birthInput     = screen.getByPlaceholderText(/Enter your birth year/i);
    const fixedBtn       = screen.getByRole('button', { name: /enter fixed age/i });
    const normalBtn      = screen.getByRole('button', { name: /sampled from normal distribution/i });
    const cashInput      = screen.getByPlaceholderText(/Enter maximum cash/i);

    // Assert presence
    expect(nameInput).toBeInTheDocument();
    expect(individualRadio).toBeChecked();
    expect(marriedRadio).not.toBeChecked();
    expect(birthInput).toBeInTheDocument();
    expect(fixedBtn).toBeInTheDocument();
    expect(normalBtn).toBeInTheDocument();
    expect(cashInput).toBeInTheDocument();

    // Interact & assert values
    fireEvent.change(nameInput, { target: { value: 'Test Plan' } });
    expect(nameInput).toHaveValue('Test Plan');

    userEvent.click(marriedRadio);
    expect(marriedRadio).toBeChecked();

    fireEvent.change(birthInput, { target: { value: '1980' } });
    expect(birthInput.value).toBe('1980');

    userEvent.click(fixedBtn);
    const fixedAgeInput = await screen.findByPlaceholderText(/Enter fixed age/i);
    fireEvent.change(fixedAgeInput, { target: { value: '85' } });
    expect(fixedAgeInput).toHaveValue(85);

    fireEvent.change(cashInput, { target: { value: '20000' } });
    expect(cashInput).toHaveValue(20000);
  });

  it('alerts when Next is clicked with missing required fields', async () => {
    render(
      <MemoryRouter initialEntries={['/new-scenario/xyz']}>
        <Routes>
          <Route path="/new-scenario/:reportId" element={<NewScenario />} />
        </Routes>
      </MemoryRouter>
    );

    // mock window.alert
    window.alert = jest.fn();

    const nextBtn = await screen.findByRole('button', { name: /^Next$/i });
    userEvent.click(nextBtn);

    expect(window.alert).toHaveBeenCalledWith('Scenario Name is required.');
  });

  it('advances to the Investment Types step when all page 1 fields are valid', async () => {
    render(
      <MemoryRouter initialEntries={['/new-scenario/xyz']}>
        <Routes>
          <Route path="/new-scenario/:reportId" element={<NewScenario />} />
        </Routes>
      </MemoryRouter>
    );

    // Fill page 1 completely
    fireEvent.change(await screen.findByPlaceholderText(/Enter scenario name/i),
      { target: { value: 'Plan A' } });
    userEvent.click(screen.getByRole('radio', { name: /individual/i }));
    fireEvent.change(screen.getByPlaceholderText(/Enter your birth year/i),
      { target: { value: '1975' } });
    userEvent.click(screen.getByRole('button', { name: /enter fixed age/i }));
    fireEvent.change(await screen.findByPlaceholderText(/Enter fixed age/i),
      { target: { value: '90' } });
    fireEvent.change(screen.getByPlaceholderText(/Enter maximum cash/i),
      { target: { value: '5000' } });

    // Click Next
    userEvent.click(screen.getByRole('button', { name: /^Next$/i }));

    // Page 2 has multiple <input type="number">; the first is "Number of Investment Types"
    const spinbuttons = await screen.findAllByRole('spinbutton');
    expect(spinbuttons.length).toBeGreaterThanOrEqual(1);

    // Assert the first one defaults to 1
    const nTypesInput = spinbuttons[0];
    expect(nTypesInput).toHaveValue(1);
  });
});

// … your existing page-1 tests …

describe('NewScenario — Investment Types step', () => {
    // helper to get us to page 2
    async function goToPage2() {
      render(
        <MemoryRouter initialEntries={['/new-scenario/xyz']}>
          <Routes>
            <Route path="/new-scenario/:reportId" element={<NewScenario />} />
          </Routes>
        </MemoryRouter>
      );
      // fill page 1 exactly as before
      fireEvent.change(
        await screen.findByPlaceholderText(/Enter scenario name/i),
        { target: { value: 'Plan X' } }
      );
      userEvent.click(screen.getByRole('radio', { name: /individual/i }));
      fireEvent.change(screen.getByPlaceholderText(/Enter your birth year/i), {
        target: { value: '1970' }
      });
      userEvent.click(screen.getByRole('button', { name: /enter fixed age/i }));
      fireEvent.change(
        await screen.findByPlaceholderText(/Enter fixed age/i),
        { target: { value: '85' } }
      );
      fireEvent.change(screen.getByPlaceholderText(/Enter maximum cash/i), {
        target: { value: '10000' }
      });
      userEvent.click(screen.getByRole('button', { name: /^Next$/i }));
      // wait for page 2’s first investment-name input
      await screen.findAllByPlaceholderText(/Investment Type Name/i);
    }
  
    it('renders all of the page-2 controls', async () => {
      await goToPage2();
  
      // 1) Number of investment-types spinbutton
      const spinbuttons = screen.getAllByRole('spinbutton');
      expect(spinbuttons[0]).toHaveValue(1);
  
      // 2) Name & Description fields
      expect(screen.getAllByPlaceholderText(/Investment Type Name/i)[0]).toBeInTheDocument();
      expect(screen.getAllByPlaceholderText(/Investment Type Description/i)[0]).toBeInTheDocument();
  
      // 3) Return-mode buttons appear both in Return & Income sections
      //    → Fixed Value x2, Fixed Percentage x2, Normal-Distribution x4
      expect(screen.getAllByRole('button', { name: /Fixed Value$/i }).length).toBe(2);
      expect(screen.getAllByRole('button', { name: /Fixed Percentage$/i }).length).toBe(2);
      expect(screen.getAllByRole('button', { name: /Normal Distribution\)$/i }).length).toBe(4);
  
      // 4) Expense Ratio input
      expect(screen.getAllByPlaceholderText(/Expense Ratio/i)[0]).toBeInTheDocument();
  
      // 5) Taxability radios
      expect(screen.getAllByRole('radio', { name: /Taxable/i }).length).toBe(1);
      expect(screen.getAllByRole('radio', { name: /Tax-Exempt/i }).length).toBe(1);
  
      // 6) Prev & Next buttons
      expect(screen.getByRole('button', { name: /^Previous$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Next$/i })).toBeInTheDocument();
    });
  
    it('alerts if you click Next without filling the Name field', async () => {
      await goToPage2();
      window.alert = jest.fn();
  
      userEvent.click(screen.getByRole('button', { name: /^Next$/i }));
      expect(window.alert).toHaveBeenCalledWith(
        'Each investment type must have a Name.'
      );      
    });
  
    it('lets me fill every field and advance to Event-Series step', async () => {
      await goToPage2();
  
      // fill name + description
      fireEvent.change(screen.getAllByPlaceholderText(/Investment Type Name/i)[0], {
        target: { value: 'Global Stock' }
      });
      fireEvent.change(screen.getAllByPlaceholderText(/Investment Type Description/i)[0], {
        target: { value: 'World index fund' }
      });
  
      // pick “Fixed Value” for return & fill it
      userEvent.click(screen.getAllByRole('button', { name: /Fixed Value$/i })[0]);
      let sb = screen.getAllByRole('spinbutton');
      fireEvent.change(sb[1], { target: { value: '6' } });
  
      // fill expense ratio
      fireEvent.change(screen.getAllByPlaceholderText(/Expense Ratio/i)[0], {
        target: { value: '0.3' }
      });
  
      // pick “Fixed Percentage” for income & fill it
      userEvent.click(screen.getAllByRole('button', { name: /Fixed Percentage$/i })[0]);
      sb = screen.getAllByRole('spinbutton');
      fireEvent.change(sb[sb.length - 1], { target: { value: '2' } });
  
      // pick tax-exempt
      userEvent.click(screen.getAllByRole('radio', { name: /Tax-Exempt/i })[0]);
  
      // Next should now be enabled
      const nextBtn = screen.getByRole('button', { name: /^Next$/i });
      expect(nextBtn).toBeEnabled();
      userEvent.click(nextBtn);
  
      // we’ve landed on page 3: there should once again be at least one spinbutton
      await screen.findAllByRole('spinbutton');
    });
  });
  