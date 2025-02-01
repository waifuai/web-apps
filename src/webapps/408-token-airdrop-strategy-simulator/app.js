class User {
  constructor(type) {
    this.type = type;
    this.tokens = 0;
    this.activity = Math.random();
    this.sellThreshold = this.calculateSellThreshold();
  }

  calculateSellThreshold() {
    const thresholds = {
      speculator: 0.3,
      holder: 0.8,
      hunter: 0.4,
      active: 0.6
    };
    return thresholds[this.type] || 0.5;
  }

  decideAction(price) {
    const rand = Math.random();
    const priceSentiment = price > 1 ? 0.6 : 0.4;
    return rand < this.sellThreshold * priceSentiment ? 'sell' : 'buy';
  }
}

class TokenEconomy {
  constructor(users, burnRate) {
    this.users = users;
    this.price = 1.0;
    this.supply = 1000000;
    this.burnRate = burnRate;
    this.transactionHistory = [];
  }

  executeTransaction(user, action, amount) {
    const effectiveAmount = action === 'sell' ? 
      Math.min(amount, user.tokens) : 
      amount * (1 - this.burnRate);
    
    if (action === 'sell') {
      user.tokens -= effectiveAmount;
      this.supply += effectiveAmount;
      this.price *= 0.99;
    } else {
      user.tokens += effectiveAmount;
      this.supply -= effectiveAmount * this.burnRate;
      this.price *= 1.01;
    }
    
    this.transactionHistory.push({ user, action, amount: effectiveAmount });
  }

  simulateDay() {
    this.users.forEach(user => {
      const action = user.decideAction(this.price);
      const amount = Math.random() * 100;
      this.executeTransaction(user, action, amount);
    });
  }
}

class AirdropStrategy {
  static execute(strategy, users, day) {
    switch(strategy) {
      case 'lottery':
        return this.lotteryAirdrop(users);
      case 'uniform':
        return this.uniformAirdrop(users);
      case 'tiered':
        return this.tieredAirdrop(users);
      case 'vesting':
        return this.vestingAirdrop(users, day);
      default:
        return [];
    }
  }

  static lotteryAirdrop(users) {
    const winners = users.filter(() => Math.random() < 0.1);
    winners.forEach(user => user.tokens += 100);
    return winners;
  }

  static uniformAirdrop(users) {
    users.forEach(user => user.tokens += 50);
    return users;
  }

  static tieredAirdrop(users) {
    users.sort((a, b) => b.tokens - a.tokens);
    const tiers = [
      { count: Math.floor(users.length * 0.1), amount: 200 },
      { count: Math.floor(users.length * 0.3), amount: 100 },
      { count: users.length, amount: 50 }
    ];
    tiers.forEach(({ count, amount }) => {
      users.slice(0, count).forEach(user => user.tokens += amount);
    });
    return users;
  }

  static vestingAirdrop(users, day) {
    const vestedUsers = users.filter(user => 
      user.activity > 0.5 && day % 30 === 0
    );
    vestedUsers.forEach(user => {
      user.tokens += 100 * (1 - (day / 180));
    });
    return vestedUsers;
  }
}

class Simulation {
  constructor() {
    this.chart = null;
    this.simulations = [];
    this.colors = d3.scaleOrdinal()
      .domain(['lottery', 'uniform', 'tiered', 'vesting'])
      .range(['#ff4757', '#2ed573', '#3742fa', '#ffa502']);
  }

  initChart() {
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = 1200 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    d3.select('#chart').html('');
    this.chart = d3.select('#chart')
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
  }

  updateChart() {
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = 1200 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const x = d3.scaleLinear()
      .domain([0, d3.max(this.simulations, d => d.days)])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(this.simulations.flatMap(s => s.prices))])
      .range([height, 0]);

    const line = d3.line()
      .x((d, i) => x(i))
      .y(d => y(d))
      .curve(d3.curveMonotoneX);

    this.chart.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d => `Day ${d}`));

    this.chart.append('g')
      .call(d3.axisLeft(y).ticks(5));

    this.simulations.forEach((sim, i) => {
      this.chart.append('path')
        .datum(sim.prices)
        .attr('fill', 'none')
        .attr('stroke', this.colors(sim.strategy))
        .attr('stroke-width', 2)
        .attr('d', line);
    });
  }

  async runSimulation(strategy, userCount, days, burnRate) {
    const users = Array.from({ length: userCount }, () => {
      const types = ['speculator', 'holder', 'hunter', 'active'];
      return new User(types[Math.floor(Math.random() * types.length)]);
    });

    const economy = new TokenEconomy(users, burnRate);
    const priceHistory = [];

    for (let day = 0; day < days; day++) {
      if (day % 14 === 0) {
        AirdropStrategy.execute(strategy, users, day);
      }
      economy.simulateDay();
      priceHistory.push(economy.price);
      await new Promise(r => setTimeout(r, 5));
    }

    this.simulations.push({
      strategy,
      days,
      prices: priceHistory,
      finalSupply: economy.supply
    });

    this.updateChart();
  }
}

const simulation = new Simulation();
document.getElementById('runSimulation').addEventListener('click', () => {
  simulation.initChart();
  simulation.simulations = [];
  
  const strategies = ['lottery', 'uniform', 'tiered', 'vesting'];
  const userCount = parseInt(document.getElementById('userCount').value);
  const days = parseInt(document.getElementById('days').value);
  const burnRate = parseFloat(document.getElementById('burnRate').value);
  
  strategies.forEach(strategy => {
    simulation.runSimulation(
      strategy,
      userCount,
      days,
      burnRate
    );
  });
});