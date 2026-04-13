class Token {
  constructor(id, initialSupply, curveType) {
    this.id = id;
    this.supply = initialSupply;
    this.curveType = curveType;
    this.priceHistory = [];
    this.curveTypes = [...CONFIG.curveTypes];
    this.params = { ...CONFIG.curveParams[curveType] };
  }

  calculatePrice() {
    const { supply } = this;
    switch(this.curveType) {
      case 'linear': return this.params.slope * supply;
      case 'exponential': return Math.pow(this.params.base, supply/100);
      case 'sigmoid': return 100 / (1 + Math.exp(-this.params.k * supply));
      case 'root': return Math.pow(supply, 1/this.params.n);
      case 'inverse': return this.params.scale / (supply || 1);
      default: return 0;
    }
  }

  updateCurve() {
    if(Math.random() < 0.1) {
      this.curveType = _.sample(this.curveTypes.filter(t => t !== this.curveType));
      this.params = { ...CONFIG.curveParams[this.curveType] };
    }
  }

  transact(quantity) {
    this.supply += quantity;
    const price = this.calculatePrice();
    this.priceHistory.push(price);
    return price;
  }
}

class Affiliate {
  constructor(id) {
    this.id = id;
    this.balance = 1000;
    this.commissionRate = CONFIG.baseCommission;
    this.earnings = 0;
    this.activity = 0;
  }

  adjustCommission() {
    this.commissionRate = CONFIG.baseCommission + 
      Math.tanh(this.earnings / 1000) * 0.04;
    this.commissionRate = Math.min(Math.max(this.commissionRate, 0.01), 0.1);
  }
}

class Simulation {
  constructor() {
    this.tokens = Array.from({ length: CONFIG.tokens }, (_, i) =>
      new Token(i, CONFIG.initialSupply, CONFIG.curveTypes[i % 5]));
    
    this.affiliates = Array.from({ length: CONFIG.affiliates }, (_, i) =>
      new Affiliate(i));
    
    this.data = {
      prices: Array(CONFIG.tokens).fill().map(() => []),
      supplies: Array(CONFIG.tokens).fill().map(() => []),
      commissions: Array(CONFIG.affiliates).fill().map(() => []),
      balances: Array(CONFIG.affiliates).fill().map(() => [])
    };
  }

  runStep() {
    // Token updates
    this.tokens.forEach(token => {
      token.updateCurve();
      this.data.prices[token.id].push(_.last(token.priceHistory));
      this.data.supplies[token.id].push(token.supply);
    });

    // Affiliate transactions
    this.affiliates.forEach(affiliate => {
      const token = _.sample(this.tokens);
      const amount = _.random(...CONFIG.transactionRange);
      
      if(Math.random() > 0.5) {
        const cost = token.transact(-amount) * amount;
        affiliate.balance -= cost;
        affiliate.earnings += cost * affiliate.commissionRate;
      } else {
        const gain = token.transact(amount) * amount;
        affiliate.balance += gain;
        affiliate.earnings += gain * affiliate.commissionRate;
      }
      
      affiliate.activity++;
      affiliate.adjustCommission();
      
      this.data.commissions[affiliate.id].push(affiliate.commissionRate);
      this.data.balances[affiliate.id].push(affiliate.balance);
    });
  }

  runFullSimulation() {
    Array.from({ length: CONFIG.steps }).forEach(() => this.runStep());
    this.renderCharts();
  }

  renderCharts() {
    // Destroy existing charts before creating new ones
    const destroyChart = (canvasId) => {
      const canvas = document.getElementById(canvasId)
      if (!canvas) return
      const chart = Chart.getChart(canvas)
      if (chart) chart.destroy()
    }

    destroyChart('tokenChart')
    destroyChart('affiliateChart')

    const tokenCtx = document.getElementById('tokenChart').getContext('2d')
    const affiliateCtx = document.getElementById('affiliateChart').getContext('2d')
    
    // Token price/supply chart
    new Chart(tokenCtx, {
      type: 'line',
      data: {
        labels: Array(CONFIG.steps).fill().map((_, i) => i),
        datasets: this.tokens.map(token => ({
          label: `Token ${token.id} (${token.curveType})`,
          data: this.data.prices[token.id],
          borderColor: `hsl(${token.id * 70}, 70%, 50%)`,
          tension: 0.3,
          yAxisID: 'y'
        })).concat(this.tokens.map(token => ({
          label: `Supply ${token.id}`,
          data: this.data.supplies[token.id],
          borderColor: `hsl(${token.id * 70}, 70%, 30%)`,
          tension: 0.3,
          yAxisID: 'y1',
          hidden: true
        })))
      },
      options: {
        scales: {
          y: { type: 'linear', position: 'left' },
          y1: { type: 'linear', position: 'right' }
        },
        plugins: {
          zoom: {
            zoom: { wheel: { enabled: true }, pinch: { enabled: true } }
          }
        }
      }
    });

    // Affiliate metrics chart
    new Chart(affiliateCtx, {
      type: 'bar',
      data: {
        labels: this.affiliates.map(a => `A${a.id}`),
        datasets: [{
          label: 'Final Balance',
          data: this.affiliates.map(a => a.balance),
          backgroundColor: 'rgba(75, 192, 192, 0.6)'
        }, {
          label: 'Total Earnings',
          data: this.affiliates.map(a => a.earnings),
          backgroundColor: 'rgba(153, 102, 255, 0.6)'
        }]
      },
      options: {
        scales: { y: { beginAtZero: true } },
        plugins: {
          tooltip: {
            callbacks: {
              label: ctx => `Commission: ${(ctx.raw * 100).toFixed(2)}%`
            }
          }
        }
      }
    });
  }
}

// Initialize and run
document.getElementById('runSimulation').addEventListener('click', () => {
  new Simulation().runFullSimulation();
});