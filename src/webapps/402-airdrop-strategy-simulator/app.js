class TokenEconomySimulator {
  constructor(params) {
    this.params = {
      initialSupply: 1e6,
      initialPrice: 1.00,
      timeSteps: 100,
      numUsers: 500,
      strategy: 'uniform',
      ...params
    };

    this.reset();
  }

  reset() {
    this.t = 0;
    this.priceHistory = [this.params.initialPrice];
    this.supplyHistory = [this.params.initialSupply];
    this.users = this.generateUsers();
    this.applyAirdrop();
  }

  generateUsers() {
    const archetypes = [
      {buy: 0.2, sell: 0.1, sigma: 0.3, mu: 0.4},  // Holders
      {buy: 0.1, sell: 0.3, sigma: 0.5, mu: 0.2},  // Traders
      {buy: 0.05, sell: 0.5, sigma: 0.7, mu: 0.1}  // Speculators
    ];
    
    return Array.from({length: this.params.numUsers}, () => {
      const archetype = archetypes[Math.floor(Math.random() * archetypes.length)];
      return {
        holdings: 0,
        vested: 0,
        ...archetype,
        activity: 0,
        buyProb: 0,
        sellProb: 0
      };
    });
  }

  applyAirdrop() {
    const totalAirdrop = this.params.initialSupply * 0.2;
    
    switch(this.params.strategy) {
      case 'uniform':
        const amount = totalAirdrop / this.users.length;
        this.users.forEach(u => u.holdings += amount);
        break;
        
      case 'lottery':
        const winners = this.users.filter(() => Math.random() < 0.1);
        const winAmount = totalAirdrop / winners.length;
        winners.forEach(u => u.holdings += winAmount);
        break;
        
      case 'tiered':
        const tiers = [100, 50, 10];
        const weights = [5, 3, 1];
        this.users.forEach(u => {
          const tier = tiers.findIndex(t => u.holdings >= t);
          u.holdings += tier >= 0 ? weights[tier] * 100 : 0;
        });
        break;
    }
  }

  calculateProbabilities() {
    const currentPrice = this.priceHistory[this.t];
    
    this.users.forEach(user => {
      const priceChange = (currentPrice - this.params.initialPrice) / this.params.initialPrice;
      
      // Buy probability equation
      user.buyProb = 1 / (1 + Math.exp(-(
        user.buy + 
        user.sigma * (this.params.initialPrice - currentPrice) +
        user.mu * this.marketSentiment() -
        priceChange * 0.5
      )));
      
      // Sell probability equation
      user.sellProb = 1 / (1 + Math.exp(-(
        user.sell -
        user.sigma * (currentPrice - this.params.initialPrice) +
        user.mu * this.marketSentiment() +
        priceChange * 0.3
      ))) * (1 + Math.log(user.holdings + 1)) * (user.holdings > 0 ? 1 : 0);
    });
  }

  marketSentiment() {
    // Simple mean-reverting sentiment model
    const price = this.priceHistory[this.t];
    return Math.tanh((price - this.params.initialPrice) * 10) * 0.5;
  }

  step() {
    this.calculateProbabilities();
    
    let totalDemand = 0;
    let totalSupply = 0;
    
    // Execute trading decisions
    this.users.forEach(user => {
      if (Math.random() < user.buyProb) {
        const buyAmount = 50 * this.priceHistory[this.t];
        totalDemand += buyAmount;
      }
      
      if (Math.random() < user.sellProb && user.holdings > 0) {
        const sellAmount = user.holdings;
        totalSupply += sellAmount * this.priceHistory[this.t];
      }
    });
    
    // Update price and supply
    const priceDelta = (totalDemand - totalSupply) / this.supplyHistory[this.t];
    const newPrice = Math.max(
      this.priceHistory[this.t] + priceDelta * 15 + (Math.random() - 0.5) * 0.02,
      0.000001
    );
    
    const burnAmount = (totalDemand + totalSupply) * 0.05;
    const newSupply = Math.max(this.supplyHistory[this.t] - burnAmount, 1000);
    
    this.priceHistory.push(newPrice);
    this.supplyHistory.push(newSupply);
    this.t++;
  }

  runFullSimulation() {
    while (this.t < this.params.timeSteps) {
      this.step();
    }
    return {
      prices: this.priceHistory,
      supply: this.supplyHistory
    };
  }
}

// Visualization and UI Handling
class SimulationVisualizer {
  constructor() {
    this.chartElement = document.getElementById('chart');
    this.initEventListeners();
  }

  initEventListeners() {
    document.getElementById('runSimulation').addEventListener('click', () => this.runSimulation());
  }

  async runSimulation() {
    const params = {
      initialSupply: parseFloat(document.getElementById('initialSupply').value),
      initialPrice: parseFloat(document.getElementById('initialPrice').value),
      timeSteps: parseInt(document.getElementById('timeSteps').value),
      numUsers: parseInt(document.getElementById('numUsers').value),
      strategy: document.getElementById('strategyType').value
    };

    const simulator = new TokenEconomySimulator(params);
    const results = simulator.runFullSimulation();
    
    this.updateMetrics(results);
    this.renderChart(results);
  }

  renderChart(results) {
    const trace1 = {
      x: results.prices.map((_, i) => i),
      y: results.prices,
      name: 'Token Price',
      line: {color: '#60f0f0'}
    };

    const trace2 = {
      x: results.supply.map((_, i) => i),
      y: results.supply,
      name: 'Token Supply',
      yaxis: 'y2',
      line: {color: '#ff6060'}
    };

    const layout = {
      plot_bgcolor: 'rgba(16, 16, 48, 0.9)',
      paper_bgcolor: 'rgba(0,0,0,0)',
      font: {color: '#e0e0ff'},
      xaxis: {title: 'Time Step'},
      yaxis: {title: 'Price (USD)', color: '#60f0f0'},
      yaxis2: {
        title: 'Supply',
        overlaying: 'y',
        side: 'right',
        color: '#ff6060'
      },
      margin: {t: 30},
      showlegend: true,
      legend: {x: 0.1, y: 1.1}
    };

    Plotly.newPlot(this.chartElement, [trace1, trace2], layout);
  }

  updateMetrics(results) {
    const prices = results.prices;
    const supply = results.supply;
    
    document.getElementById('finalPrice').textContent = 
      `$${prices[prices.length - 1].toFixed(4)}`;
      
    document.getElementById('finalSupply').textContent = 
      Math.floor(supply[supply.length - 1]).toLocaleString();
      
    const maxDrawdown = Math.min(...prices.map((p, i) => 
      (p - Math.max(...prices.slice(0, i + 1))) / Math.max(...prices.slice(0, i + 1))
    ));
    
    document.getElementById('maxDrawdown').textContent = 
      `${(maxDrawdown * 100).toFixed(1)}%`;
  }
}

// Initialize visualizer when DOM loads
new SimulationVisualizer();