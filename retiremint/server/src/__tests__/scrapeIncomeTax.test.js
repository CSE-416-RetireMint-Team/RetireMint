import { jest } from '@jest/globals';
import axios from 'axios';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// ✅ Require the scraper (CommonJS module) safely
const scrapeAndSaveIncomeTaxRates = require('../FederalTaxes/incomeTax.js');

// ✅ Mock axios and mongoose
jest.mock('axios');

const mockUpdate = jest.fn().mockResolvedValue({});
jest.unstable_mockModule('../Schemas/IncomeTax.js', () => ({
  default: { findOneAndUpdate: mockUpdate }
}));

test('scrapes IRS table and saves to MongoDB without errors', async () => {
  axios.get.mockResolvedValue({
    data: `
      <h2>Tax Rate Schedule for single</h2>
      <table><tbody>
        <tr><td>10%</td><td>$0</td><td>$11,000</td></tr>
      </tbody></table>
    `
  });

  await expect(scrapeAndSaveIncomeTaxRates()).resolves.not.toThrow();
});
