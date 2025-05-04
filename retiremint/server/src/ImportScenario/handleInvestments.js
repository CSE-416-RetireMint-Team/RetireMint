const ExpectedReturnOrIncome = require('../Schemas/ExpectedReturnOrIncome');
const InvestmentType = require('../Schemas/InvestmentType');
const Investment = require('../Schemas/Investments'); 

function mapReturnOrIncome(dist, amtOrPct = 'percent') {
    const stdDev = dist.stdev ?? dist.sd;
  
    if (dist.type === 'fixed') {
      return {
        method: amtOrPct === 'amount' ? 'fixedValue' : 'fixedPercentage',
        ...(amtOrPct === 'amount'
          ? { fixedValue: dist.value }
          : { fixedPercentage: dist.value })
      };
    } else if (dist.type === 'normal') {
      return {
        method: amtOrPct === 'amount' ? 'normalValue' : 'normalPercentage',
        ...(amtOrPct === 'amount'
          ? { normalValue: { mean: dist.mean, sd: stdDev } }
          : { normalPercentage: { mean: dist.mean, sd: stdDev } })
      };
    } else if (dist.type === 'uniform') {
      return {
        method: amtOrPct === 'amount' ? 'uniformValue' : 'uniformPercentage',
        ...(amtOrPct === 'amount'
          ? {
              uniformValue: {
                lowerBound: dist.lower,
                upperBound: dist.upper
              }
            }
          : {
              uniformPercentage: {
                lowerBound: dist.lower,
                upperBound: dist.upper
              }
            })
      };
    } else {
      throw new Error(`Unknown distribution type: ${dist.type}`);
    }
  }  

async function handleInvestments(yamlData, userId) {
  const nameToTypeMap = new Map();
  const investmentTypes = yamlData.investmentTypes || [];
  const investments = yamlData.investments || [];
  const savedInvestments = [];

  // Step 1: Ensure each InvestmentType exists (reuse if exists, create if not)
  for (const type of investmentTypes) {
    let existingType = await InvestmentType.findOne({ name: type.name });

    if (!existingType) {
        const returnInput = JSON.parse(JSON.stringify(type.returnDistribution));
        const incomeInput = JSON.parse(JSON.stringify(type.incomeDistribution));

        const returnDist = await new ExpectedReturnOrIncome(
        mapReturnOrIncome(returnInput, type.returnAmtOrPct)
        ).save();

        const incomeDist = await new ExpectedReturnOrIncome(
        mapReturnOrIncome(incomeInput, type.incomeAmtOrPct)
        ).save();

      const taxability = type.taxability === false ? 'tax-exempt' : 'taxable';

      const investmentTypeDoc = new InvestmentType({
        name: type.name,
        description: type.description,
        expectedAnnualReturn: returnDist._id,
        expectedAnnualIncome: incomeDist._id,
        expenseRatio: type.expenseRatio,
        taxability
      });

      existingType = await investmentTypeDoc.save();
    }

    nameToTypeMap.set(type.name, existingType._id);
  }

  // Step 2: Create Investments (these are specific to the scenario)
  for (const inv of investments) {
    const typeId = nameToTypeMap.get(inv.investmentType);
    if (!typeId) {
      throw new Error(`Unknown investmentType name: ${inv.investmentType}`);
    }

    const investmentType = await InvestmentType.findById(typeId);
    if (!investmentType) throw new Error(`Invalid investmentType ID: ${typeId}`);

    const isTaxable = investmentType.taxability === 'taxable';
    const taxStatus = inv.taxStatus;

    if (isTaxable && !taxStatus) {
    throw new Error(`Investment "${inv.id}" is taxable and must include a taxStatus`);
    }

    if (!isTaxable) {
    inv.taxStatus = undefined;
    inv.maxAnnualContribution = undefined;
    }

    if (taxStatus === 'after-tax') {
    if (inv.maxAnnualContribution == null) {
        inv.maxAnnualContribution = 0;
    }
    }

    const investmentDoc = new Investment({
    name: inv.id,
    investmentType: typeId,
    value: inv.value,
    accountTaxStatus: taxStatus,
    maxAnnualContribution: inv.maxAnnualContribution
    });
  

    const savedInvestment = await investmentDoc.save();
    savedInvestments.push(savedInvestment);
  }

  return savedInvestments.map(inv => inv._id);
}

module.exports = handleInvestments;
