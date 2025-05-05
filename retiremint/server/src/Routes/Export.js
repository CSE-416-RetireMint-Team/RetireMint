// server/Routes/Export.js
const express = require('express');
const router = express.Router();
const Scenario = require('../Schemas/Scenario');

// You’ll add this utility in a later step
const scenarioToYaml = require('../ExportScenario/scenarioToYaml');
const yaml = require('js-yaml');

router.get('/:scenarioId', async (req, res) => {
  try {
    const scenarioId = req.params.scenarioId;

    const scenario = await Scenario.findOne({ _id: scenarioId })
      .populate('lifeExpectancy')
      .populate('spouseLifeExpectancy')
      .populate({
        path: 'investments',
        populate: {
          path: 'investmentType',
          populate: ['expectedAnnualReturn', 'expectedAnnualIncome']
        }
      })
      .populate('events')
      .populate({
        path: 'simulationSettings',
        populate: {
          path: 'inflationAssumption'
        }
      });
    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found or access denied' });
    }

    let patchedYaml;
    try {
      const scenarioObject = scenario.toObject();
      const yamlObject = scenarioToYaml(scenarioObject);
      const yamlString = yaml.dump(yamlObject, {
        lineWidth: -1,
        styles: {
          '!!seq': 'flow', // Use inline lists like [a, b, c]
          '!!map': 'block'
        }
      });
      

      patchedYaml = yamlString
        .replace(/birthYears:\n((?: {2}- \d+\n)+)/, (match, items) => {
          const years = items.match(/\d+/g);
          return `birthYears: [${years.join(', ')}]\n`;
        })
        .replace(/lifeExpectancy:\n((?: {2}- .*\n(?: {4}.*\n?)*)+)/, (match, block) => {
          const entries = block
            .split('\n')
            .reduce((acc, line) => {
              if (/^  - /.test(line)) {
                acc.push(line.replace(/^  - /, '').trim());
              } else if (/^ {4}/.test(line)) {
                acc[acc.length - 1] += ', ' + line.trim();
              }
              return acc;
            }, [])
            .map(entry => `{${entry}}`);
        
          return `lifeExpectancy: [ ${entries.join(', ')} ]\n`;
        })
        .replace(/investmentTypes:\n((?: {2}- .*\n(?: {4}.*\n?)*)+)/, (match, block) => {
          return `investmentTypes:\n${block}`;
        })
        .replace(/inflationAssumption:\n {2}type: (.+)\n {2}value: ([\d.]+)/, (match, type, value) => {
          return `inflationAssumption: {type: ${type}, value: ${value}}`;
        })
        .replace(/spendingStrategy:\n((?: {2}- .*\n)+)/, (match, items) => {
          const entries = items.match(/- (.+)/g).map(line => line.replace('- ', ''));
          return `spendingStrategy: [${entries.join(', ')}]  # list of discretionary expenses, identified by name\n`;
        })
        .replace(/expenseWithdrawalStrategy:\n((?: {2}- .*\n)+)/, (match, items) => {
          const entries = items.match(/- (.+)/g).map(line => line.replace('- ', ''));
          return `expenseWithdrawalStrategy: [${entries.join(', ')}] # list of investments, identified by id\n`;
        })
        .replace(/RMDStrategy:\n((?: {2}- .*\n)+)/, (match, items) => {
          const entries = items.match(/- (.+)/g).map(line => line.replace('- ', ''));
          return `RMDStrategy: [${entries.join(', ')}] # list of pre-tax investments, identified by id\n`;
        })
        .replace(/RothConversionStrategy:\n((?: {2}- .*\n)+)/, (match, items) => {
          const entries = items.match(/- (.+)/g).map(line => line.replace('- ', ''));
          return `RothConversionStrategy: [${entries.join(', ')}]  # list of pre-tax investments, identified by id\n`;
        });
    } catch (conversionError) {
      console.error('🔥 scenarioToYaml failed:', conversionError.stack);
      return res.status(500).json({ error: 'YAML conversion failed' });
    }

    res.setHeader('Content-Disposition', 'attachment; filename=scenario.yaml');
    res.setHeader('Content-Type', 'text/yaml');
    res.send(patchedYaml);


  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
