function mapInflation(inflation) {
  if (!inflation) return { type: 'fixed', value: 0 };

  switch (inflation.method) {
    case 'fixedPercentage':
      return {
        type: 'fixed',
        value: (inflation.fixedPercentage ?? 0) / 100
      };

    case 'normalPercentage':
      return {
        type: 'normal',
        mean: (inflation.normalPercentage?.mean ?? 0) / 100,
        stdev: (inflation.normalPercentage?.sd ?? 0) / 100
      };

    case 'uniformPercentage':
      return {
        type: 'uniform',
        lower: (inflation.uniformPercentage?.lowerBound ?? 0) / 100,
        upper: (inflation.uniformPercentage?.upperBound ?? 0) / 100
      };

    default:
      return { type: 'fixed', value: 0 };
  }
}
  module.exports = mapInflation;