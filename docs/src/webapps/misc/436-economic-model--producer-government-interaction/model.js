class EconomicModel {
  constructor() {
    this.resetToDefaults();
  }
  
  resetToDefaults() {
    this.params = {
      N0: 1000,  // Initial number of producers
      P: 100,    // Base productivity
      a: 0.5,    // Tax sensitivity for motivation
      b: 0.3,    // Regulation sensitivity for motivation
      c: 0.4,    // Tax sensitivity for strike
      d: 0.2     // Regulation sensitivity for strike
    };
  }
  
  updateParam(param, value) {
    if (param in this.params) {
      this.params[param] = value;
      return true;
    }
    return false;
  }
  
  calculate(T, R) {
    // Ensure T and R are in valid range [0,1]
    T = Math.max(0, Math.min(1, T));
    R = Math.max(0, Math.min(1, R));
    
    // Calculate Motivation (M) - bounded at minimum 0
    const M = Math.max(0, 1 - this.params.a * T - this.params.b * R);
    
    // Calculate Strike Probability (S) - bounded at maximum 1
    const S = Math.min(1, this.params.c * T + this.params.d * R);
    
    // Number of active producers
    const N = this.params.N0 * (1 - S);
    
    // Economic output
    const Y = N * this.params.P * M;
    
    // Tax revenue
    const taxRevenue = Y * T;
    
    return {
      M,                  // Motivation
      S,                  // Strike probability
      N,                  // Active producers
      Y,                  // Economic output
      taxRevenue,         // Government tax revenue
      activePercentage: 100 * (1 - S),  // Percentage of active producers
      inactivePercentage: 100 * S       // Percentage of inactive producers
    };
  }
  
  findOptimalPolicy() {
    const steps = 100;
    let maxOutput = 0;
    let optimalT = 0;
    let optimalR = 0;
    let optimalResults = null;
    
    // Grid search for optimal policy
    for (let t = 0; t <= 1; t += 1/steps) {
      for (let r = 0; r <= 1; r += 1/steps) {
        const results = this.calculate(t, r);
        if (results.Y > maxOutput) {
          maxOutput = results.Y;
          optimalT = t;
          optimalR = r;
          optimalResults = results;
        }
      }
    }
    
    return {
      T: optimalT,
      R: optimalR,
      results: optimalResults
    };
  }
  
  generateHeatmapData() {
    const steps = 20;
    const xValues = Array.from({length: steps+1}, (_, i) => i/steps);
    const yValues = Array.from({length: steps+1}, (_, i) => i/steps);
    const zValues = [];
    
    for (let i = 0; i <= steps; i++) {
      const row = [];
      const R = i / steps;
      
      for (let j = 0; j <= steps; j++) {
        const T = j / steps;
        const result = this.calculate(T, R);
        row.push(result.Y);
      }
      
      zValues.push(row);
    }
    
    return { xValues, yValues, zValues };
  }
  
  generateTaxEffectData() {
    const steps = 100;
    const taxValues = Array.from({length: steps+1}, (_, i) => i/steps);
    const outputs = [];
    const taxRevenues = [];
    
    // Fix regulation at 0.2 to isolate tax effects
    const R = 0.2;
    
    for (let i = 0; i <= steps; i++) {
      const T = i / steps;
      const result = this.calculate(T, R);
      outputs.push(result.Y);
      taxRevenues.push(result.taxRevenue);
    }
    
    return { taxValues, outputs, taxRevenues };
  }
}