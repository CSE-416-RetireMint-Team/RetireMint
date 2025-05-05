function formatDistribution(obj) {
    if (!obj || !obj.method) return { type: 'fixed', value: 0 };
  
    switch (obj.method) {
      case 'fixedValue':
        return { type: 'fixed', value: obj.fixedValue ?? 0 };
  
      case 'fixedPercentage':
        return { type: 'fixed', value: (obj.fixedPercentage ?? 0) / 100 };
  
      case 'normalValue':
        return {
          type: 'normal',
          mean: obj.normalValue?.mean ?? 0,
          stdev: obj.normalValue?.sd ?? 0
        };
  
      case 'normalPercentage':
        return {
          type: 'normal',
          mean: (obj.normalPercentage?.mean ?? 0) / 100,
          stdev: (obj.normalPercentage?.sd ?? 0) / 100
        };
  
      default:
        return { type: 'fixed', value: 0 };
    }
  }
  
  
  function formatInvestmentTypes(investments) {
    const seen = new Map();
  
    for (const inv of investments) {
      const itype = inv.investmentType || inv;
      if (!itype?.name) continue;
  
      const key = itype.name;
      if (!seen.has(key)) {
        const retMethod = itype.expectedAnnualReturn?.method;
        const incomeMethod = itype.expectedAnnualIncome?.method;
  
        const returnAmtOrPct =
          retMethod?.includes('Percentage') ? 'percent' : 'amount';
  
        const incomeAmtOrPct =
          incomeMethod?.includes('Percentage') ? 'percent' : 'amount';
  
        seen.set(key, {
          name: itype.name ?? '',
          description: itype.description ?? '',
          returnAmtOrPct,
          returnDistribution: formatDistribution(itype.expectedAnnualReturn),
          expenseRatio: (itype.expenseRatio ?? 0) / 100,
          incomeAmtOrPct,
          incomeDistribution: formatDistribution(itype.expectedAnnualIncome),
          taxability: itype.taxability === 'taxable'
        });
      }
    }
  
    return Array.from(seen.values());
  }  
  
  module.exports = formatInvestmentTypes;
  