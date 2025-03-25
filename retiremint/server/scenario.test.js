const mongoose = require('mongoose');
const Scenario = require('./src/Schemas/Scenario');
const LifeExpectancy = require('./src/Schemas/LifeExpectancy');
const Investment = require('./src/Schemas/Investments');
const InvestmentType = require('./src/Schemas/InvestmentType');
const ExpectedReturn = require('./src/Schemas/ExpectedReturnOrIncome');
const ExpectedIncome = require('./src/Schemas/ExpectedReturnOrIncome');
const Inflation = require('./src/Schemas/Inflation');
const SimulationSettings = require('./src/Schemas/SimulationSettings');
const Event = require('./src/Schemas/EventSeries');
const StartYear = require('./src/Schemas/StartYear');
const Duration = require('./src/Schemas/Duration');
const Income = require('./src/Schemas/Income');
const ExpectedAnnualChange = require('./src/Schemas/ExpectedAnnualChange');


const fixed_value = 2;
const test = "Test Investment Type";
const event = "Test Event";

async function createScenario() {
  await mongoose.connect('mongodb://127.0.0.1:27017/retiremint', { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    const user_life_expectancy = new LifeExpectancy({ life_expectancy_method: "fixed_value", fixed_value: fixed_value });
    await user_life_expectancy.save();

    const expected_return = await new ExpectedReturn({ method: "fixed_value", fixed_value: fixed_value }).save();
    const expected_income = await new ExpectedIncome({ method: "fixed_value", fixed_value: fixed_value }).save();
    const investment_type = await new InvestmentType({
      name: test,
      description: "Testing investment type",
      expectedAnnualReturn: expected_return._id,
      expectedAnnualIncome: expected_income._id,
      expenseRatio: 2,
      taxability: "taxable"
    }).save();
    const investment = await new Investment({
      investmentType: investment_type._id,
      value: 3,
      accountTaxStatus: "non-retirement"
    }).save();

    const start_year = await new StartYear({ method: "fixed_value", fixed_value: fixed_value }).save();
    const duration_obj = await new Duration({ method: "fixed_value", fixed_value: fixed_value }).save();
    const expected_annual_change_for_income = await new ExpectedAnnualChange({ method: "fixed_value", fixed_value: fixed_value }).save();
    const income_obj = await new Income({
      initial_amount: 1000,
      expected_annual_change: expected_annual_change_for_income._id,
      inflation_adjustment: true,
      is_social_security: true
    }).save();

    const event_obj = await new Event({
      name: event,
      description: "Testing event description",
      startYear: start_year._id,
      duration: duration_obj._id,
      type: "income",
      income: income_obj._id
    }).save();

    const inflation = new Inflation({ method: "fixed_percentage", fixed_percentage: 2 });
    await inflation.save();

    const simulation_settings = new SimulationSettings({
      inflationAssumption: inflation._id,
      spendingStrategies: "1",
      expenseWithdrawalStrategies: "2",
      rmdStrategies: "3",
      rothConversionStrategies: "4",
    });
    await simulation_settings.save();

    const new_scenario = new Scenario({
      name: "Test Scenario",
      scenarioType: "individual",
      birthYear: 1999,
      lifeExpectancy: user_life_expectancy._id,
      investments: investment._id,
      events: event_obj._id,
      simulationSettings: simulation_settings._id,
      financialGoal: 1000,
      stateOfResidence: "Alabama",
    });

    await new_scenario.save();
    return new_scenario;
  } catch (err) {
    console.error('Error creating scenario:', err);
    throw err;
  } finally {
    mongoose.disconnect();
  }
}

describe('Scenario Creation Test', () => {
  it('should create a new scenario successfully', async () => {
    const scenario = await createScenario();

    // Assertions to check if the scenario is created correctly
    expect(scenario).toHaveProperty('_id');
  });
});
