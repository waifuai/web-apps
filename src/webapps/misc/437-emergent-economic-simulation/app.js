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
    
    // Add randomization to agent behavior
    this.adaptability = 0.05 + Math.random() * 0.1; // How quickly preferences change
    this.riskTolerance = 0.3 + Math.random() * 0.7; // Affects spending behavior
  }

  requestResources(resources) {
    if (!this.active) return;
    
    const totalPreference = this.preferences.reduce((a, b) => a + b, 0);
    // Guard against zero totalPreference
    if (totalPreference <= 0) return resources.map(() => 0);
    
    // More dynamic resource requests based on affordability and preferences
    return this.preferences.map((pref, i) => {
      // Guard against zero or negative price
      const price = Math.max(0.01, resources[i].price);
      
      // More sophisticated affordability calculation
      const affordabilityRatio = this.balance / (price * this.preferences.length);
      const baseRequest = pref / totalPreference * this.demandMultiplier;
      
      // Agents with more risk tolerance might request more than they can safely afford
      const maxRequest = affordabilityRatio * this.riskTolerance;
      
      return Math.min(baseRequest, maxRequest);
    });
  }
  
  // Add method to evolve preferences over time
  evolvePreferences() {
    if (!this.active) return;
    
    // Slightly adjust preferences over time
    this.preferences = this.preferences.map(p => {
      return Math.max(0.1, p + (Math.random() - 0.5) * this.adaptability);
    });
    
    // Occasionally develop strong preference for one resource
    if (Math.random() < 0.05) {
      const resourceIndex = Math.floor(Math.random() * this.preferences.length);
      this.preferences[resourceIndex] *= 1.5;
    }
    
    // Gradually increase demand multiplier over time for economic growth
    this.demandMultiplier *= 1 + Math.random() * 0.01;
  }
}

class Resource {
  constructor(id, params) {
    this.id = id;
    this.capacity = params.resourceCapacity;
    this.load = 0;
    this.price = params.baseResourceCost;
    this.regenRate = params.resourceRegenRate;
    
    // Add price volatility factor
    this.volatility = 0.05 + Math.random() * 0.1;
  }

  updatePrice(elasticity) {
    // Guard against capacity being zero
    if (this.capacity <= 0) {
      this.capacity = 0.01; // Set a minimum capacity
    }
    
    const utilization = this.load / this.capacity;
    
    // More responsive price update formula with randomness
    const marketShock = 1 + (Math.random() - 0.5) * this.volatility;
    this.price = this.price * (1 + elasticity * (utilization - 0.5) * marketShock);
    
    // Ensure price stays positive and doesn't grow too large
    this.price = Math.max(0.1, Math.min(1000, this.price));
    
    // Check for NaN and fix if needed
    if (isNaN(this.price)) {
      this.price = 1.0; // Reset to a reasonable value
      console.log("Price reset for resource", this.id);
    }
  }

  regenerate(averageBalance, params) {
    // More dynamic regeneration based on economy health
    const marketCondition = Math.max(0, averageBalance / params.initialCtxBalance);
    const regenerationAmount = this.regenRate * marketCondition * params.dynamicRegenMultiplier * this.capacity;
    
    this.capacity += regenerationAmount;
    this.capacity = Math.max(0.1, Math.min(params.maxResourceCapacity, this.capacity));
    
    // Ensure load stays within capacity
    this.load = Math.min(this.load * (1 - params.deallocationRate), this.capacity);
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
      imbalanceStrength: 2,
      simulationSpeed: 20,
      // New parameters for more dynamism
      wealthRedistribution: 0.7, // Portion of tax redistributed (rest goes to resource development)
      economicCycles: true, // Enable economic boom/bust cycles
      cycleStrength: 0.2 // How strong economic cycles affect the simulation
    };
    
    this.agents = [];
    this.resources = [];
    this.running = false;
    this.currentStep = 0;
    this.history = [];
    this.stats = {
      avgBalance: 0,
      bankruptAgents: 0,
      totalWealth: 0,
      wealthGini: 0,
      avgPrice: 0
    };
    
    // Add economic cycle tracking
    this.economicCycle = 0;
    this.cyclePhase = 0;
    
