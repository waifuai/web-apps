const CONFIG = {
  tokens: 5,
  affiliates: 10,
  steps: 100,
  initialSupply: 1000,
  baseCommission: 0.05,
  curveTypes: ['linear', 'exponential', 'sigmoid', 'root', 'inverse'],
  transactionRange: [10, 100],
  curveParams: {
    linear: { slope: 0.1 },
    exponential: { base: 1.1 },
    sigmoid: { k: 0.02 },
    root: { n: 2 },
    inverse: { scale: 100 }
  }
};