const axios = require('axios');
const cheerio = require('cheerio');
const RMDTable = require('../Schemas/RMDTable');

async function scrapeAndSaveRMDTable() {
  const year = new Date().getFullYear();

  // Check if this year already exists in DB
  const exists = await RMDTable.exists({ year });
  if (exists) {
    console.log(`RMD Table already exists in DB for year ${year}`);
    return;
  }

  const url = 'https://www.irs.gov/publications/p590b';

  try {
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);

    let found = false;
    let rmdRows = [];

    $('table').each((_, table) => {
      const $table = $(table);

      const headerRows = $table.find('tr').slice(0, 4);
      const texts = headerRows.map((_, el) => $(el).text().toLowerCase()).get().join(' ');

      if (texts.includes('table iii') && texts.includes('uniform lifetime')) {
        found = true;

        $table.find('tr').each((_, row) => {
          const cells = $(row).find('td');

          if (cells.length === 4) {
            const age1 = $(cells[0]).text().trim();
            const dist1 = $(cells[1]).text().trim();
            const age2 = $(cells[2]).text().trim();
            const dist2 = $(cells[3]).text().trim();

            if (!isNaN(parseInt(age1)) && !isNaN(parseFloat(dist1))) {
              rmdRows.push({
                age: parseInt(age1),
                distributionPeriod: parseFloat(dist1)
              });
            }

            if (!isNaN(parseInt(age2)) && !isNaN(parseFloat(dist2))) {
              rmdRows.push({
                age: parseInt(age2),
                distributionPeriod: parseFloat(dist2)
              });
            }
          }
        });

        return false; 
      }
    });

    if (!found) {
      throw new Error('Could not find Table III (Uniform Lifetime Table)');
    }
    rmdRows.sort((a, b) => a.age - b.age);
    await RMDTable.create({
      year,
      rows: rmdRows
    });

    console.log(`RMD Table for ${year} saved to MongoDB`);
  } catch (err) {
    console.error('RMD scraping failed:', err.message);
  }
}

module.exports = scrapeAndSaveRMDTable;
