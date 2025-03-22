const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeIncomeTaxRates() {
  const url = 'https://www.irs.gov/filing/federal-income-tax-rates-and-brackets';

  try {
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);

    const results = [];

    $('table').each((i, table) => {
      const tableElement = $(table);

      // Look up for the closest heading or collapsible title
      let heading = tableElement.prevAll('h2, h4').first().text().trim();

      if (!heading) {
        // Try to walk up and find a collapsible title inside an accordion panel
        heading = tableElement.closest('.collapsible-item-body')
                              .closest('.collapsible-item-collapse')
                              .prev('.collapsible-item-heading')
                              .find('a')
                              .text()
                              .trim();
      }

      const yearMatch = heading.match(/20\d{2}/); 
      const statusMatch = heading.match(/(single|jointly|separately|head of household)/i);

      if (!yearMatch || !statusMatch) return;

      const year = parseInt(yearMatch[0]);
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
    console.error('❌ Scraping failed:', err.message);
    return [];
  }
}

// Run it
scrapeIncomeTaxRates().then(data => {
  console.log(JSON.stringify(data, null, 2));
});
