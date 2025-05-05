function formatLifeExpectancy(lifeObj) {
    if (!lifeObj || !lifeObj.lifeExpectancyMethod) return null;
  
    if (lifeObj.lifeExpectancyMethod === 'fixedValue') {
      return {
        type: 'fixed',
        value: lifeObj.fixedValue
      };
    }
  
    if (lifeObj.lifeExpectancyMethod === 'normalDistribution') {
      return {
        type: 'normal',
        mean: lifeObj.normalDistribution?.mean,
        stdev: lifeObj.normalDistribution?.standardDeviation
      };
    }
  
    return null; // fallback
  }
  
  module.exports = formatLifeExpectancy;
  