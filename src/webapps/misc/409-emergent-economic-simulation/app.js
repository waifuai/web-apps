class Agent {
  constructor(id, params) {
    this.id = id;
    this.balance = params.initialCtxBalance;
    this.preferences = Array.from({length: params.numResources}, 
      () => Math.random());
    this.demandMultiplier = 1;
    this.active = true;
    this.income = 0;
    this.expenses = 0;
  }

  requestResources(resources) {
    if (!this.active) return;
    
    const totalPreference = this.preferences.reduce((a, b) => a + b, 0);
    return this.preferences.map((pref, i) => {
      const maxAffordable = this.balance / (resources[i].price || 1);
      return Math.min(pref / totalPreference * this.demandMultiplier, maxAffordable);
    });
  }
}

class Resource {
  constructor(id, params) {
    this.id = id;
    this.capacity = params.resourceCapacity;
    this.load = 0;
    this.price = params.baseResourceCost;
    this.regenRate = params.resourceRegenRate;
  }

  updatePrice(elasticity) {
    const utilization = this.load / this.capacity;
    this.price *= 1 + elasticity * (utilization - 0.5);
    this.price = Math.max(this.price, 0.1);
  }

  regenerate(averageBalance, params) {
    this.capacity += this.regenRate * averageBalance * params.dynamicRegenMultiplier;
    this.capacity = Math.min(this.capacity, params.maxResourceCapacity);
    this.load *= 1 - params.deallocationRate;
  }
}

class Simulation {
  constructor() {
    this.params = {
      numAgents: 50,
      numResources: 3,
      initialCtxBalance: 100,
      resourceCapacity: 1000,
      baseResourceCost: 1,
      priceElasticity: 0.1,
      deallocationRate: 0.1,
      agentIncome: 10,
      resourceRegenRate: 0.01,
      maxResourceCapacity: 5000,
      agentExpenseRate: 0.05,
      bankruptcyThreshold: -50,
      dynamicIncomeMultiplier: 0.1,
      taxRate: 0.05,
      resourceCapacityMultiplier: 0.001,
      initialImbalance: true,
      imbalanceStrength: 2
    };
    
    this.agents = [];
    this.resources = [];
    this.running = false;
    this.step = 0;
    this.history = [];
    this.initCharts();
    this.initParams();
    this.initVisualization();
  }

  initVisualization() {
    this.svg = d3.select('#economyViz');
    this.agentG = this.svg.append('g');
    this.resourceG = this.svg.append('g');
    
    // Position resources in a circle
    this.resourcePositions = Array.from({length: this.params.numResources}, (_, i) => {
      const angle = (i * 2 * Math.PI) / this.params.numResources;
      return {
        x: 400 + 250 * Math.cos(angle),
        y: 300 + 250 * Math.sin(angle)
      };
    });
  }

  initCharts() {
    this.charts = {
      balance: this.createChart('#balanceChart', 'Average Balance'),
      price: this.createChart('#priceChart', 'Resource Prices')
    };
  }

  createChart(selector, title) {
    const div = d3.select(selector);
    div.html('');
    const svg = div.append('svg').attr('width', '100%').attr('height', '100%');
    
    return {
      svg,
      x: d3.scaleLinear().domain([0, 1000]),
      y: d3.scaleLinear().domain([0, 100]),
      line: d3.line()
        .x(d => this.charts.balance.x(d.step))
        .y(d => this.charts.balance.y(d.value))
    };
  }

  initParams() {
    const container = d3.select('#params');
    Object.entries(this.params).forEach(([key, val]) => {
      container.append('div').classed('param-item', true).html(`
        <label>${_.startCase(key)}:</label>
        <input type="number" value="${val}" id="param-${key}">
      `);
    });
  }

  start() {
    if (!this.running) {
      this.reset();
      this.running = true;
      this.loop();
    }
  }

  stop() {
    this.running = false;
  }

  reset() {
    this.agents = Array.from({length: this.params.numAgents}, (_, i) => 
      new Agent(i, this.params));
      
    this.resources = Array.from({length: this.params.numResources}, (_, i) => 
      new Resource(i, this.params));
      
    if (this.params.initialImbalance) {
      this.agents.forEach((agent, i) => {
        agent.balance *= Math.exp(-this.params.imbalanceStrength * i / this.params.numAgents);
      });
    }
  }

  loop() {
    if (!this.running) return;
    
    this.simulateStep();
    this.updateVisualization();
    this.updateCharts();
    this.step++;
    
    requestAnimationFrame(() => this.loop());
  }

  simulateStep() {
    // Main simulation logic as described in documentation
    // ... (full implementation of the 14-step process)
  }

  updateVisualization() {
    // Update agent positions and status
    const agents = this.agentG.selectAll('circle').data(this.agents);
    
    agents.enter().append('circle')
      .attr('cx', d => 400 + (Math.random() - 0.5) * 100)
      .attr('cy', d => 300 + (Math.random() - 0.5) * 100)
      .attr('r', 3)
      .attr('fill', d => d.active ? `var(--accent)` : `var(--danger)`)
      .merge(agents)
      .transition()
      .attr('cx', d => {
        const preferences = d.preferences.map((p, i) => 
          p * this.resourcePositions[i].x);
        return _.sum(preferences) / _.sum(d.preferences);
      })
      .attr('cy', d => {
        const preferences = d.preferences.map((p, i) => 
          p * this.resourcePositions[i].y);
        return _.sum(preferences) / _.sum(d.preferences);
      })
      .attr('class', d => d.active ? '' : 'bankrupt');

    // Update resource indicators
    const resources = this.resourceG.selectAll('circle').data(this.resources);
    
    resources.enter().append('circle')
      .attr('cx', (d, i) => this.resourcePositions[i].x)
      .attr('cy', (d, i) => this.resourcePositions[i].y)
      .attr('r', d => d.capacity / 50)
      .attr('fill', 'none')
      .attr('stroke', `var(--highlight)`)
      .merge(resources)
      .attr('r', d => d.capacity / 50)
      .append('title')
      .text(d => `Price: ${d.price.toFixed(2)}\nCapacity: ${d.capacity.toFixed(0)}`);
  }

  updateCharts() {
    // Update chart data
    if (this.step % 10 === 0) {
      const avgBalance = _.meanBy(this.agents, 'balance');
      const avgPrice = _.meanBy(this.resources, 'price');
      
      this.history.push({ 
        step: this.step, 
        balance: avgBalance,
        price: avgPrice
      });
      
      // Update chart scales and redraw lines
      // ... (d3 chart update implementation)
    }
  }
}

const simulation = new Simulation();