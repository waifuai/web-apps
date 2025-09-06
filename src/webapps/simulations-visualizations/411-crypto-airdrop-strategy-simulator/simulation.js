class User {
  constructor(type) {
    this.type = type;
    this.tokens = 0;
    this.vestedTokens = 0;
    this.activityLevel = Math.random();
    
    // Initialize behavior profiles
    const profiles = {
      speculator: { buyProb: 0.7, sellProb: 0.6, holdBase: 0.3 },
      holder: { buyProb: 0.4, sellProb: 0.1, holdBase: 0.8 },
      hunter: { buyProb: 0.5, sellProb: 0.9, holdBase: 0.1 },
      active: { buyProb: 0.6, sellProb: 0.3, holdBase: 0.5 }
    };
    
    this.behavior = profiles[type] || profiles.holder;
  }

  decideAction(price, marketSentiment) {
    const adjustedBuyProb = this.behavior.buyProb * marketSentiment;
    const adjustedSellProb = this.behavior.sellProb * (1 - marketSentiment);
    
    if (Math.random() < adjustedBuyProb) return 'buy';
    if (Math.random() < adjustedSellProb) return 'sell';
    return 'hold';
  }
}

class AirdropStrategy {
  static strategies = {
    lottery: {
      apply: (users, supply) => {
        const winners = users.filter(() => Math.random() < 0.1);
        const amount = supply * 0.0005;
        winners.forEach(u => u.tokens += amount);
        return amount * winners.length;
      }
    },
    uniform: {
      apply: (users, supply) => {
        const amount = supply * 0.0001;
        users.forEach(u => u.tokens += amount);
        return amount * users.length;
      }
    },
    tiered: {
      apply: (users, supply) => {
        let total = 0;
        users.sort((a, b) => b.tokens - a.tokens);
        users.forEach((u, i) => {
          const tier = Math.ceil((users.length - i) / (users.length / 5));
          const amount = supply * 0.00005 * tier;
          u.tokens += amount;
          total += amount;
        });
        return total;
      }
    },
    vesting: {
      apply: (users, supply) => {
        const amount = supply * 0.0002;
        let total = 0;
        users.forEach(u => {
          u.vestedTokens += amount;
          const release = amount * 0.1;
          u.tokens += release;
          total += release;
        });
        return total;
      }
    }
  };
}

class TokenEconomy {
  constructor() {
    this.price = 1.0;
    this.totalSupply = 1000000;
    this.burnRate = 0.02;
    this.history = [];
  }

  updatePrice(netBuys) {
    const priceChange = netBuys / 1000;
    this.price *= 1 + priceChange;
    this.price = Math.max(0.1, this.price);
    
    // Apply burn mechanism
    const burned = Math.abs(netBuys) * this.burnRate;
    this.totalSupply -= burned;
    
    this.history.push({
      price: this.price,
      supply: this.totalSupply
    });
  }
}

let chart;
const strategies = Object.keys(AirdropStrategy.strategies);

function initializeChart() {
  const ctx = document.getElementById('priceChart').getContext('2d');
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Token Price',
        data: [],
        borderColor: '#4CAF50',
        tension: 0.4
      }, {
        label: 'Total Supply',
        data: [],
        borderColor: '#2196F3',
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: 'Market Dynamics' }
      },
      scales: {
        y: { beginAtZero: false }
      }
    }
  });
}

function createStrategyCards() {
  const container = document.getElementById('strategies');
  strategies.forEach(strategy => {
    const card = document.createElement('div');
    card.className = 'strategy-card';
    card.dataset.strategy = strategy; // Add data attribute for reliable strategy access
    card.innerHTML = `
      <h3>${strategy.toUpperCase()}</h3>
      <p>${getStrategyDescription(strategy)}</p>
    `;
    card.onclick = () => toggleStrategy(card, strategy);
    container.appendChild(card);
  });
}

function getStrategyDescription(strategy) {
  const descriptions = {
    lottery: 'Random distribution to 10% of users',
    uniform: 'Equal amount to all users',
    tiered: 'More tokens to top holders',
    vesting: 'Gradual token release over time'
  };
  return descriptions[strategy];
}

function toggleStrategy(card, strategy) {
  document.querySelectorAll('.strategy-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
}

async function runSimulation() {
  const numUsers = parseInt(document.getElementById('numUsers').value);
  const numSteps = parseInt(document.getElementById('numSteps').value);
  const selectedStrategy = document.querySelector('.selected').dataset.strategy; // Fixed strategy selection

  // Initialize economy and users
  const economy = new TokenEconomy();
  const users = Array.from({ length: numUsers }, () => 
    new User(['speculator', 'holder', 'hunter', 'active'][Math.floor(Math.random() * 4)])
  );

  // Run simulation steps
  for (let i = 0; i < numSteps; i++) {
    let netBuys = 0;
    
    // User actions
    users.forEach(user => {
      const action = user.decideAction(economy.price, Math.random());
      if (action === 'buy') netBuys++;
      if (action === 'sell') netBuys--;
    });

    // Apply airdrop strategy
    const airdropped = AirdropStrategy.strategies[selectedStrategy].apply(users, economy.totalSupply);
    economy.totalSupply += airdropped;

    economy.updatePrice(netBuys);
  }

  // Update chart
  chart.data.labels = economy.history.map((_, i) => i);
  chart.data.datasets[0].data = economy.history.map(h => h.price);
  chart.data.datasets[1].data = economy.history.map(h => h.supply);
  chart.update();
}

// Initialize
window.onload = () => {
  initializeChart();
  createStrategyCards();
  document.querySelector('.strategy-card').click();
};