const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeIncomeTaxRates() {
  const url = 'https://www.irs.gov/filing/federal-income-tax-rates-and-brackets';

  try {
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);

    const results = [];

    // Extract the year 
    const firstHeading = $('h2:contains("tax rates for a single taxpayer")').first().text();
    const yearMatch = firstHeading.match(/20\d{2}/);
    const year = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();

    // Loop through all tables
    $('table').each((i, table) => {
      const tableElement = $(table);

      // Try to find heading for filing status
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

//for test
scrapeIncomeTaxRates().then(data => {
  console.log(JSON.stringify(data, null, 2));
});
