const strategies = {
  linear: {
    emission: (t, maxT) => 1/maxT,
    vesting: (t) => t,
    priceImpact: (supply) => 1/(supply * 0.000001)
  },
  cliff: {
    emission: (t, maxT) => t % 10 === 0 ? 0.2 : 0,
    vesting: (t) => t >= 10 ? 1 : 0,
    priceImpact: (supply) => 1/(supply * 0.000002)
  },
  exponential: {
    emission: (t, maxT) => Math.exp(-t/10)/10,
    vesting: (t) => 1 - Math.exp(-t/5),
    priceImpact: (supply) => 1/(supply * 0.0000015)
  }
};

let priceChart, supplyChart;

function runSimulation() {
  const strategyType = document.getElementById('strategy').value;
  const initialSupply = parseInt(document.getElementById('initialSupply').value);
  const timeSteps = parseInt(document.getElementById('timeSteps').value);
  
  const strategy = strategies[strategyType];
  const results = simulateTokenDynamics(strategy, initialSupply, timeSteps);
  
  updateCharts(results);
}

function simulateTokenDynamics(strategy, initialSupply, timeSteps) {
  let supply = initialSupply;
  const results = {
    prices: [strategy.priceImpact(initialSupply)],
    supplies: [initialSupply],
    time: [0]
  };

  for (let t = 1; t <= timeSteps; t++) {
    const emissionRate = strategy.emission(t, timeSteps);
    const vested = strategy.vesting(t);
    
    const newTokens = initialSupply * emissionRate * vested;
    supply += newTokens;
    
    const price = strategy.priceImpact(supply);
    
    results.prices.push(price);
    results.supplies.push(supply);
    results.time.push(t);
  }

  return results;
}

function updateCharts(results) {
  const chartConfig = (label, data, color) => ({
    type: 'line',
    data: {
      labels: results.time,
      datasets: [{
        label: label,
        data: data,
        borderColor: color,
        tension: 0.4,
        fill: false
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' }
      },
      scales: {
        x: { title: { display: true, text: 'Time Steps' } },
        y: { title: { display: true, text: 'Value' } }
      }
    }
  });

  if (priceChart) priceChart.destroy();
  if (supplyChart) supplyChart.destroy();

  priceChart = new Chart(
    document.getElementById('priceChart'),
    chartConfig('Token Price ($)', results.prices, '#4CAF50')
  );

  supplyChart = new Chart(
    document.getElementById('supplyChart'),
    chartConfig('Total Supply', results.supplies, '#2196F3')
  );
}

// Initial simulation
document.addEventListener('DOMContentLoaded', runSimulation);