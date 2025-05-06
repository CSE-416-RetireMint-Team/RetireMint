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
    let totalInitialCash = 0;
  
    // Step 1: Create investment types, skipping "cash"
    for (const type of investmentTypes) {
      if (type.name.toLowerCase() === 'cash') continue;
  
      let existingType = await InvestmentType.findOne({ name: type.name });
  
      if (!existingType) {
        const returnDist = await new ExpectedReturnOrIncome(
          mapReturnOrIncome(type.returnDistribution, type.returnAmtOrPct)
        ).save();
  
        const incomeDist = await new ExpectedReturnOrIncome(
          mapReturnOrIncome(type.incomeDistribution, type.incomeAmtOrPct)
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
  
    // Step 2: Create investments or count cash
    for (const inv of investments) {
      if (inv.investmentType.toLowerCase() === 'cash') {
        totalInitialCash += inv.value || 0;
        continue; // Don't create cash investment
      }
  
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
  
      if (taxStatus === 'after-tax' && inv.maxAnnualContribution == null) {
        inv.maxAnnualContribution = 0;
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
  
    return {
      investmentIds: savedInvestments.map(inv => inv._id),
      initialCash: totalInitialCash
    };
  }  

module.exports = handleInvestments;
