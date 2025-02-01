import { simulateStrategy } from './model.js';

const strategySelect = document.getElementById('strategy');
const tMaxSlider = document.getElementById('tMax');
const sellProbSlider = document.getElementById('sellProb');
const tMaxValue = document.getElementById('tMaxValue');
const sellProbValue = document.getElementById('sellProbValue');

let chartInstance = null;

const config = {
  initialPrice: 1.0,
  initialSupply: 1_000_000,
  alpha: 0.0001,
  strategies: {
    immediate: (t, T) => t === 0 ? 0.4 * T : 0,
    linear: (t, T) => 1/T,
    cliff: (t, T) => t === Math.floor(T/2) ? 1 : 0
  }
};

function updateChart() {
  const params = {
    strategy: strategySelect.value,
    T: parseInt(tMaxSlider.value),
    sellProbability: parseInt(sellProbSlider.value)/100
  };

  const results = simulateStrategy(config, params);
  
  if (chartInstance) chartInstance.destroy();
  
  chartInstance = new Chart(document.getElementById('priceChart'), {
    type: 'line',
    data: {
      labels: Array.from({length: params.T}, (_, i) => i+1),
      datasets: [{
        label: 'Token Price ($)',
        data: results.prices,
        borderColor: '#3498db',
        tension: 0.4,
        pointRadius: 0
      }, {
        label: 'Token Supply',
        data: results.supplies,
        borderColor: '#2ecc71',
        tension: 0.4,
        pointRadius: 0,
        yAxisID: 'y1'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: { text: 'Price ($)', display: true }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: { text: 'Supply', display: true },
          grid: { drawOnChartArea: false }
        }
      },
      plugins: {
        tooltip: {
          mode: 'index',
          intersect: false
        }
      }
    }
  });
}

function updateValues() {
  tMaxValue.textContent = tMaxSlider.value;
  sellProbValue.textContent = sellProbSlider.value;
  updateChart();
}

[strategySelect, tMaxSlider, sellProbSlider].forEach(
  el => el.addEventListener('input', updateValues)
);

// Initial render
updateValues();