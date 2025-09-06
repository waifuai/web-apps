// simulation.js
// Main simulation code for crypto airdrop strategies with optimization
// The simulation models a token economy with various airdrop approaches.
// It now includes an optimization routine that automatically runs multiple simulations
// for different strategies and parameter choices. The objective is to maximize the final token price.

const SIMULATION_DAYS = 50;
const USER_COUNT = 1000;
const BURN_RATE = 0.01; // 1% of trading volume burned each day

// Default configuration parameters for each airdrop strategy.
const defaultParams = {
  lottery: { chance: 0.1, award: 100 },
  uniform: { award: 50 },
  tiered: { multiplier: 1 }, // multiplier applied to base values: active: 100, longTerm: 75, speculator: 50, airdropHunter: 30
  vesting: { locked: 50, unlockRate: 0.1 }
};

document.getElementById('startSimulation').addEventListener('click', () => {
  const strategy = document.getElementById('strategySelect').value;
  // Use default parameters when running a single simulation.
  runSimulation(strategy, defaultParams[strategy]);
});

document.getElementById('runOptimization').addEventListener('click', () => {
  runOptimization();
});

// Runs the simulation in the UI context: updates DOM elements and renders chart.
function runSimulation(strategy, params = {}) {
  // Reset simulation stats display
  document.getElementById('simulationStats').innerHTML = "";
  clearChart();

  // Create a fresh pool of users
  const users = generateUsers(USER_COUNT);

  // Initial token price
  let tokenPrice = 1.0;
  let priceHistory = [tokenPrice];

  // Apply airdrop based on selected strategy and its parameters
  applyAirdrop(strategy, users, params);

  // Compute initial total supply from airdrop
  let totalSupply = users.reduce((sum, user) => sum + user.tokens, 0);

  // Simulation loop over days
  for (let day = 1; day <= SIMULATION_DAYS; day++) {
    let netDemand = 0;
    let dayTradingVolume = 0;

    users.forEach(user => {
      // Simulate trade for each user based on behavior
      const trade = simulateTrade(user, tokenPrice);
      netDemand += trade.net;
      dayTradingVolume += Math.abs(trade.volume);

      // For vesting strategy: unlock a fraction daily if applicable
      if (user.vestingLockedTokens !== undefined && user.vestingLockedTokens > 0) {
        const unlockAmount = user.vestingLockedTokens * (params.unlockRate !== undefined ? params.unlockRate : defaultParams.vesting.unlockRate);
        user.tokens += unlockAmount;
        user.vestingLockedTokens -= unlockAmount;
      }
    });

    // Update token price; the price factor scales the net demand impact
    const priceFactor = 0.0001;
    tokenPrice *= (1 + netDemand * priceFactor);

    // Simulate token burn
    const burnedTokens = dayTradingVolume * BURN_RATE;
    totalSupply -= burnedTokens;

    // Record price history
    priceHistory.push(tokenPrice);
  }

  // Recalculate total supply from users
  totalSupply = users.reduce((sum, user) => sum + user.tokens, 0);

  // Display simulation statistics
  displayStats(tokenPrice, totalSupply);

  // Render the price history chart using D3
  drawChart(priceHistory);
}

// A simulation function that runs the simulation and returns the final token price.
// This is used by the optimization routine.
function simulateAirdrop(strategy, params = {}) {
  const users = generateUsers(USER_COUNT);
  let tokenPrice = 1.0;

  // Apply airdrop using the provided parameters
  applyAirdrop(strategy, users, params);

  for (let day = 1; day <= SIMULATION_DAYS; day++) {
    let netDemand = 0;
    let dayTradingVolume = 0;

    users.forEach(user => {
      const trade = simulateTrade(user, tokenPrice);
      netDemand += trade.net;
      dayTradingVolume += Math.abs(trade.volume);

      if (user.vestingLockedTokens !== undefined && user.vestingLockedTokens > 0) {
        const unlockAmount = user.vestingLockedTokens * (params.unlockRate !== undefined ? params.unlockRate : defaultParams.vesting.unlockRate);
        user.tokens += unlockAmount;
        user.vestingLockedTokens -= unlockAmount;
      }
    });

    const priceFactor = 0.0001;
    tokenPrice *= (1 + netDemand * priceFactor);
    const burnedTokens = dayTradingVolume * BURN_RATE;
    // Total supply adjustments are not needed for the objective; focus on final token price.
  }
  return tokenPrice;
}

