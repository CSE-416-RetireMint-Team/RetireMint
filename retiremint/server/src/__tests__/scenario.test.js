// server/src/__tests__/scenario.test.js

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../server');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('POST /scenario', () => {
  it('should save a new scenario and return 200', async () => {
    const res = await request(app).post('/scenario').send({
      scenario_name: "Test Scenario",
      scenario_type: "individual",
      birth_year: 1990,
      spouse_birth_year: null,
      life_expectancy: ["fixed_value", 90, null],
      spouse_life_expectancy: null,
      investments: [],
      events: [],
      inflation_assumption: {
        method: "fixed_percentage",
        fixed_percentage: 2.5,
        normal_percentage: { mean: null, sd: null },
        uniform_percentage: { lower_bound: null, upper_bound: null }
      },
      spending_strategies: [],
      expense_withdrawal_strategies: [],
      rmd_strategies: [],
      roth_conversion_strategies: [],
      roth_optimizer_enable: false,
      roth_optimizer_start_year: null,
      roth_optimizer_end_year: null,
      financial_goal: 1000000,
      state_of_residence: "New York",
      shared_users: []
    });

    expect(res.statusCode).toBe(200);
  });
});
