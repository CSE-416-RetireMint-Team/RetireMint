function formatInvestments(investments) {
    return investments.map(inv => {
      const investmentTypeName = inv.investmentType?.name || '';
      const taxStatus = inv.accountTaxStatus || 'non-retirement';
  
      return {
        investmentType: investmentTypeName,
        value: inv.value,
        taxStatus,
        id: inv.name // use the investment's own name
      };
    });
  }
  module.exports = formatInvestments;
  