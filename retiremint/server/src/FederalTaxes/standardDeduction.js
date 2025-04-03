const axios = require('axios');
const cheerio = require('cheerio');
const StandardDeduction = require('../Schemas/StandardDeductions'); // Adjust path if needed

async function scrapeStandardDeductions() {
  const url = 'https://www.irs.gov/publications/p17';
  const year = new Date().getFullYear();

  try {
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);
    const results = [];

    const tableTitle = $('p.title').filter((_, el) =>
      $(el).text().trim().startsWith('Table 10-1.Standard Deduction Chart for Most People')
    ).first();

    if (!tableTitle.length) return [];

    const table = tableTitle.parent().find('.table-contents table').first();
    if (!table.length) return [];

    table.find('tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length >= 2) {
        const statusText = $(cells[0]).text().trim().toLowerCase();
        const amountRaw = $(cells[1]).text().trim();
        const deduction = parseFloat(amountRaw.replace(/[^\d.]/g, ''));

        if (!isNaN(deduction)) {
          if (statusText.includes('single') && statusText.includes('separately')) {
            results.push(
              { year, filingStatus: 'single', standardDeduction: deduction },
              { year, filingStatus: 'married_filing_separately', standardDeduction: deduction }
            );
          } else if (statusText.includes('married') && statusText.includes('jointly')) {
            results.push({ year, filingStatus: 'married', standardDeduction: deduction });
          } else if (statusText.includes('head of household')) {
            results.push({ year, filingStatus: 'head_of_household', standardDeduction: deduction });
          }
        }
      }
    });

    return results;
  } catch (err) {
    console.error('Error scraping standard deductions:', err.message);
    return [];
  }
}

async function scrapeAndSaveStandardDeductions() {
  const data = await scrapeStandardDeductions();

  for (const entry of data) {
    await StandardDeduction.findOneAndUpdate(
      { year: entry.year, filingStatus: entry.filingStatus },
      entry,
      { upsert: true, new: true }
    );
  }

  console.log('Standard deductions scraped and saved to MongoDB');
}

module.exports = scrapeAndSaveStandardDeductions;
