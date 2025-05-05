const Investment = require('../Schemas/Investments');
const Allocation = require('../Schemas/Allocation');

function extractTaxStatus(investmentName) {
  const knownStatuses = ['pre-tax', 'after-tax', 'non-retirement', 'tax-exempt'];
  for (const status of knownStatuses) {
    if (investmentName.includes(status)) return status;
  }
  throw new Error(`Unknown tax status in investment name: ${investmentName}`);
}

function statusToField(status) {
  return {
    'pre-tax': 'preTaxAllocation',
    'after-tax': 'afterTaxAllocation',
    'non-retirement': 'nonRetirementAllocation',
    'tax-exempt': 'taxExemptAllocation'
  }[status];
}

async function buildAllocationFromYaml(allocation1, allocation2 = null, isGlide = false) {
  const investmentStrategy = {
    taxStatusAllocation: {},
    preTaxAllocation: {},
    afterTaxAllocation: {},
    nonRetirementAllocation: {},
    taxExemptAllocation: {}
  };

  const finalInvestmentStrategy = {
    taxStatusAllocation: {},
    preTaxAllocation: {},
    afterTaxAllocation: {},
    nonRetirementAllocation: {},
    taxExemptAllocation: {}
  };

  const fixedAllocationStrings = [];
  const glidePathStrings = [];

  for (const [name, pct] of Object.entries(allocation1)) {
    const investment = await Investment.findOne({ name });
    if (!investment) throw new Error(`Investment not found: ${name}`);

    const status = extractTaxStatus(name);
    investmentStrategy[statusToField(status)][investment._id] = pct;
    fixedAllocationStrings.push(`${name}: ${pct}`);
  }

  if (isGlide && allocation2) {
    for (const [name, pct] of Object.entries(allocation2)) {
      const investment = await Investment.findOne({ name });
      if (!investment) throw new Error(`Glide path investment not found: ${name}`);

      const status = extractTaxStatus(name);
      finalInvestmentStrategy[statusToField(status)][investment._id] = pct;
      glidePathStrings.push(`${name}: ${pct}`);
    }
  }

  const allocationDoc = await new Allocation({
    method: isGlide ? 'glidePath' : 'fixedAllocation',
    fixedAllocation: fixedAllocationStrings,
    glidePath: isGlide ? glidePathStrings : []
  }).save();

  return {
    allocationDoc,
    investmentStrategy,
    finalInvestmentStrategy: isGlide ? finalInvestmentStrategy : investmentStrategy
  };
}

module.exports = buildAllocationFromYaml;