// Optimization function: automatically runs multiple simulations with different parameters for each strategy,
// then finds and displays the optimal parameters based on the highest average final token price.
// This version shows the progress of the optimization process visually.
async function runOptimization() {
  const numTrials = 5;
  const strategies = ['lottery', 'uniform', 'tiered', 'vesting'];
  let overallBest = { strategy: null, params: null, avgPrice: -Infinity };
  let optimizationSummary = '';
  const logContainer = document.getElementById('optimizationResultsLog');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  
  // Pre-calculate total iterations for visual progress
  // Lottery: 3 (chance) * 3 (award) = 9; Uniform: 3; Tiered: 3; Vesting: 3 (locked) * 3 (unlockRate) = 9; Total = 24
  const totalIterations = 24;
  let iterationsCompleted = 0;
  
  // Clear previous log and progress
  logContainer.innerHTML = '';
  updateProgress(0);

  // Helper function to update the progress bar visually.
  function updateProgress(iterations) {
    const percent = Math.floor((iterations / totalIterations) * 100);
    progressBar.style.width = percent + '%';
    progressText.textContent = `Optimization Progress: ${percent}%`;
  }

  for (const strategy of strategies) {
    let best = { params: null, avgPrice: -Infinity };

    if (strategy === 'lottery') {
      const chanceOptions = [0.05, 0.1, 0.15];
      const awardOptions = [50, 100, 150];
      for (const chance of chanceOptions) {
        for (const award of awardOptions) {
          let totalPrice = 0;
          for (let i = 0; i < numTrials; i++) {
            totalPrice += simulateAirdrop(strategy, { chance, award });
            // Yield control to update UI
            await new Promise(r => setTimeout(r, 10));
          }
          const avgPrice = totalPrice / numTrials;
          logContainer.innerHTML += `<p>[Lottery] Tested params: { chance: ${chance}, award: ${award} } => Avg Price: ${avgPrice.toFixed(4)}</p>`;
          if (avgPrice > best.avgPrice) {
            best = { params: { chance, award }, avgPrice };
          }
          iterationsCompleted++;
          updateProgress(iterationsCompleted);
        }
      }
    }
    else if (strategy === 'uniform') {
      const awardOptions = [25, 50, 75];
      for (const award of awardOptions) {
        let totalPrice = 0;
        for (let i = 0; i < numTrials; i++) {
          totalPrice += simulateAirdrop(strategy, { award });
          await new Promise(r => setTimeout(r, 10));
        }
        const avgPrice = totalPrice / numTrials;
        logContainer.innerHTML += `<p>[Uniform] Tested params: { award: ${award} } => Avg Price: ${avgPrice.toFixed(4)}</p>`;
        if (avgPrice > best.avgPrice) {
          best = { params: { award }, avgPrice };
        }
        iterationsCompleted++;
        updateProgress(iterationsCompleted);
      }
    }
    else if (strategy === 'tiered') {
      const multOptions = [0.75, 1, 1.25];
      for (const multiplier of multOptions) {
        let totalPrice = 0;
        for (let i = 0; i < numTrials; i++) {
          totalPrice += simulateAirdrop(strategy, { multiplier });
          await new Promise(r => setTimeout(r, 10));
        }
        const avgPrice = totalPrice / numTrials;
        logContainer.innerHTML += `<p>[Tiered] Tested params: { multiplier: ${multiplier} } => Avg Price: ${avgPrice.toFixed(4)}</p>`;
        if (avgPrice > best.avgPrice) {
          best = { params: { multiplier }, avgPrice };
        }
        iterationsCompleted++;
        updateProgress(iterationsCompleted);
      }
    }
    else if (strategy === 'vesting') {
      const lockedOptions = [25, 50, 75];
      const unlockRateOptions = [0.05, 0.1, 0.15];
      for (const locked of lockedOptions) {
        for (const unlockRate of unlockRateOptions) {
          let totalPrice = 0;
          for (let i = 0; i < numTrials; i++) {
            totalPrice += simulateAirdrop(strategy, { locked, unlockRate });
            await new Promise(r => setTimeout(r, 10));
          }
          const avgPrice = totalPrice / numTrials;
          logContainer.innerHTML += `<p>[Vesting] Tested params: { locked: ${locked}, unlockRate: ${unlockRate} } => Avg Price: ${avgPrice.toFixed(4)}</p>`;
          if (avgPrice > best.avgPrice) {
            best = { params: { locked, unlockRate }, avgPrice };
          }
          iterationsCompleted++;
          updateProgress(iterationsCompleted);
        }
      }
    }

    optimizationSummary += `<p><strong>${strategy.charAt(0).toUpperCase() + strategy.slice(1)} Strategy:</strong> Best params: ${JSON.stringify(best.params)} with average final token price of ${best.avgPrice.toFixed(4)}</p>`;
    if (best.avgPrice > overallBest.avgPrice) {
      overallBest = { strategy, params: best.params, avgPrice: best.avgPrice };
    }
  }

  optimizationSummary += `<p><strong>Overall Optimal Strategy:</strong> ${overallBest.strategy.charAt(0).toUpperCase() + overallBest.strategy.slice(1)} with params: ${JSON.stringify(overallBest.params)} producing an average final token price of ${overallBest.avgPrice.toFixed(4)}</p>`;
  
  logContainer.innerHTML += optimizationSummary;
  // Ensure progress bar displays 100% at the end.
  updateProgress(totalIterations);
}

