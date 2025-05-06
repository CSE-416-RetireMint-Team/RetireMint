function formatStart(start) {
    if (!start) return null;
    switch (start.method) {
      case 'fixedValue': return { type: 'fixed', value: start.fixedValue };
      case 'normalValue': return { type: 'normal', mean: start.normalValue.mean, stdev: start.normalValue.sd };
      case 'uniformValue': return { type: 'uniform', lower: start.uniformValue.lowerBound, upper: start.uniformValue.upperBound };
      case 'sameYearAsAnotherEvent': return { type: 'startWith', eventSeries: start.sameYearAsAnotherEvent };
      case 'yearAfterAnotherEventEnd': return { type: 'startAfter', eventSeries: start.yearAfterAnotherEventEnd };
      default: return null;
    }
  }
  
  function formatDuration(duration) {
    if (!duration) return null;
    switch (duration.method) {
      case 'fixedValue': return { type: 'fixed', value: duration.fixedValue };
      case 'normalValue': return { type: 'normal', mean: duration.normalValue.mean, stdev: duration.normalValue.sd };
      case 'uniformValue': return { type: 'uniform', lower: duration.uniformValue.lowerBound, upper: duration.uniformValue.upperBound };
      default: return null;
    }
  }
  
  function formatExpectedChange(change) {
    if (!change) return null;
    switch (change.method) {
      case 'fixedValue': return { type: 'fixed', value: change.fixedValue };
      case 'normalValue': return { type: 'normal', mean: change.normalValue.mean, stdev: change.normalValue.sd };
      case 'uniformValue': return { type: 'uniform', lower: change.uniformValue.lowerBound, upper: change.uniformValue.upperBound };
      default: return null;
    }
  }
  
  function mapEventSeries(events) {
    return events.map(e => {
      const base = {
        name: e.name,
        start: formatStart(e.startYear),
        duration: formatDuration(e.duration),
        type: e.type
      };
  
      if (e.type === 'income' && e.income) {
        base.initialAmount = e.income.initialAmount;
        base.changeAmtOrPct = 'amount';
        base.changeDistribution = formatExpectedChange(e.income.expectedAnnualChange);
        base.inflationAdjusted = e.income.inflationAdjustment;
        base.userFraction = e.income.marriedPercentage ?? 1.0;
        base.socialSecurity = e.income.isSocialSecurity;
      }
  
      if (e.type === 'expense' && e.expense) {
        base.initialAmount = e.expense.initialAmount;
        base.changeAmtOrPct = 'percent';
        base.changeDistribution = formatExpectedChange(e.expense.expectedAnnualChange);
        base.inflationAdjusted = e.expense.inflationAdjustment;
        base.userFraction = e.expense.marriedPercentage ?? 1.0;
        base.discretionary = e.expense.isDiscretionary;
      }
  
      if (e.type === 'invest' && e.invest) {
        base.assetAllocation = e.invest.investmentStrategy?.nonRetirementAllocation || {};
        base.glidePath = e.invest.modifyMaximumCash || false;
        base.assetAllocation2 = e.invest.finalInvestmentStrategy?.nonRetirementAllocation || {};
        base.maxCash = e.invest.newMaximumCash ?? 0;
      }
  
      if (e.type === 'rebalance' && e.rebalance) {
        base.assetAllocation = e.rebalance.rebalanceStrategy?.nonRetirementAllocation || {};
      }
  
      return base;
    });
  }  
  
  module.exports = mapEventSeries;
  