    this.initParamsUI();
    this.initVisualization();
    this.initCharts();
    this.reset();
  }

  initVisualization() {
    this.svg = d3.select('#economyViz');
    const width = this.svg.node().getBoundingClientRect().width;
    const height = this.svg.node().getBoundingClientRect().height;
    
    this.centerX = width / 2;
    this.centerY = height / 2;
    
    // Add a background grid
    const grid = this.svg.append('g').attr('class', 'grid');
    for (let x = 0; x < width; x += 50) {
      grid.append('line')
        .attr('x1', x).attr('y1', 0)
        .attr('x2', x).attr('y2', height)
        .attr('stroke', 'rgba(255,255,255,0.05)');
    }
    for (let y = 0; y < height; y += 50) {
      grid.append('line')
        .attr('x1', 0).attr('y1', y)
        .attr('x2', width).attr('y2', y)
        .attr('stroke', 'rgba(255,255,255,0.05)');
    }
    
    // Legend
    const legend = this.svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(20, 20)`);
    
    legend.append('circle').attr('r', 4).attr('cx', 5).attr('cy', 5).attr('fill', 'var(--accent)');
    legend.append('text').attr('x', 15).attr('y', 10).text('Active Agent').attr('fill', 'var(--text)').attr('font-size', '12px');
    
    legend.append('circle').attr('r', 4).attr('cx', 5).attr('cy', 25).attr('fill', 'var(--danger)');
    legend.append('text').attr('x', 15).attr('y', 30).text('Bankrupt Agent').attr('fill', 'var(--text)').attr('font-size', '12px');
    
    legend.append('circle').attr('r', 10).attr('cx', 5).attr('cy', 50).attr('fill', 'none').attr('stroke', 'var(--highlight)');
    legend.append('text').attr('x', 20).attr('y', 55).text('Resource').attr('fill', 'var(--text)').attr('font-size', '12px');
    
    // Create layers
    this.agentG = this.svg.append('g').attr('class', 'agents');
    this.resourceG = this.svg.append('g').attr('class', 'resources');
    this.linksG = this.svg.append('g').attr('class', 'links');
    
    // Position resources in a circle
    const radius = Math.min(width, height) * 0.35;
    this.resourcePositions = Array.from({length: this.params.numResources}, (_, i) => {
      const angle = (i * 2 * Math.PI) / this.params.numResources;
      return {
        x: this.centerX + radius * Math.cos(angle),
        y: this.centerY + radius * Math.sin(angle)
      };
    });
  }

  initCharts() {
    // Create charts with d3
    this.charts = {
      balance: this.createChart('#balanceChart', 'Average Balance', 'steelblue'),
      price: this.createChart('#priceChart', 'Resource Prices', 'orange'),
      gini: this.createChart('#giniChart', 'Wealth Inequality (Gini)', 'crimson')
    };

    // Update scales
    Object.values(this.charts).forEach(chart => {
      chart.x.range([40, chart.svg.node().getBoundingClientRect().width - 20]);
      chart.y.range([chart.svg.node().getBoundingClientRect().height - 30, 20]);
      
      // Add axes
      chart.svg.append('g')
        .attr('transform', `translate(0,${chart.svg.node().getBoundingClientRect().height - 30})`)
        .call(d3.axisBottom(chart.x).ticks(5));
      
      chart.svg.append('g')
        .attr('transform', 'translate(40,0)')
        .call(d3.axisLeft(chart.y).ticks(5));
    });
  }

  createChart(selector, title, color) {
    const div = d3.select(selector);
    div.html('');
    
    const svg = div.append('svg')
      .attr('width', '100%')
      .attr('height', '100%');
    
    // Add title
    svg.append('text')
      .attr('x', '50%')
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--text)')
      .text(title);
    
    return {
      svg,
      data: [],
      x: d3.scaleLinear().domain([0, 1000]),
      y: d3.scaleLinear().domain([0, 100]),
      color,
      line: d3.line()
        .x(d => d.x)
        .y(d => d.y)
        .curve(d3.curveMonotoneX)
    };
  }

  initParamsUI() {
    const container = d3.select('#params');
    container.html(''); // Clear existing params
    
    // Group parameters into categories
    const groups = {
      'Agent Parameters': ['numAgents', 'initialCtxBalance', 'agentIncome', 'agentExpenseRate', 'bankruptcyThreshold', 'initialImbalance', 'imbalanceStrength'],
      'Resource Parameters': ['numResources', 'resourceCapacity', 'baseResourceCost', 'resourceRegenRate', 'maxResourceCapacity', 'deallocationRate'],
      'Economic Parameters': ['priceElasticity', 'dynamicIncomeMultiplier', 'taxRate', 'wealthRedistribution', 'resourceCapacityMultiplier', 'economicCycles', 'cycleStrength'],
      'Simulation Parameters': ['simulationSpeed']
    };
    
    // Create collapsible sections for each group
    Object.entries(groups).forEach(([groupName, paramKeys]) => {
      const group = container.append('div')
        .attr('class', 'param-group');
      
      group.append('h3')
        .text(groupName)
        .attr('class', 'param-group-title')
        .on('click', function() {
          const content = d3.select(this.nextElementSibling);
          const isHidden = content.style('display') === 'none';
          content.style('display', isHidden ? 'grid' : 'none');
        });
      
      const content = group.append('div')
        .attr('class', 'param-group-content')
        .style('display', groupName === 'Simulation Parameters' ? 'grid' : 'none');
      
      paramKeys.forEach(key => {
        const value = this.params[key];
        const item = content.append('div').attr('class', 'param-item');
        
        const label = item.append('label').text(_.startCase(key));
        
        if (typeof value === 'boolean') {
          item.append('input')
            .attr('type', 'checkbox')
            .attr('id', `param-${key}`)
            .property('checked', value)
            .on('change', (e) => {
              this.params[key] = e.target.checked;
            });
        } else {
          item.append('input')
            .attr('type', 'number')
            .attr('id', `param-${key}`)
            .attr('value', value)
            .attr('step', key.includes('Rate') ? '0.01' : '1')
            .on('input', (e) => {
              this.params[key] = parseFloat(e.target.value);
            });
        }
        
        // Add tooltip explaining parameter
        const tooltips = {
          numAgents: 'Number of economic actors in the simulation',
          initialCtxBalance: 'Starting wealth for each agent',
          numResources: 'Number of different resource types',
          resourceCapacity: 'Initial capacity for each resource',
          baseResourceCost: 'Starting price for resources',
          priceElasticity: 'How quickly prices respond to demand',
          deallocationRate: 'Rate at which resources are freed up',
          agentIncome: 'Base income per step for each agent',
          resourceRegenRate: 'Rate at which resources regenerate',
          maxResourceCapacity: 'Maximum capacity for resources',
          agentExpenseRate: 'Rate at which agents spend money',
          bankruptcyThreshold: 'Balance below which agents go bankrupt',
          dynamicIncomeMultiplier: 'How resource prices affect income',
          taxRate: 'Percentage of wealth collected as tax',
          resourceCapacityMultiplier: 'How economy affects resource growth',
          initialImbalance: 'Start with unequal wealth distribution',
          imbalanceStrength: 'Degree of initial wealth inequality',
          simulationSpeed: 'Speed of the simulation (steps per second)',
          wealthRedistribution: 'Portion of tax redistributed to agents (rest goes to resource development)',
          economicCycles: 'Enable economic boom/bust cycles',
          cycleStrength: 'How strong economic cycles affect the simulation'
        };
        
        if (tooltips[key]) {
          label.append('span')
            .attr('class', 'tooltip')
            .text('?')
            .attr('title', tooltips[key]);
        }
      });
    });
  }

  start() {
    if (!this.running) {
      this.running = true;
      this.interval = setInterval(() => this.runSimulationStep(), 1000 / this.params.simulationSpeed);
    }
  }

  stop() {
    this.running = false;
    clearInterval(this.interval);
  }

  reset() {
    this.stop();
    this.currentStep = 0;
    this.history = [];
    
    // Reset charts
    Object.values(this.charts).forEach(chart => {
      chart.data = [];
      chart.x.domain([0, 1000]);
      chart.y.domain([0, 100]);
    });
    
    // Create agents and resources according to params
    this.agents = Array.from({length: this.params.numAgents}, (_, i) => 
      new Agent(i, this.params));
      
    this.resources = Array.from({length: this.params.numResources}, (_, i) => 
      new Resource(i, this.params));
      
    if (this.params.initialImbalance) {
      this.agents.forEach((agent, i) => {
        agent.balance *= Math.exp(-this.params.imbalanceStrength * i / this.params.numAgents);
      });
    }
    
    this.updateStats();
    this.updateVisualization();
    this.updateStatsDisplay();
  }

  simulateStep() {
    // Calculate economic cycle effect if enabled
    let cycleEffect = 1;
    if (this.params.economicCycles) {
      this.cyclePhase += 0.01;
      this.economicCycle = Math.sin(this.cyclePhase);
      cycleEffect = 1 + this.economicCycle * this.params.cycleStrength;
    }
    
    // Update resource prices with cycle influence
    this.resources.forEach(r => r.updatePrice(this.params.priceElasticity * cycleEffect));
    
    // Evolve agent preferences
    this.agents.forEach(agent => agent.evolvePreferences());
    
    // Get agent resource requests
    const requests = this.agents.map(agent => 
      agent.requestResources(this.resources));
    
    // Calculate resource allocations
    for (let i = 0; i < this.resources.length; i++) {
      const resource = this.resources[i];
      let totalRequested = 0;
      
      // Sum up the valid requests
      requests.forEach(req => {
        if (req && req[i] !== undefined) {
          totalRequested += req[i];
        }
      });
      
      const availableCapacity = Math.max(0, resource.capacity - resource.load);
      
      if (totalRequested > availableCapacity && totalRequested > 0) {
        // Allocation is proportional to request when oversubscribed
        const ratio = availableCapacity / totalRequested;
        requests.forEach(req => {
          if (req && req[i] !== undefined) {
            req[i] *= ratio;
          }
        });
      }
      
      // Update resource load
      let newLoad = resource.load;
      requests.forEach(req => {
        if (req && req[i] !== undefined) {
          newLoad += req[i];
        }
      });
      
      // Ensure load doesn't exceed capacity
      resource.load = Math.min(newLoad, resource.capacity);
    }
    
    // Agents consume resources and pay
    this.agents.forEach((agent, agentIdx) => {
      if (!agent.active) return;
      
      let expense = 0;
      const agentRequests = requests[agentIdx];
      
      if (agentRequests) {
        agentRequests.forEach((amount, resourceIdx) => {
          if (amount > 0 && this.resources[resourceIdx]) {
            expense += amount * Math.max(0.01, this.resources[resourceIdx].price);
          }
        });
      }
      
      agent.balance -= expense;
      agent.expenses += expense;
    });
    
    // Resource deallocation
    this.resources.forEach(resource => {
      resource.load = Math.max(0, resource.load * (1 - this.params.deallocationRate));
    });
    
    // Calculate average agent balance for active agents
    const activeAgents = this.agents.filter(a => a.active);
    const avgBalance = activeAgents.length > 0 ? 
                      _.meanBy(activeAgents, 'balance') : 0;
    
    // Resource regeneration and capacity adjustment
    this.resources.forEach(resource => {
      resource.regenerate(avgBalance, this.params);
    });
    
    // Agents receive income affected by economic cycles
    let totalTax = 0;
    this.agents.forEach(agent => {
      if (!agent.active) return;
      
      // Base income plus dynamic component, affected by cycle
      const avgPrice = _.meanBy(this.resources, 'price');
      const economicFactor = this.params.economicCycles ? cycleEffect : 1;
      
      agent.income = this.params.agentIncome * 
        (1 + Math.max(0, avgPrice) * this.params.dynamicIncomeMultiplier) * 
        economicFactor;
      
      agent.balance += agent.income;
      
      // Fixed expenses with slight randomization
      const expenseRate = this.params.agentExpenseRate * (0.9 + Math.random() * 0.2);
      const fixedExpense = agent.balance * expenseRate;
      agent.balance -= fixedExpense;
      agent.expenses += fixedExpense;
      
      // Taxation
      const tax = Math.max(0, agent.balance * this.params.taxRate);
      totalTax += tax;
      agent.balance -= tax;
    });
    
    // Redistribute tax with new parameter
    if (activeAgents.length > 0) {
      const totalRedistribution = totalTax * this.params.wealthRedistribution;
      const redistribution = totalRedistribution / activeAgents.length;
      
      activeAgents.forEach(agent => {
        agent.balance += redistribution;
      });
      
      // Use remaining tax for resource development
      const resourceDevelopment = totalTax * (1 - this.params.wealthRedistribution);
      if (this.resources.length > 0) {
        const perResourceDevelopment = resourceDevelopment / this.resources.length;
        this.resources.forEach(resource => {
          resource.capacity += perResourceDevelopment * this.params.resourceCapacityMultiplier;
        });
      }
    }
    
    // Introduce occasional market shocks
    if (Math.random() < 0.01) {  // 1% chance each step
      const shockMagnitude = 0.3 + Math.random() * 0.7; // 30-100% effect
      const shockType = Math.random();
      
      if (shockType < 0.33) {
        // Supply shock - reduce resource capacity
        this.resources.forEach(resource => {
          resource.capacity *= (1 - shockMagnitude * 0.3);
        });
      } else if (shockType < 0.66) {
        // Demand shock - change agent preferences
        this.agents.forEach(agent => {
          if (agent.active) {
            const resourceIdx = Math.floor(Math.random() * agent.preferences.length);
            agent.preferences[resourceIdx] *= (1 + shockMagnitude);
          }
        });
      } else {
        // Price shock - directly affect prices
        this.resources.forEach(resource => {
          resource.price *= (1 + (Math.random() < 0.5 ? -1 : 1) * shockMagnitude);
        });
      }
    }
    
    // Check for bankruptcies
    this.agents.forEach(agent => {
      if (agent.active && agent.balance < this.params.bankruptcyThreshold) {
        agent.active = false;
      }
    });
    
    // Revival mechanism - occasionally revive a bankrupt agent
    if (Math.random() < 0.02 && this.stats.bankruptAgents > 0) { // 2% chance each step
      const bankruptAgents = this.agents.filter(a => !a.active);
      if (bankruptAgents.length > 0) {
        const agentToRevive = bankruptAgents[Math.floor(Math.random() * bankruptAgents.length)];
        agentToRevive.active = true;
        agentToRevive.balance = this.params.initialCtxBalance * 0.5;
        agentToRevive.preferences = Array.from({length: this.params.numResources}, () => Math.random());
        agentToRevive.demandMultiplier = 1;
      }
    }
    
    this.updateStats();
  }

  calculateGini() {
    const balances = this.agents.filter(a => a.active).map(a => a.balance).sort((a, b) => a - b);
    if (balances.length <= 1) return 0;
    
    let sumOfDifferences = 0;
    for (let i = 0; i < balances.length; i++) {
      for (let j = 0; j < balances.length; j++) {
        sumOfDifferences += Math.abs(balances[i] - balances[j]);
      }
    }
    
    const n = balances.length;
    const mean = _.mean(balances) || 1; // Prevent division by zero
    return sumOfDifferences / (2 * n * n * mean);
  }

  updateStats() {
    const activeAgents = this.agents.filter(a => a.active);
    this.stats.avgBalance = activeAgents.length > 0 ? _.meanBy(activeAgents, 'balance') : 0;
    this.stats.bankruptAgents = this.agents.length - activeAgents.length;
    this.stats.totalWealth = _.sumBy(activeAgents, 'balance');
    this.stats.wealthGini = this.calculateGini();
    this.stats.avgPrice = _.meanBy(this.resources, 'price');
  }

  updateVisualization() {
    // Update agent positions and status
    const simulation = this;
    const agents = this.agentG.selectAll('circle').data(this.agents, d => d.id);
    
    agents.enter().append('circle')
      .attr('cx', d => this.centerX + (Math.random() - 0.5) * 100)
      .attr('cy', d => this.centerY + (Math.random() - 0.5) * 100)
      .attr('r', 4)
      .attr('fill', d => d.active ? `var(--accent)` : `var(--danger)`)
      .merge(agents)
      .transition()
      .duration(200)
      .attr('cx', d => {
        if (!d.active) return this.centerX + (Math.random() - 0.5) * 300; // Random position for bankrupt agents
        const preferences = d.preferences.map((p, i) => p * simulation.resourcePositions[i].x);
        return _.sum(preferences) / _.sum(d.preferences);
      })
      .attr('cy', d => {
        if (!d.active) return this.centerY + (Math.random() - 0.5) * 300;
        const preferences = d.preferences.map((p, i) => p * simulation.resourcePositions[i].y);
        return _.sum(preferences) / _.sum(d.preferences);
      })
      .attr('class', d => d.active ? '' : 'bankrupt')
      .attr('fill', d => d.active ? `var(--accent)` : `var(--danger)`);
    
    // Add tooltip to agents
    this.agentG.selectAll('circle')
      .on('mouseover', function(e, d) {
        d3.select(this).attr('r', 8);
        simulation.showTooltip(e, `Agent ${d.id}<br>Balance: ${d.balance.toFixed(1)}<br>Income: ${d.income.toFixed(1)}<br>Status: ${d.active ? 'Active' : 'Bankrupt'}`);
      })
      .on('mouseout', function() {
        d3.select(this).attr('r', 4);
        simulation.hideTooltip();
      });

    // Update resource indicators
    const resources = this.resourceG.selectAll('circle').data(this.resources);
    
    resources.enter().append('circle')
      .attr('cx', (d, i) => this.resourcePositions[i].x)
      .attr('cy', (d, i) => this.resourcePositions[i].y)
      .attr('fill', 'none')
      .attr('stroke', `var(--highlight)`)
      .attr('stroke-width', 2)
      .merge(resources)
      .transition()
      .duration(200)
      .attr('r', d => Math.min(50, Math.sqrt(d.capacity) / 2));
    
    // Add labels to resources
    const resourceLabels = this.resourceG.selectAll('text').data(this.resources);
    
    resourceLabels.enter().append('text')
      .attr('x', (d, i) => this.resourcePositions[i].x)
      .attr('y', (d, i) => this.resourcePositions[i].y + 5)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--text)')
      .merge(resourceLabels)
      .text(d => `R${d.id+1}: $${d.price.toFixed(1)}`);
    
    // Add tooltip to resources
    this.resourceG.selectAll('circle')
      .on('mouseover', function(e, d) {
        d3.select(this).attr('stroke-width', 4);
        simulation.showTooltip(e, `Resource ${d.id+1}<br>Price: $${d.price.toFixed(2)}<br>Capacity: ${d.capacity.toFixed(0)}<br>Load: ${d.load.toFixed(0)} (${((d.load/d.capacity)*100).toFixed(1)}%)`);
      })
      .on('mouseout', function() {
        d3.select(this).attr('stroke-width', 2);
        simulation.hideTooltip();
      });
  }

  showTooltip(event, html) {
    const tooltip = d3.select('#tooltip');
    tooltip.html(html)
      .style('left', (event.pageX + 10) + 'px')
      .style('top', (event.pageY + 10) + 'px')
      .style('display', 'block');
  }

  hideTooltip() {
    d3.select('#tooltip').style('display', 'none');
  }

  updateStatsDisplay() {
    const statsContainer = d3.select('#stats');
    statsContainer.html('');
    
    const statItems = [
      { key: 'step', label: 'Step', value: this.currentStep, format: d => d },
      { key: 'avgBalance', label: 'Avg Balance', value: this.stats.avgBalance, format: d => d.toFixed(1) },
      { key: 'bankruptAgents', label: 'Bankrupt', value: this.stats.bankruptAgents, format: d => d },
      { key: 'totalWealth', label: 'Total Wealth', value: this.stats.totalWealth, format: d => d.toFixed(0) },
      { key: 'wealthGini', label: 'Gini Index', value: this.stats.wealthGini, format: d => d.toFixed(2) },
      { key: 'avgPrice', label: 'Avg Price', value: this.stats.avgPrice, format: d => '$' + d.toFixed(2) }
    ];
    
    statItems.forEach(stat => {
      statsContainer.append('div')
        .attr('class', 'stat-item')
        .html(`
          <div class="stat-label">${stat.label}</div>
          <div class="stat-value">${stat.format(stat.value)}</div>
        `);
    });
  }

  updateCharts() {
    // Add data points to charts
    const xVal = this.currentStep;
    
    // Update balance chart
    this.charts.balance.data.push({ 
      x: this.charts.balance.x(xVal), 
      y: this.charts.balance.y(this.stats.avgBalance) 
    });
    
    // Update price chart
    this.charts.price.data.push({ 
      x: this.charts.price.x(xVal), 
      y: this.charts.price.y(this.stats.avgPrice) 
    });
    
    // Update gini chart
    this.charts.gini.data.push({ 
      x: this.charts.gini.x(xVal), 
      y: this.charts.gini.y(this.stats.wealthGini * 100) 
    });
    
    // Adjust scales if needed
    if (xVal > this.charts.balance.x.domain()[1]) {
      Object.values(this.charts).forEach(chart => {
        chart.x.domain([0, xVal * 1.5]);
      });
    }
    
    if (this.stats.avgBalance > this.charts.balance.y.domain()[1]) {
      this.charts.balance.y.domain([0, this.stats.avgBalance * 1.5]);
    }
    
    if (this.stats.avgPrice > this.charts.price.y.domain()[1]) {
      this.charts.price.y.domain([0, this.stats.avgPrice * 1.5]);
    }
    
    // Draw lines
    Object.entries(this.charts).forEach(([key, chart]) => {
      // Remove old line
      chart.svg.selectAll('.line').remove();
      
      // Add new line
      if (chart.data.length > 1) {
        chart.svg.append('path')
          .datum(chart.data)
          .attr('class', 'line')
          .attr('fill', 'none')
          .attr('stroke', chart.color)
          .attr('stroke-width', 2)
          .attr('d', chart.line);
      }
    });
  }

  runSimulationStep() {
    this.simulateStep();
    this.updateVisualization();
    this.updateCharts();
    this.updateStatsDisplay();
    this.currentStep++;
  }
}

const simulation = new Simulation();