import { Simulation } from './simulation.js';

const chartConfig = {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      label: 'Token Price',
      data: [],
      borderColor: '#4CAF50',
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
      fill: true,
      tension: 0.3
    }, {
      label: 'Circulating Supply',
      data: [],
      borderColor: '#2196F3',
      backgroundColor: 'rgba(33, 150, 243, 0.1)',
      fill: true,
      yAxisID: 'y1',
      tension: 0.3
    }]
  },
  options: {
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: { display: true, text: 'Token Price ($)' },
        beginAtZero: true
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: { display: true, text: 'Circulating Supply' },
        grid: { drawOnChartArea: false },
        beginAtZero: true
      },
      x: {
        title: { display: true, text: 'Simulation Steps' }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
              if (context.datasetIndex === 0) {
                label += '$' + context.parsed.y.toFixed(2);
              } else {
                label += Math.round(context.parsed.y).toLocaleString();
              }
            }
            return label;
          }
        }
      }
    }
  }
};

export class ChartUpdater {
  constructor() {
    this.chart = new Chart(document.getElementById('chart'), chartConfig);
    this.sim = new Simulation();
    this.isRunning = false;
    this.stepsToRun = 150;
    
    document.querySelectorAll('button').forEach(btn => 
      btn.addEventListener('click', () => this.runSimulation(btn.dataset.strategy))
    );
    
    this.updateUI();
  }

  async runSimulation(strategy) {
    if (this.isRunning) return;
    this.isRunning = true;
    
    document.querySelectorAll('button').forEach(btn => btn.disabled = true);
    
    this.sim.reset();
    this.sim.applyAirdrop(strategy);
    
    this.chart.data.labels = [];
    this.chart.data.datasets.forEach(dataset => dataset.data = []);
    
    document.getElementById('current-strategy').textContent = strategy;
    
    for (let i = 0; i < this.stepsToRun; i++) {
      this.sim.step();
      this.updateUI();
      await new Promise(r => setTimeout(r, 30));
    }
    
    document.querySelectorAll('button').forEach(btn => btn.disabled = false);
    this.isRunning = false;
  }

  updateUI() {
    const history = this.sim.history;
    if (history.length === 0) {
      document.getElementById('price').textContent = `$${this.sim.price.toFixed(2)}`;
      document.getElementById('supply').textContent = Math.round(this.sim.supply).toLocaleString();
      document.getElementById('step').textContent = this.sim.stepCount;
      return;
    }
    
    const current = history[history.length - 1];
    
    document.getElementById('price').textContent = `$${current.price.toFixed(2)}`;
    document.getElementById('supply').textContent = Math.round(current.supply).toLocaleString();
    document.getElementById('step').textContent = current.step;
    
    this.chart.data.labels.push(`Step ${current.step}`);
    this.chart.data.datasets[0].data.push(current.price);
    this.chart.data.datasets[1].data.push(current.supply);
    this.chart.update();
  }
}

window.addEventListener('DOMContentLoaded', () => new ChartUpdater());