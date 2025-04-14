const axios = require('axios');
const cheerio = require('cheerio');
const IRAContributionLimit = require('../Schemas/ContributionLimit'); // Adjust path

async function scrapeContributionLimit() {
  try {
    const { data: html } = await axios.get('https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-ira-contribution-limits');
    const $ = cheerio.load(html);

    const entries = [];

    $('p').each((i, el) => {
      const text = $(el).text().trim();
      const yearMatch = text.match(/For\s+(\d{4})/i);

      if (yearMatch) {
        const year = parseInt(yearMatch[1]);
        const nextUl = $(el).next('ul');

        const amounts = nextUl.find('li').first().text().match(/\$[\d,]+/g);

        if (amounts?.length >= 2) {
          const standardLimit = parseInt(amounts[0].replace(/[$,]/g, ''));
          const over50Limit = parseInt(amounts[1].replace(/[$,]/g, ''));
          const catchUpAmount = over50Limit - standardLimit;

          entries.push({ year, standardLimit, catchUpAmount, catchUpStartsAtAge: 50 });
        }
      }
    });

    for (const entry of entries) {
      await IRAContributionLimit.updateOne(
        { year: entry.year },
        { $set: entry },
        { upsert: true }
      );
      console.log(`✔ Saved IRA limits for ${entry.year}`);
    }

  } catch (err) {
    console.error('❌ Failed to scrape/save IRA limits:', err.message);
  }
}

module.exports = scrapeContributionLimit;