// Generates an array of user objects with a random type.
// Types and their proportions:
// - Speculator: 30%
// - Long Term: 30%
// - Airdrop Hunter: 20%
// - Active: 20%
function generateUsers(n) {
  const users = [];
  const types = ['speculator', 'long-term', 'airdrop-hunter', 'active'];
  const weights = [0.3, 0.3, 0.2, 0.2];
  for (let i = 0; i < n; i++) {
    const type = weightedRandom(types, weights);
    users.push({
      id: i,
      type: type,
      tokens: 0,
      // For vesting strategy; tokens will be locked initially.
      vestingLockedTokens: undefined
    });
  }
  return users;
}

// Returns one element chosen from arr based on provided weights.
function weightedRandom(arr, weights) {
  const sum = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * sum;
  for (let i = 0; i < arr.length; i++) {
    if (r < weights[i]) return arr[i];
    r -= weights[i];
  }
  return arr[0];
}

// Apply airdrop to all users based on the selected strategy and its parameters.
function applyAirdrop(strategy, users, params = {}) {
  if (strategy === 'lottery') {
    const chance = params.chance !== undefined ? params.chance : defaultParams.lottery.chance;
    const award = params.award !== undefined ? params.award : defaultParams.lottery.award;
    users.forEach(user => {
      if (Math.random() < chance) {
        user.tokens += award;
      }
    });
  }
  else if (strategy === 'uniform') {
    const award = params.award !== undefined ? params.award : defaultParams.uniform.award;
    users.forEach(user => {
      user.tokens += award;
    });
  }
  else if (strategy === 'tiered') {
    // Option to modify the base airdrop by a multiplier.
    const multiplier = params.multiplier !== undefined ? params.multiplier : defaultParams.tiered.multiplier;
    users.forEach(user => {
      if (user.type === 'active') {
        user.tokens += 100 * multiplier;
      } else if (user.type === 'long-term') {
        user.tokens += 75 * multiplier;
      } else if (user.type === 'speculator') {
        user.tokens += 50 * multiplier;
      } else if (user.type === 'airdrop-hunter') {
        user.tokens += 30 * multiplier;
      }
    });
  }
  else if (strategy === 'vesting') {
    const lockedTokens = params.locked !== undefined ? params.locked : defaultParams.vesting.locked;
    users.forEach(user => {
      user.vestingLockedTokens = lockedTokens;
      // Initially, tokens available remains 0; unlock handled day by day.
    });
  }
  else {
    // Default to uniform if unknown strategy.
    users.forEach(user => {
      user.tokens += 50;
    });
  }
}

