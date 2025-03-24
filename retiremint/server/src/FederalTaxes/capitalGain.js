const axios = require('axios');
const cheerio = require('cheerio');
const CapitalGain = require('../Schemas/CapitalGain'); 

async function scrapeCapitalGainsWithRanges() {
  const url = 'https://www.irs.gov/taxtopics/tc409';

  try {
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);

    const year = new Date().getFullYear();
    const rawMap = {}; 

    const heading = $('h2').filter((_, el) =>
      $(el).text().toLowerCase().includes('capital gains tax rates')
    ).first();

    if (!heading.length) {
      console.error('❌ Could not find capital gains tax section');
      return [];
    }

    const rateLabels = ['0%', '15%'];
    const ulLists = heading.nextAll('ul');

    ulLists.slice(0, 2).each((index, ul) => {
      const rate = rateLabels[index];

      $(ul).find('li').each((_, li) => {
        const text = $(li).text().trim();
        const statuses = extractFilingStatuses(text);
        const [lower, upper] = extractRange(text, rate);

        if (!statuses.length) return;

        statuses.forEach(filingStatus => {
          if (!rawMap[filingStatus]) rawMap[filingStatus] = {};
          rawMap[filingStatus][rate] = { lower, upper };
        });
      });
    });

    const results = [];

    for (const [filingStatus, brackets] of Object.entries(rawMap)) {
      const gains = [];

      if (brackets['0%']) {
        gains.push({
          rate: '0%',
          threshold: `$${formatNum(brackets['0%'].lower)} – $${formatNum(brackets['0%'].upper)}`
        });
      }

      if (brackets['15%']) {
        gains.push({
          rate: '15%',
          threshold: `$${formatNum(brackets['15%'].lower)} – $${formatNum(brackets['15%'].upper)}`
        });
      }

      results.push({
        year,
        filingStatus,
        longTermCapitalGains: gains
      });
    }

    return results;
  } catch (err) {
    console.error('Scraping failed:', err.message);
    return [];
  }
}

// Extract multiple filing statuses from a single line
function extractFilingStatuses(text) {
  const s = text.toLowerCase();
  const statuses = [];

  if (s.includes('single')) statuses.push('single');
  if (s.includes('married filing separately')) statuses.push('married_filing_separately');
  if (s.includes('married filing jointly')) statuses.push('married');
  if (s.includes('qualifying surviving spouse')) statuses.push('married');
  if (s.includes('head of household')) statuses.push('head_of_household');

  return statuses;
}

// Get numeric range from text
function extractRange(text, rate) {
  const dollarValues = [...text.matchAll(/\$([\d,]+)/g)].map(match =>
    parseInt(match[1].replace(/,/g, ''), 10)
  );

  if (rate === '0%') {
    return [0, dollarValues[0] ?? 0];
  }

  if (rate === '15%' && dollarValues.length >= 2) {
    return [dollarValues[0] + 1, dollarValues[1]];
  }

  return [null, null];
}

function formatNum(n) {
  return n.toLocaleString('en-US');
}

// Save scraped data to MongoDB
async function scrapeAndSaveCapitalGains() {
  const data = await scrapeCapitalGainsWithRanges();

  for (const entry of data) {
    await CapitalGain.findOneAndUpdate(
      { year: entry.year, filingStatus: entry.filingStatus },
      entry,
      { upsert: true, new: true }
    );
  }

  console.log('Capital gains scraped and saved to MongoDB');
}

module.exports = scrapeAndSaveCapitalGains;
