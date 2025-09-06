// Initialize the model
const economicModel = new EconomicModel();

// Tab navigation
document.querySelectorAll('.tab-btn').forEach(button => {
  button.addEventListener('click', function() {
    // Remove active class from all tabs
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to clicked tab
    this.classList.add('active');
    const tabId = `${this.dataset.tab}-tab`;
    document.getElementById(tabId).classList.add('active');
    
    // Update graphs if on analysis tab
    if (this.dataset.tab === 'analysis') {
      updateAnalysisGraphs();
    }
  });
});

// Get current policy settings
function getCurrentPolicy() {
  return {
    T: parseFloat(document.getElementById('taxSlider').value),
    R: parseFloat(document.getElementById('regSlider').value)
  };
}

// Update all graphs based on current policy
function updateGraphs() {
  const { T, R } = getCurrentPolicy();
  const results = economicModel.calculate(T, R);
  
  // Update main model graphs
  updateOutputGraph(results);
  updateMotivationGraph(results);
  updateProducersGraph(results);
  updateRelationshipGraph(T, R, results);
  
  // Update results panel
  updateResultsPanel(results);
}

// Update the output graph
function updateOutputGraph(results) {
  const outputTrace = {
    x: ['Economic Output'],
    y: [results.Y],
    type: 'bar',
    marker: {color: '#2ecc71'}
  };
  
  const taxTrace = {
    x: ['Tax Revenue'],
    y: [results.taxRevenue],
    type: 'bar',
    marker: {color: '#3498db'}
  };
  
  const layout = {
    title: 'Economic Output & Tax Revenue',
    yaxis: {title: 'Value'},
    showlegend: false,
    margin: { t: 40, b: 30, l: 60, r: 10 }
  };
  
  Plotly.newPlot('outputGraph', [outputTrace, taxTrace], layout);
}

// Update the motivation graph
function updateMotivationGraph(results) {
  const motivationTrace = {
    x: ['Motivation', 'Strike Probability'],
    y: [results.M, results.S],
    type: 'bar',
    marker: {
      color: ['#3498db', '#e74c3c']
    }
  };

  const layout = {
    title: 'Motivation & Strike Probability',
    yaxis: {title: 'Value', range: [0, 1]},
    showlegend: false,
    margin: { t: 40, b: 30, l: 60, r: 10 }
  };

  Plotly.newPlot('motivationGraph', [motivationTrace], layout);
}

// Update the producers graph
function updateProducersGraph(results) {
  const data = [{
    values: [results.activePercentage, results.inactivePercentage],
    labels: ['Active', 'On Strike'],
    type: 'pie',
    marker: {
      colors: ['#2ecc71', '#e74c3c']
    },
    textinfo: 'label+percent',
    insidetextorientation: 'radial'
  }];
  
  const layout = {
    title: 'Producer Status',
    showlegend: false,
    margin: { t: 40, b: 10, l: 10, r: 10 }
  };
  
  Plotly.newPlot('producersGraph', data, layout);
}

// Update relationship graph (tax vs regulation)
function updateRelationshipGraph(T, R, results) {
  // Create a scatter plot with a point representing current T,R position
  const trace = {
    x: [T],
    y: [R],
    mode: 'markers',
    marker: {
      size: 12,
      color: '#e74c3c'
    },
    name: 'Current Policy'
  };
  
  // Create contour lines showing equal output levels
  const heatmapData = economicModel.generateHeatmapData();
  const contour = {
    x: heatmapData.xValues,
    y: heatmapData.yValues,
    z: heatmapData.zValues,
    type: 'contour',
    colorscale: 'Viridis',
    contours: {
      coloring: 'heatmap'
    },
    name: 'Output Levels'
  };
  
  const layout = {
    title: 'Policy Space (Output Contours)',
    xaxis: {
      title: 'Tax Rate (T)',
      range: [0, 1]
    },
    yaxis: {
      title: 'Regulation Level (R)',
      range: [0, 1]
    },
    margin: { t: 40, b: 50, l: 60, r: 10 },
    showlegend: false
  };
  
  Plotly.newPlot('relationshipGraph', [contour, trace], layout);
}

// Update the analysis graphs
function updateAnalysisGraphs() {
  updateHeatmapGraph();
  updateTaxEffectGraph();
}

// Update the heatmap graph
function updateHeatmapGraph() {
  const heatmapData = economicModel.generateHeatmapData();
  
  const data = [{
    x: heatmapData.xValues,
    y: heatmapData.yValues,
    z: heatmapData.zValues,
    type: 'heatmap',
    colorscale: 'Viridis',
    colorbar: {
      title: 'Output'
    }
  }];
  
  const layout = {
    title: 'Economic Output Heatmap',
    xaxis: {
      title: 'Tax Rate (T)'
    },
    yaxis: {
      title: 'Regulation Level (R)'
    },
    margin: { t: 50, b: 50, l: 70, r: 20 }
  };
  
  Plotly.newPlot('heatmapGraph', data, layout);
}

