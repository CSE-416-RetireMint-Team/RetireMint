function mapExpectedAnnualChange(dist, amtOrPct = 'percent') {
    if (dist.type === 'fixed') {
      return {
        method: amtOrPct === 'amount' ? 'fixedValue' : 'fixedPercentage',
        [amtOrPct === 'amount' ? 'fixedValue' : 'fixedPercentage']: dist.value
      };
    } else if (dist.type === 'normal') {
      return {
        method: amtOrPct === 'amount' ? 'normalValue' : 'normalPercentage',
        [amtOrPct === 'amount' ? 'normalValue' : 'normalPercentage']: {
          mean: dist.mean,
          sd: dist.stdev
        }
      };
    } else if (dist.type === 'uniform') {
      return {
        method: amtOrPct === 'amount' ? 'uniformValue' : 'uniformPercentage',
        [amtOrPct === 'amount' ? 'uniformValue' : 'uniformPercentage']: {
          lowerBound: dist.lower,
          upperBound: dist.upper
        }
      };
    } else {
      throw new Error(`Unknown distribution type: ${dist.type}`);
    }
  }
