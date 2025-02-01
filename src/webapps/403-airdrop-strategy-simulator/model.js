export function simulateStrategy(config, params) {
  const { initialPrice, initialSupply, alpha, strategies } = config;
  const { T, sellProbability, strategy } = params;
  
  const prices = [initialPrice];
  const supplies = [initialSupply];
  
  const strategyFn = strategies[strategy];
  const totalAirdrop = T; // Normalized to T for comparison
  
  for (let t = 1; t <= T; t++) {
    const airdropFraction = strategyFn(t-1, T);
    const airdropAmount = totalAirdrop * airdropFraction;
    
    // Update supply
    const previousSupply = supplies[t-1];
    const newSupply = previousSupply + airdropAmount;
    
    // Calculate price impact
    const soldTokens = airdropAmount * sellProbability;
    const supplyChangeRatio = soldTokens / previousSupply;
    const priceImpact = alpha * supplyChangeRatio * 100;
    
    // Update price
    const previousPrice = prices[t-1];
    const newPrice = previousPrice * (1 - priceImpact);
    
    prices.push(newPrice);
    supplies.push(newSupply);
  }
  
  return {
    prices: prices.slice(1), // Remove initial value
    supplies: supplies.slice(1)
  };
}