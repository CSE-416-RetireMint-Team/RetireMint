function convertYamlToLifeExpectancyDocs(yamlLEArray) {
    return yamlLEArray.map(entry => {
      if (entry.type === 'fixed') {
        return {
          lifeExpectancyMethod: 'fixedValue',
          fixedValue: entry.value
        };
      }
  
      if (entry.type === 'normal') {
        return {
          lifeExpectancyMethod: 'normalDistribution',
          normalDistribution: {
            mean: entry.mean,
            standardDeviation: entry.stdev
          }
        };
      }
  
      throw new Error(`Unsupported life expectancy type: ${entry.type}`);
    });
  }
  
  module.exports = convertYamlToLifeExpectancyDocs;
  