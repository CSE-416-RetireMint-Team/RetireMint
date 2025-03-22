const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeStandardDeductions() {
  const url = 'https://www.irs.gov/publications/p17';

  try {
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);

    const results = [];

    // Extract year from main heading
    const yearHeading = $('h1').first().text();
    const yearMatch = yearHeading.match(/\b(20\d{2})\b/);
    const year = yearMatch ? parseInt(yearMatch[1]) : null;
    if (!year) return [];

    // Find "Table 10-1.Standard Deduction Chart for Most People"
    const tableTitle = $('p.title').filter((_, el) =>
      $(el).text().trim().startsWith('Table 10-1.Standard Deduction Chart for Most People')
    ).first();

    if (!tableTitle.length) return [];

    // Grab the <table> under .table-contents
    const tableWrapper = tableTitle.parent().find('.table-contents').first();
    const table = tableWrapper.find('table').first();
    if (!table.length) return [];

    // Extract and map rows to filingStatus
    table.find('tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length >= 2) {
        const statusText = $(cells[0]).text().trim().toLowerCase();
        const amountRaw = $(cells[1]).text().trim();
        const deduction = parseFloat(amountRaw.replace(/[^\d.]/g, ''));

        if (!isNaN(deduction)) {
            if (statusText.includes('single') && statusText.includes('separately')) {
              results.push({ year, filingStatus: 'single', standardDeduction: deduction });
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

// Run it
scrapeStandardDeductions().then(data => {
  console.log(JSON.stringify(data, null, 2));
});

