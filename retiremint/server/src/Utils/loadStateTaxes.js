const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const StateTax = require('../Schemas/StateTax');

async function loadStateTaxDataOnce() {
  const dirPath = path.join(__dirname, '..','StateTaxes',);
  if (!fs.existsSync(dirPath)) {
    console.warn('State tax YAML directory not found:', dirPath);
    return;
  }

  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    if (file.endsWith('.yaml')) {
      const filePath = path.join(dirPath, file);
      try {
        const raw = yaml.load(fs.readFileSync(filePath, 'utf8'));

        for (const stateCode in raw) {
          const data = raw[stateCode];
          await StateTax.updateOne(
            { stateCode },
            { $set: { brackets: data.brackets } },
            { upsert: true }
          );
          console.log(`Loaded tax data for ${stateCode}`);
        }
      } catch (e) {
        console.error(`Failed to load ${file}:`, e.message);
      }
    }
  }
}

module.exports = loadStateTaxDataOnce;