// Simulate a trade for a single user based on their type. Returns an object { net, volume }
function simulateTrade(user, tokenPrice) {
  let net = 0;
  let volume = 0;
  const tradeAmount = Math.floor(Math.random() * 10) + 1;

  if (user.type === 'speculator') {
    if (Math.random() < 0.6) {
      net += tradeAmount;
      volume += tradeAmount;
    } else {
      if (user.tokens >= tradeAmount) {
        user.tokens -= tradeAmount;
        net -= tradeAmount;
        volume += tradeAmount;
      }
    }
  }
  else if (user.type === 'long-term') {
    if (Math.random() < 0.2) {
      if (Math.random() < 0.5 && user.tokens >= tradeAmount) {
        user.tokens -= tradeAmount;
        net -= tradeAmount;
        volume += tradeAmount;
      } else {
        net += tradeAmount;
        volume += tradeAmount;
      }
    }
  }
  else if (user.type === 'airdrop-hunter') {
    if (user.tokens >= tradeAmount) {
      user.tokens -= tradeAmount;
      net -= tradeAmount;
      volume += tradeAmount;
    }
  }
  else if (user.type === 'active') {
    if (Math.random() < 0.5) {
      net += tradeAmount;
      volume += tradeAmount;
    } else {
      if (user.tokens >= tradeAmount) {
        user.tokens -= tradeAmount;
        net -= tradeAmount;
        volume += tradeAmount;
      }
    }
  }
  return { net, volume };
}

// Display final simulation statistics in the stats div.
function displayStats(finalPrice, totalSupply) {
  const statsDiv = document.getElementById('simulationStats');
  statsDiv.innerHTML = `
    <p><strong>Final Token Price:</strong> ${finalPrice.toFixed(4)}</p>
    <p><strong>Total Token Supply:</strong> ${Math.floor(totalSupply)}</p>
    <p><strong>Simulation Duration:</strong> ${SIMULATION_DAYS} days</p>
  `;
}

// Draw the token price history chart with D3.
function drawChart(priceHistory) {
  const svg = d3.select('#priceChart');
  const width = +svg.attr('width');
  const height = +svg.attr('height');
  const margin = { top: 20, right: 30, bottom: 30, left: 50 };

  const x = d3.scaleLinear()
    .domain([0, priceHistory.length - 1])
    .range([margin.left, width - margin.right]);

  const y = d3.scaleLinear()
    .domain([d3.min(priceHistory) * 0.95, d3.max(priceHistory) * 1.05])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const line = d3.line()
    .x((d, i) => x(i))
    .y(d => y(d))
    .curve(d3.curveMonotoneX);

  svg.append('path')
    .datum(priceHistory)
    .attr('fill', 'none')
    .attr('stroke', '#2a9d8f')
    .attr('stroke-width', 2)
    .attr('d', line);

  svg.append('g')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(priceHistory.length).tickFormat(d => `Day ${d}`))
    .selectAll("text")
      .attr("transform", "rotate(-40)")
      .style("text-anchor", "end");

  svg.append('g')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));
}

// Clear previous chart SVG content.
function clearChart() {
  const svg = d3.select('#priceChart');
  svg.selectAll('*').remove();
}