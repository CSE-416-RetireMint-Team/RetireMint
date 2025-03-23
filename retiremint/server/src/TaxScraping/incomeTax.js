const axios = require('axios');
const cheerio = require('cheerio');
const IncomeTax = require('../Schemas/IncomeTax');

async function scrapeIncomeTaxRates() {
  const url = 'https://www.irs.gov/filing/federal-income-tax-rates-and-brackets';

  try {
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);

    const results = [];
    const year = new Date().getFullYear();

    $('table').each((_, table) => {
      const tableElement = $(table);

      let heading = tableElement.prevAll('h2, h4').first().text().trim();
      if (!heading) {
        heading = tableElement.closest('.collapsible-item-body')
          .closest('.collapsible-item-collapse')
          .prev('.collapsible-item-heading')
          .find('a')
          .text()
          .trim();
      }

      const statusMatch = heading.match(/(single|jointly|separately|head of household)/i);
      if (!statusMatch) return;

      const filingStatus = statusMatch[0].toLowerCase();
      const brackets = [];

      tableElement.find('tbody tr').each((_, row) => {
        const cells = $(row).find('td');
        if (cells.length === 3) {
          const rate = $(cells[0]).text().trim();
          const minIncome = $(cells[1]).text().trim();
          const maxIncome = $(cells[2]).text().trim();
          brackets.push({ rate, minIncome, maxIncome });
        }
      });

      if (brackets.length > 0) {
        results.push({ year, filingStatus, brackets });
      }
    });

    return results;
  } catch (err) {
    console.error('Scraping failed:', err.message);
    return [];
  }
}

async function scrapeAndSaveIncomeTaxRates() {
  const data = await scrapeIncomeTaxRates();

  for (const record of data) {
    await IncomeTax.findOneAndUpdate(
      { year: record.year, filingStatus: record.filingStatus },
      record,
      { upsert: true, new: true }
    );
  }

  console.log('Income tax data scraped and saved to MongoDB');
}

module.exports = scrapeAndSaveIncomeTaxRates;
