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
      .populate({
        path: 'events',
        populate: [
          'startYear',
          'duration',
          { path: 'income', populate: 'expectedAnnualChange' },
          { path: 'expense', populate: 'expectedAnnualChange' },
          { path: 'invest' },
          { path: 'rebalance' }
        ]
      })      
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
          '!!seq': 'flow',
          '!!map': 'flow'  // <<--- this is the key change
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
          const entries = block.split(/(?=\n  - name:)/); // keep exact spacing
          
          const fixed = entries.map(entry =>
            entry
              // preserve spacing; only update structure
              .replace(/(\n\s+)returnDistribution:\n\s+type: (\w+)\n\s+value: ([\d.]+)/, '$1returnDistribution: {type: $2, value: $3}')
              .replace(/(\n\s+)returnDistribution:\n\s+type: (\w+)\n\s+mean: ([\d.]+)\n\s+stdev: ([\d.]+)/, '$1returnDistribution: {type: $2, mean: $3, stdev: $4}')
              .replace(/(\n\s+)incomeDistribution:\n\s+type: (\w+)\n\s+value: ([\d.]+)/, '$1incomeDistribution: {type: $2, value: $3}')
              .replace(/(\n\s+)incomeDistribution:\n\s+type: (\w+)\n\s+mean: ([\d.]+)\n\s+stdev: ([\d.]+)/, '$1incomeDistribution: {type: $2, mean: $3, stdev: $4}')
              .trimEnd()
          );
        
          return `investmentTypes:\n${fixed.join('\n')}\n`;
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
        })
        .replace(/eventSeries:\n((?: {2}- .*\n(?: {4}.*\n?)*)+)/, (match, block) => {
          const entries = block.split(/(?=\n  - name:)/);
        
          const fixed = entries.map(entry =>
            entry
              // Compact start
              .replace(/(\n\s+)start:\n\s+type: (\w+)\n\s+value: ([\d.]+)/, '$1start: {type: $2, value: $3}')
              .replace(/(\n\s+)start:\n\s+type: (\w+)\n\s+eventSeries: (\S+)/, '$1start: {type: $2, eventSeries: $3}')
              .replace(/(\n\s+)start:\n\s+type: (\w+)\n\s+lower: ([\d.]+)\n\s+upper: ([\d.]+)/, '$1start: {type: $2, lower: $3, upper: $4}')
        
              // Compact duration
              .replace(/(\n\s+)duration:\n\s+type: (\w+)\n\s+value: ([\d.]+)/, '$1duration: {type: $2, value: $3}')
              .replace(/(\n\s+)duration:\n\s+type: (\w+)\n\s+lower: ([\d.]+)\n\s+upper: ([\d.]+)/, '$1duration: {type: $2, lower: $3, upper: $4}')
        
              // Compact changeDistribution
              .replace(/(\n\s+)changeDistribution:\n\s+type: (\w+)\n\s+value: ([\d.]+)/, '$1changeDistribution: {type: $2, value: $3}')
              .replace(/(\n\s+)changeDistribution:\n\s+type: (\w+)\n\s+mean: ([\d.]+)\n\s+stdev: ([\d.]+)/, '$1changeDistribution: {type: $2, mean: $3, stdev: $4}')
              .replace(/(\n\s+)changeDistribution:\n\s+type: (\w+)\n\s+lower: ([\d.]+)\n\s+upper: ([\d.]+)/, '$1changeDistribution: {type: $2, lower: $3, upper: $4}')
        
              // Compact assetAllocation and assetAllocation2
              .replace(/\n\s+assetAllocation:\n((?:\s{6}[^:\n]+: .+\n)+)/, (_, block) => {
                const lines = block.trim().split('\n');
                const entries = lines.map(line => line.trim());
                return `\n    assetAllocation: {${entries.join(', ')}}`;
              })
              .replace(/\n\s+assetAllocation2:\n((?:\s{6}[^:\n]+: .+\n)+)/, (_, block) => {
                const lines = block.trim().split('\n');
                const entries = lines.map(line => line.trim());
                return `\n    assetAllocation2: {${entries.join(', ')}}`;
              })
        
              // Fix misaligned base fields (e.g. type, initialAmount, etc.)
              .replace(/\n(?! {2}- ) {2}(?!\s)/g, '\n    ')  // all non-top-level lines should have 4 spaces
              .trimEnd()
          );
        
          return `eventSeries:\n${fixed.map(e => '  ' + e.replace(/\n/g, '\n  ')).join('\n')}\n`;
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
