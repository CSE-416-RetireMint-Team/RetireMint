const { calculateIncomeTax, calculateCapitalGainsTax } = require('./TaxCalculators');

describe('TaxCalculators', () => {
  describe('calculateIncomeTax', () => {
    it('should calculate tax correctly for a simple progressive bracket system', () => {
      const taxableIncome = 50000;
      const brackets = [
        { rate: .10, adjustedMinIncome: 0, adjustedMaxIncome: 10000 },
        { rate: .12, adjustedMinIncome: 10000, adjustedMaxIncome: 40000 },
        { rate: .22, adjustedMinIncome: 40000, adjustedMaxIncome: 90000 },
        // Add more brackets if needed for other tests
      ];

      // Expected calculation:
      // 10% on first 10000 = 1000
      // 12% on next 30000 (40000 - 10000) = 3600
      // 22% on next 10000 (50000 - 40000) = 2200
      // Total = 1000 + 3600 + 2200 = 6800
      const expectedTax = 6800;

      const calculatedTax = calculateIncomeTax(taxableIncome, brackets);

      expect(calculatedTax).toBeCloseTo(expectedTax); // Use toBeCloseTo for potential floating point issues
    });

    it('should return 0 tax for 0 income', () => {
      const taxableIncome = 0;
       const brackets = [
        { rate: .10, adjustedMinIncome: 0, adjustedMaxIncome: 10000 },
        { rate: .12, adjustedMinIncome: 10000, adjustedMaxIncome: 40000 },
      ];
      expect(calculateIncomeTax(taxableIncome, brackets)).toBe(0);
    });

    it('should calculate tax correctly when income falls entirely within the first bracket', () => {
        const taxableIncome = 8000;
        const brackets = [
            { rate: .10, adjustedMinIncome: 0, adjustedMaxIncome: 10000 },
            { rate: .12, adjustedMinIncome: 10000, adjustedMaxIncome: 40000 },
        ];
        // Expected: 10% of 8000 = 800
        expect(calculateIncomeTax(taxableIncome, brackets)).toBeCloseTo(800);
    });
    
     it('should handle income exactly matching a bracket boundary', () => {
        const taxableIncome = 40000;
        const brackets = [
            { rate: .10, adjustedMinIncome: 0, adjustedMaxIncome: 10000 },
            { rate: .12, adjustedMinIncome: 10000, adjustedMaxIncome: 40000 },
            { rate: .22, adjustedMinIncome: 40000, adjustedMaxIncome: 90000 },
        ];
        // Expected: 10% on 10000 (1000) + 12% on 30000 (3600) = 4600
        expect(calculateIncomeTax(taxableIncome, brackets)).toBeCloseTo(4600);
    });
    
    // Add more tests for edge cases like empty brackets, invalid input, etc.
  });

  describe('calculateCapitalGainsTax', () => {
    // Example brackets (adjust these based on actual expected values for your simulation year/status)
    const capitalGainsBrackets = [
        { rate: 0, adjustedMinThreshold: 0, adjustedMaxThreshold: 45000 },      // 0% bracket up to 45k total income threshold
        { rate: 15, adjustedMinThreshold: 45000, adjustedMaxThreshold: 500000 }, // 15% bracket from 45k to 500k threshold
        { rate: 20, adjustedMinThreshold: 500000, adjustedMaxThreshold: Infinity } // 20% bracket above 500k threshold
    ];

    it('should return 0 tax when gains fall entirely within the 0% bracket', () => {
      const capitalGains = 10000;
      const taxableIncome = 30000; // Puts total income (30k + 10k = 40k) below 45k threshold
      expect(calculateCapitalGainsTax(capitalGains, taxableIncome, capitalGainsBrackets)).toBe(0);
    });

    it('should calculate correct tax when gains span 0% and 15% brackets', () => {
      const capitalGains = 20000;
      const taxableIncome = 30000; // Puts start of taxable income + gains at 30k
      // First 15k of gains (filling space up to 45k threshold) are taxed at 0%
      // Remaining 5k of gains (from 45k to 50k threshold) are taxed at 15%
      // Expected tax = (15000 * 0) + (5000 * 0.15) = 750
      expect(calculateCapitalGainsTax(capitalGains, taxableIncome, capitalGainsBrackets)).toBeCloseTo(750);
    });

    it('should calculate correct tax when gains fall entirely within the 15% bracket', () => {
      const capitalGains = 50000;
      const taxableIncome = 60000; // Base income is already above the 0% threshold (45k)
      // All 50k gains taxed at 15%
      // Expected tax = 50000 * 0.15 = 7500
      expect(calculateCapitalGainsTax(capitalGains, taxableIncome, capitalGainsBrackets)).toBeCloseTo(7500);
    });
    
    it('should calculate correct tax when gains span 15% and 20% brackets', () => {
      const capitalGains = 100000;
      const taxableIncome = 450000; // Base income is in 15% bracket, gains push into 20%
      // First 50k of gains (filling space from 450k up to 500k threshold) taxed at 15%
      // Remaining 50k of gains (above 500k threshold) taxed at 20%
      // Expected tax = (50000 * 0.15) + (50000 * 0.20) = 7500 + 10000 = 17500
      expect(calculateCapitalGainsTax(capitalGains, taxableIncome, capitalGainsBrackets)).toBeCloseTo(17500);
    });

    it('should calculate correct tax when gains fall entirely within the 20% bracket', () => {
        const capitalGains = 50000;
        const taxableIncome = 510000; // Base income is already above the 15% threshold (500k)
        // All 50k gains taxed at 20%
        // Expected tax = 50000 * 0.20 = 10000
        expect(calculateCapitalGainsTax(capitalGains, taxableIncome, capitalGainsBrackets)).toBeCloseTo(10000);
    });

    it('should return 0 tax for 0 capital gains', () => {
      const capitalGains = 0;
      const taxableIncome = 100000;
      expect(calculateCapitalGainsTax(capitalGains, taxableIncome, capitalGainsBrackets)).toBe(0);
    });
    
    // Add tests for edge cases like missing brackets, negative income/gains if applicable
  });
}); 