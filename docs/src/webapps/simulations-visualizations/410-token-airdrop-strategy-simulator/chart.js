import { Simulation } from './simulation.js';

const chartConfig = {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      label: 'Token Price',
      data: [],
      borderColor: '#4CAF50',
      tension: 0.1
    }, {
      label: 'Circulating Supply',
      data: [],
      borderColor: '#2196F3',
      yAxisID: 'y1',
      tension: 0.1
    }]
  },
  options: {
    responsive: true,
    interaction: { mode: 'index' },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: { drawOnChartArea: false }
      }
    }
  }
};

export class ChartUpdater {
  constructor() {
    this.chart = new Chart(document.getElementById('chart'), chartConfig);
    this.sim = new Simulation();
    this.isRunning = false;
    
    document.querySelectorAll('button').forEach(btn => 
      btn.addEventListener('click', () => this.runSimulation(btn.dataset.strategy))
    );
  }

  async runSimulation(strategy) {
    if (this.isRunning) return;
    this.isRunning = true;
    
    this.sim.reset();
    this.sim.applyAirdrop(strategy);
    
    this.chart.data.labels = [];
    this.chart.data.datasets.forEach(dataset => dataset.data = []);
    
    for (let i = 0; i < 100; i++) {
      this.sim.step();
      this.updateChart();
      await new Promise(r => setTimeout(r, 50));
    }
    
    this.isRunning = false;
  }

  updateChart() {
    const history = this.sim.history;
    const current = history[history.length - 1];
    
    document.getElementById('price').textContent = `$${current.price.toFixed(2)}`;
    document.getElementById('supply').textContent = 
      Math.round(current.supply).toLocaleString();
    
    this.chart.data.labels.push(`Step ${current.step}`);
    this.chart.data.datasets[0].data.push(current.price);
    this.chart.data.datasets[1].data.push(current.supply);
    this.chart.update();
  }
}

// Initialize simulation when DOM loads
window.addEventListener('DOMContentLoaded', () => new ChartUpdater());