// Update the tax effect graph
function updateTaxEffectGraph() {
  const taxData = economicModel.generateTaxEffectData();
  
  const outputTrace = {
    x: taxData.taxValues,
    y: taxData.outputs,
    mode: 'lines',
    name: 'Economic Output',
    line: {
      color: '#2ecc71',
      width: 3
    }
  };
  
  const revenueTrace = {
    x: taxData.taxValues,
    y: taxData.taxRevenues,
    mode: 'lines',
    name: 'Tax Revenue',
    line: {
      color: '#3498db',
      width: 3
    }
  };
  
  const layout = {
    title: 'Effect of Tax Rate (with R=0.2)',
    xaxis: {
      title: 'Tax Rate (T)'
    },
    yaxis: {
      title: 'Value'
    },
    legend: {
      x: 0.05,
      y: 1
    },
    margin: { t: 50, b: 50, l: 70, r: 20 }
  };
  
  Plotly.newPlot('taxEffectGraph', [outputTrace, revenueTrace], layout);
}

// Update the results panel
function updateResultsPanel(results) {
  const statsHtml = `
    <div class="stat-item">
      <div class="stat-label">Economic Output</div>
      <div class="stat-value">${results.Y.toFixed(0)}</div>
    </div>
    <div class="stat-item">
      <div class="stat-label">Tax Revenue</div>
      <div class="stat-value">${results.taxRevenue.toFixed(0)}</div>
    </div>
    <div class="stat-item">
      <div class="stat-label">Motivation Level</div>
      <div class="stat-value">${results.M.toFixed(2)}</div>
    </div>
    <div class="stat-item">
      <div class="stat-label">Strike Probability</div>
      <div class="stat-value">${results.S.toFixed(2)}</div>
    </div>
    <div class="stat-item">
      <div class="stat-label">Active Producers</div>
      <div class="stat-value">${results.N.toFixed(0)}</div>
    </div>
    <div class="stat-item">
      <div class="stat-label">Inactive Producers</div>
      <div class="stat-value">${(economicModel.params.N0 - results.N).toFixed(0)}</div>
    </div>
  `;
  
  document.getElementById('results').innerHTML = statsHtml;
}

// Find optimal policy
document.getElementById('findOptimalBtn').addEventListener('click', function() {
  const optimal = economicModel.findOptimalPolicy();
  const results = optimal.results;
  
  // Update the sliders to optimal values
  document.getElementById('taxSlider').value = optimal.T;
  document.getElementById('taxValue').textContent = optimal.T.toFixed(2);
  document.getElementById('regSlider').value = optimal.R;
  document.getElementById('regValue').textContent = optimal.R.toFixed(2);
  
  // Update all graphs with optimal values
  updateGraphs();
  
  // Display optimal results
  document.getElementById('optimalResults').innerHTML = `
    <h4>Optimal Policy Found</h4>
    <p><strong>Tax Rate (T):</strong> ${optimal.T.toFixed(2)}</p>
    <p><strong>Regulation Level (R):</strong> ${optimal.R.toFixed(2)}</p>
    <p><strong>Maximum Output:</strong> ${results.Y.toFixed(0)}</p>
    <p><strong>Tax Revenue:</strong> ${results.taxRevenue.toFixed(0)}</p>
    <p><strong>Active Producers:</strong> ${results.N.toFixed(0)} (${results.activePercentage.toFixed(1)}%)</p>
  `;
});

// Parameter controls
function setupParameterControls() {
  // Setup range sliders for sensitivity parameters
  document.querySelectorAll('#paramA, #paramB, #paramC, #paramD').forEach(slider => {
    slider.addEventListener('input', function() {
      const valueElement = document.getElementById(`${this.id}Value`);
      valueElement.textContent = this.value;
    });
  });
  
  // Apply parameters button
  document.getElementById('applyParams').addEventListener('click', function() {
    economicModel.updateParam('N0', parseInt(document.getElementById('paramN0').value, 10));
    economicModel.updateParam('P', parseInt(document.getElementById('paramP').value, 10));
    economicModel.updateParam('a', parseFloat(document.getElementById('paramA').value));
    economicModel.updateParam('b', parseFloat(document.getElementById('paramB').value));
    economicModel.updateParam('c', parseFloat(document.getElementById('paramC').value));
    economicModel.updateParam('d', parseFloat(document.getElementById('paramD').value));
    
    // Update graphs with new parameters
    updateGraphs();
    
    // Switch to model tab to show effects
    document.querySelector('.tab-btn[data-tab="model"]').click();
  });
  
  // Reset parameters button
  document.getElementById('resetParams').addEventListener('click', function() {
    economicModel.resetToDefaults();
    
    // Update UI with default values
    document.getElementById('paramN0').value = economicModel.params.N0;
    document.getElementById('paramP').value = economicModel.params.P;
    
    document.getElementById('paramA').value = economicModel.params.a;
    document.getElementById('paramAValue').textContent = economicModel.params.a;
    
    document.getElementById('paramB').value = economicModel.params.b;
    document.getElementById('paramBValue').textContent = economicModel.params.b;
    
    document.getElementById('paramC').value = economicModel.params.c;
    document.getElementById('paramCValue').textContent = economicModel.params.c;
    
    document.getElementById('paramD').value = economicModel.params.d;
    document.getElementById('paramDValue').textContent = economicModel.params.d;
  });
}

// Policy control sliders
document.getElementById('taxSlider').addEventListener('input', function() {
  document.getElementById('taxValue').textContent = this.value;
  updateGraphs();
});

document.getElementById('regSlider').addEventListener('input', function() {
  document.getElementById('regValue').textContent = this.value;
  updateGraphs();
});

// Initialize everything
function init() {
  setupParameterControls();
  updateGraphs();
}

// Start the application
document.addEventListener('DOMContentLoaded', init);