function mapToScenarioModel(yamlData, userId, lifeExpectancyIds) {
  const maritalStatus = yamlData.maritalStatus;
  const birthYears = yamlData.birthYears;

  const isMarried = maritalStatus === 'couple';
  if (isMarried) {
    if (!birthYears[1]) {
      throw new Error("Missing spouse's birth year for married scenario.");
    }
    if (!lifeExpectancyIds.spouse) {
      throw new Error("Missing spouse's life expectancy for married scenario.");
    }
  }

  return {
    name: yamlData.name,
    userId: userId,
    scenarioType: isMarried ? 'married' : 'individual',
    birthYear: birthYears[0],
    spouseBirthYear: isMarried ? birthYears[1] : undefined,
    financialGoal: yamlData.financialGoal,
    stateOfResidence: yamlData.residenceState,
    lifeExpectancy: lifeExpectancyIds.user,
    spouseLifeExpectancy: isMarried ? lifeExpectancyIds.spouse : undefined,
    investments: [], // handled later
    events: [],      // handled later
    simulationSettings: null // handled later
  };
}

module.exports = mapToScenarioModel;

  