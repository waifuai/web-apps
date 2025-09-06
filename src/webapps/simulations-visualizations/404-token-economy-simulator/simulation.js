class TokenEconomy {
  constructor(params) {
    this.p0 = params.initialPrice;
    this.s0 = params.initialSupply;
    this.tmax = params.timeSteps;
    this.strategy = params.strategy;
    this.userDistribution = params.userDistribution;
  }

  demandCurve(p, t) {
    const holderEffect = this.userDistribution.holders * Math.exp(-0.1 * p);
    const traderEffect = this.userDistribution.traders * (p < this.p0 ? 1.5 : 0.8);
    const farmerEffect = this.userDistribution.farmers * (1 - t/this.tmax);
    return holderEffect + traderEffect + farmerEffect;
  }

  airdropAmount(t) {
    switch(this.strategy.type) {
      case 'constant':
        return this.strategy.baseAmount;
      case 'decaying':
        return this.strategy.baseAmount * Math.exp(-this.strategy.decayRate * t);
      case 'supply_based':
        return this.strategy.supplyPercentage * this.simSupply[t-1];
      default:
        return 0;
    }
  }

  simulate() {
    let p = [this.p0];
    let s = [this.s0];
    
    for(let t = 1; t <= this.tmax; t++) {
      const airdrop = this.airdropAmount(t);
      const newSupply = s[t-1] + airdrop;
      const demandFactor = this.demandCurve(p[t-1], t);
      const priceAdjustment = demandFactor / (newSupply / s[0]);
      
      s.push(newSupply);
      p.push(p[t-1] * priceAdjustment);
    }
    
    return { prices: p, supplies: s };
  }
}

function updateChart() {
  const params = {
    initialPrice: parseFloat(document.getElementById('p0').value),
    initialSupply: parseFloat(document.getElementById('s0').value),
    timeSteps: parseInt(document.getElementById('tmax').value),
    strategy: {
      type: document.getElementById('strategy').value,
      baseAmount: 10000,
      decayRate: 0.05,
      supplyPercentage: 0.02
    },
    userDistribution: {
      holders: parseFloat(document.getElementById('holder_pct').value)/100,
      traders: parseFloat(document.getElementById('trader_pct').value)/100,
      farmers: parseFloat(document.getElementById('farmer_pct').value)/100
    }
  };

  const economy = new TokenEconomy(params);
  const results = economy.simulate();

  const time = Array.from({length: params.timeSteps+1}, (_, i) => i);
  
  const trace1 = {
    x: time,
    y: results.prices,
    name: 'Token Price',
    line: {color: '#00ff9d'}
  };
  
  const trace2 = {
    x: time,
    y: results.supplies.map(s => s/params.initialSupply),
    name: 'Normalized Supply',
    line: {color: '#ff416d'},
    yaxis: 'y2'
  };

  const layout = {
    title: 'Token Economy Simulation',
    plot_bgcolor: '#2a2a2a',
    paper_bgcolor: '#2a2a2a',
    font: {color: '#fff'},
    xaxis: {title: 'Time Step'},
    yaxis: {title: 'Price ($)', color: '#fff'},
    yaxis2: {
      title: 'Supply (Normalized)',
      overlaying: 'y',
      side: 'right',
      color: '#fff'
    },
    legend: {x: 0.1, y: 1.1}
  };

  Plotly.newPlot('chart', [trace1, trace2], layout);
}

// Initial render
updateChart();

// Add event listeners
document.querySelectorAll('input, select').forEach(element => {
  element.addEventListener('change', updateChart);
});