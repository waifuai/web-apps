// Token prices and volatility
const tokenData = {
  SOL: { price: 45.20, volatility: 0.65, correlation: { SOL: 1.0, RAY: 0.7, SRM: 0.6, FIDA: 0.5, MSOL: 0.9, ATLAS: 0.4 } },
  RAY: { price: 0.22, volatility: 0.85, correlation: { SOL: 0.7, RAY: 1.0, SRM: 0.8, FIDA: 0.6, MSOL: 0.6, ATLAS: 0.5 } },
  SRM: { price: 0.15, volatility: 0.75, correlation: { SOL: 0.6, RAY: 0.8, SRM: 1.0, FIDA: 0.7, MSOL: 0.5, ATLAS: 0.6 } },
  FIDA: { price: 0.26, volatility: 0.80, correlation: { SOL: 0.5, RAY: 0.6, SRM: 0.7, FIDA: 1.0, MSOL: 0.4, ATLAS: 0.7 } },
  MSOL: { price: 46.80, volatility: 0.60, correlation: { SOL: 0.9, RAY: 0.6, SRM: 0.5, FIDA: 0.4, MSOL: 1.0, ATLAS: 0.3 } },
  ATLAS: { price: 0.0021, volatility: 0.95, correlation: { SOL: 0.4, RAY: 0.5, SRM: 0.6, FIDA: 0.7, MSOL: 0.3, ATLAS: 1.0 } }
};

// Quantum computer configurations
const quantumComputers = {
  ibmq: {
    name: "IBM Quantum",
    description: "Uses superconducting qubits with gate-based architecture",
    coherenceTime: "100 microseconds",
    gateAccuracy: "99.7%",
    architecture: "Gate-based",
    maxQubits: 127
  },
  dwave: {
    name: "D-Wave Systems",
    description: "Quantum annealing processor specialized for optimization problems",
    coherenceTime: "20 microseconds",
    qubitsConnectivity: "Chimera/Pegasus graph",
    architecture: "Quantum annealing",
    maxQubits: 5000
  },
  ionq: {
    name: "IonQ",
    description: "Uses trapped ions as qubits with high coherence times",
    coherenceTime: "Seconds to minutes",
    gateAccuracy: "99.9%",
    architecture: "Gate-based (ion trap)",
    maxQubits: 32
  },
  rigetti: {
    name: "Rigetti Computing",
    description: "Hybrid quantum-classical processors with superconducting qubits",
    coherenceTime: "90 microseconds",
    gateAccuracy: "99.5%",
    architecture: "Gate-based",
    maxQubits: 80
  }
};

// Quantum optimization methods
const optimizationMethods = {
  qaoa: {
    name: "Quantum Approximate Optimization Algorithm (QAOA)",
    description: "A hybrid quantum-classical algorithm designed to find approximate solutions to combinatorial optimization problems.",
    formula: "C(\\gamma, \\beta) = \\langle \\gamma, \\beta | C | \\gamma, \\beta \\rangle \\\\ |\\gamma, \\beta\\rangle = U_B(\\beta_p)U_C(\\gamma_p)\\cdots U_B(\\beta_1)U_C(\\gamma_1)|s\\rangle \\\\ U_C(\\gamma) = e^{-i\\gamma C}, U_B(\\beta) = e^{-i\\beta B}",
    circuitDescription: "QAOA creates a series of alternating unitaries driven by the problem Hamiltonian and a mixing Hamiltonian, applied to an initial superposition state."
  },
  vqe: {
    name: "Variational Quantum Eigensolver (VQE)",
    description: "A hybrid algorithm that uses a quantum computer to prepare a state and a classical computer to optimize parameters to find the ground state of a Hamiltonian.",
    formula: "E(\\theta) = \\langle \\psi(\\theta)|H|\\psi(\\theta)\\rangle \\\\ |\\psi(\\theta)\\rangle = U(\\theta)|0\\rangle^{\\otimes n} \\\\ \\theta^* = \\arg\\min_\\theta E(\\theta)",
    circuitDescription: "VQE uses parameterized quantum circuits to prepare trial states, evaluates the expectation value of a Hamiltonian, and classically optimizes parameters to minimize energy."
  },
  qaa: {
    name: "Quantum Adiabatic Algorithm",
    description: "Exploits the adiabatic theorem of quantum mechanics to find the ground state of a problem Hamiltonian by slowly evolving from a simple to a complex Hamiltonian.",
    formula: "H(s) = (1-s)H_0 + sH_P, \\quad s \\in [0,1] \\\\ |\\psi(0)\\rangle = |\\psi_0\\rangle \\text{ (ground state of } H_0) \\\\ |\\psi(T)\\rangle \\approx |\\psi_P\\rangle \\text{ (ground state of } H_P)",
    circuitDescription: "Quantum adiabatic algorithms transform an initial simple Hamiltonian to the problem Hamiltonian slowly enough to maintain the system in its ground state throughout the evolution."
  }
};

// Portfolio optimization QUBO formulation
const portfolioQuboFormulation = `
<div class="math-content">
The portfolio optimization problem can be formulated as a Quadratic Unconstrained Binary Optimization (QUBO) problem:

$$\\begin{aligned}
\\min_{x} \\quad & x^T Q x \\\\
\\text{where} \\quad & Q_{ij} = \\sigma_i \\sigma_j \\rho_{ij} - \\lambda \\mu_i \\mu_j \\\\
& x_i \\in \\{0, 1\\}
\\end{aligned}$$

Here:
<ul>
  <li>$\\sigma_i$ is the volatility of asset $i$</li>
  <li>$\\rho_{ij}$ is the correlation between assets $i$ and $j$</li>
  <li>$\\mu_i$ is the expected return of asset $i$</li>
  <li>$\\lambda$ is the risk tolerance parameter</li>
</ul>
</div>
`;

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  updateQuantumInfo();
  document.getElementById('runOptimization').addEventListener('click', runQuantumOptimization);
  
  // Initialize MathJax to process equations after DOM is loaded
  if (typeof MathJax !== 'undefined') {
    MathJax.typesetPromise().catch(function (err) {
      console.log('MathJax typesetting failed: ' + err.message);
    });
  }
});

function updateQuantumInfo() {
  const quantumComputer = document.getElementById('quantumComputer').value;
  const optimizationMethod = document.getElementById('optimizationMethod').value;
  
  const computerInfo = quantumComputers[quantumComputer];
  const methodInfo = optimizationMethods[optimizationMethod];
  
  // Update quantum computer description
  let computerHTML = `
    <div class="tab">
      <div class="tab-header"><h3>${computerInfo.name}</h3></div>
      <div class="tab-content">
        <p>${computerInfo.description}</p>
        <div class="metric-card">
          <span class="metric-label">Architecture:</span>
          <span class="metric-value">${computerInfo.architecture}</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">Max Qubits:</span>
          <span class="metric-value">${computerInfo.maxQubits}</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">Coherence Time:</span>
          <span class="metric-value">${computerInfo.coherenceTime}</span>
        </div>
      </div>
    </div>
  `;
  
  // Update quantum method description with proper math formatting
  let methodHTML = `
    <div class="tab">
      <div class="tab-header"><h3>${methodInfo.name}</h3></div>
      <div class="tab-content">
        <p>${methodInfo.description}</p>
        <div class="quantum-equation">
          <h4>Mathematical Formulation:</h4>
          <div class="math-content">
            $$${methodInfo.formula}$$
          </div>
        </div>
        <p>${methodInfo.circuitDescription}</p>
      </div>
    </div>
    
    <div class="tab">
      <div class="tab-header"><h3>Portfolio Optimization Formulation</h3></div>
      <div class="tab-content">
        ${portfolioQuboFormulation}
      </div>
    </div>
  `;
  
  // Update circuit visualization based on method
  let circuitHTML = `
    <div class="tab">
      <div class="tab-header"><h3>Quantum Circuit Representation</h3></div>
      <div class="tab-content">
        <div class="quantum-circuit">
          ${generateQuantumCircuit(optimizationMethod)}
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('quantumDescription').innerHTML = computerHTML;
  document.getElementById('quantumFormulation').innerHTML = methodHTML;
  document.getElementById('quantumCircuit').innerHTML = circuitHTML;
  
  // Re-process mathematics after content update
  if (typeof MathJax !== 'undefined') {
    MathJax.typesetPromise().catch(function (err) {
      console.log('MathJax typesetting failed: ' + err.message);
    });
  }
}

function generateQuantumCircuit(method) {
  let circuitHTML = '';
  
  if (method === 'qaoa') {
    // Generate a QAOA circuit
    for (let i = 0; i < 4; i++) {
      circuitHTML += `
        <div class="qubit-line">
          <span>q${i}</span>
          <div class="line"></div>
          <div class="gate">H</div>
          <div class="line"></div>
          <div class="gate">Rz</div>
          <div class="line"></div>
          <div class="gate">Rx</div>
          <div class="line"></div>
          <div class="gate">CZ</div>
          <div class="line"></div>
          <div class="gate">Rz</div>
          <div class="line"></div>
          <div class="gate">M</div>
        </div>
      `;
    }
  } else if (method === 'vqe') {
    // Generate a VQE circuit
    for (let i = 0; i < 4; i++) {
      circuitHTML += `
        <div class="qubit-line">
          <span>q${i}</span>
          <div class="line"></div>
          <div class="gate">Ry</div>
          <div class="line"></div>
          <div class="gate">Rz</div>
          <div class="line"></div>
          <div class="gate">CX</div>
          <div class="line"></div>
          <div class="gate">Ry</div>
          <div class="line"></div>
          <div class="gate">M</div>
        </div>
      `;
    }
  } else if (method === 'qaa') {
    // Generate a QAA circuit
    for (let i = 0; i < 4; i++) {
      circuitHTML += `
        <div class="qubit-line">
          <span>q${i}</span>
          <div class="line"></div>
          <div class="gate">H</div>
          <div class="line"></div>
          <div class="gate">T</div>
          <div class="line"></div>
          <div class="gate">CP</div>
          <div class="line"></div>
          <div class="gate">T</div>
          <div class="line"></div>
          <div class="gate">H</div>
          <div class="line"></div>
          <div class="gate">M</div>
        </div>
      `;
    }
  }
  
  return circuitHTML;
}

function runQuantumOptimization() {
  // Show loading state
  document.getElementById('runOptimization').textContent = 'Optimizing...';
  document.getElementById('runOptimization').disabled = true;
  
  // Get portfolio values
  const portfolio = {
    SOL: parseFloat(document.getElementById('solAmount').value),
    RAY: parseFloat(document.getElementById('rayAmount').value),
    SRM: parseFloat(document.getElementById('srmAmount').value),
    FIDA: parseFloat(document.getElementById('fidaAmount').value),
    MSOL: parseFloat(document.getElementById('msolAmount').value),
    ATLAS: parseFloat(document.getElementById('atlasAmount').value)
  };

  const riskTolerance = parseFloat(document.getElementById('riskTolerance').value);
  const quantumComputer = document.getElementById('quantumComputer').value;
  const optimizationMethod = document.getElementById('optimizationMethod').value;
  const qubits = parseInt(document.getElementById('qubits').value);
  const shots = parseInt(document.getElementById('shots').value);

  // Simulate quantum computation with a small delay to show processing
  setTimeout(() => {
    const optimizationResult = simulateQuantumOptimization(
      portfolio, 
      riskTolerance, 
      quantumComputer, 
      optimizationMethod,
      qubits,
      shots
    );
    
    displayResults(optimizationResult, portfolio);
    
    // Restore button state
    document.getElementById('runOptimization').textContent = 'Run Quantum Optimization';
    document.getElementById('runOptimization').disabled = false;
  }, 1500);
}

function simulateQuantumOptimization(portfolio, riskTolerance, quantumComputer, optimizationMethod, qubits, shots) {
  // Calculate initial portfolio value and metrics
  const initialValue = Object.keys(portfolio).reduce(
    (sum, token) => sum + portfolio[token] * tokenData[token].price, 0
  );
  
  // Calculate risk-return profile of current portfolio
  const initialRisk = calculatePortfolioRisk(portfolio);
  const initialReturn = calculateExpectedReturn(portfolio);
  
  // Generate optimization samples based on the quantum method
  const samples = generateQuantumSamples(optimizationMethod, shots);
  
  // Apply quantum-inspired optimization
  const optimizedAllocation = {};
  let totalInvestment = 0;
  
  // Apply optimization based on risk tolerance and quantum sampling
  Object.keys(portfolio).forEach(token => {
    // Calculate optimal allocation based on risk/return and quantum sampling
    const weight = calculateOptimalWeight(
      token, 
      riskTolerance, 
      samples, 
      tokenData[token].volatility
    );
    
    // Apply the weight to determine new token allocation
    const tokenValue = initialValue * weight;
    optimizedAllocation[token] = tokenValue / tokenData[token].price;
    totalInvestment += tokenValue;
  });
  
  // Normalize to ensure total investment matches initial value
  Object.keys(optimizedAllocation).forEach(token => {
    optimizedAllocation[token] = optimizedAllocation[token] * (initialValue / totalInvestment);
  });
  
  // Calculate optimized portfolio metrics
  const optimizedRisk = calculatePortfolioRisk(optimizedAllocation);
  const optimizedReturn = calculateExpectedReturn(optimizedAllocation);
  
  // Return complete optimization result
  return {
    initialPortfolio: {...portfolio},
    optimizedAllocation,
    metrics: {
      initialValue,
      optimizedValue: initialValue,  // Value is preserved
      initialRisk,
      optimizedRisk,
      initialReturn,
      optimizedReturn,
      improvementRisk: ((initialRisk - optimizedRisk) / initialRisk * 100).toFixed(2),
      improvementReturn: ((optimizedReturn - initialReturn) / initialReturn * 100).toFixed(2),
      sharpeInitial: (initialReturn / initialRisk).toFixed(4),
      sharpeOptimized: (optimizedReturn / optimizedRisk).toFixed(4)
    },
    quantumMetrics: {
      computer: quantumComputer,
      method: optimizationMethod,
      qubits,
      shots,
      circuitDepth: Math.floor(Math.random() * 50) + 20,
      executionTime: (Math.random() * 5 + 1).toFixed(2)
    }
  };
}

function calculatePortfolioRisk(portfolio) {
  // Simplified portfolio risk calculation
  let risk = 0;
  const tokens = Object.keys(portfolio);
  
  // Calculate the weighted volatility and correlation
  for (let i = 0; i < tokens.length; i++) {
    const tokenI = tokens[i];
    const valueI = portfolio[tokenI] * tokenData[tokenI].price;
    
    for (let j = 0; j < tokens.length; j++) {
      const tokenJ = tokens[j];
      const valueJ = portfolio[tokenJ] * tokenData[tokenJ].price;
      
      // Add the covariance term
      risk += valueI * valueJ * 
             tokenData[tokenI].volatility * 
             tokenData[tokenJ].volatility * 
             tokenData[tokenI].correlation[tokenJ];
    }
  }
  
  return Math.sqrt(risk) / 100;
}

function calculateExpectedReturn(portfolio) {
  // Simplified expected return calculation
  const totalValue = Object.keys(portfolio).reduce(
    (sum, token) => sum + portfolio[token] * tokenData[token].price, 0
  );
  
  let expectedReturn = 0;
  Object.keys(portfolio).forEach(token => {
    const weight = (portfolio[token] * tokenData[token].price) / totalValue;
    // Generate a random expected return for each token (in a real system, this would be based on historical data)
    const tokenReturn = (1 / tokenData[token].volatility) * (Math.random() * 0.2 + 0.05);
    expectedReturn += weight * tokenReturn;
  });
  
  return expectedReturn;
}

function generateQuantumSamples(method, shots) {
  // Simulate quantum sampling results for different methods
  const samples = [];
  
  for (let i = 0; i < shots; i++) {
    if (method === 'qaoa') {
      // QAOA tends to cluster around optimal solutions
      const baseValue = Math.random();
      samples.push(baseValue + Math.random() * 0.3 - 0.15);
    } else if (method === 'vqe') {
      // VQE converges toward minimum energy
      const baseValue = Math.random() * 0.7 + 0.3;
      samples.push(baseValue * (1 - i/shots*0.5));
    } else if (method === 'qaa') {
      // QAA gradually approaches the solution
      samples.push(Math.random() * Math.exp(-i/(shots/5)));
    }
  }
  
  return samples;
}

function calculateOptimalWeight(token, riskTolerance, samples, volatility) {
  // Higher risk tolerance means more allocation to volatile assets
  const riskAdjustment = riskTolerance > 0.5 ? 
                         (volatility * (riskTolerance - 0.5) * 2) : 
                         (1/volatility * (0.5 - riskTolerance) * 2);
  
  // Use quantum samples to adjust weights
  const quantumFactor = samples.reduce((sum, val) => sum + val, 0) / samples.length;
  
  // Combine factors to determine weight
  const rawWeight = (0.1 + riskAdjustment * 0.1) * quantumFactor;
  
  // Ensure weight is reasonable
  return Math.max(0.01, Math.min(0.4, rawWeight));
}

function displayResults(result, originalPortfolio) {
  const resultsDiv = document.getElementById('results');
  resultsDiv.style.display = 'block';

  // Display optimized allocation
  const allocationDiv = document.getElementById('optimizedAllocation');
  allocationDiv.innerHTML = '<h3>Optimized Token Allocation:</h3>';
  
  // Create a table for portfolio comparison
  let tableHTML = `
    <table class="portfolio-table" style="width:100%; border-collapse: collapse; margin-bottom: 20px;">
      <thead>
        <tr>
          <th style="text-align:left; padding:8px; border-bottom:1px solid #4a5568;">Token</th>
          <th style="text-align:right; padding:8px; border-bottom:1px solid #4a5568;">Original</th>
          <th style="text-align:right; padding:8px; border-bottom:1px solid #4a5568;">Optimized</th>
          <th style="text-align:right; padding:8px; border-bottom:1px solid #4a5568;">Change</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  Object.keys(result.optimizedAllocation).forEach(token => {
    const original = originalPortfolio[token];
    const optimized = result.optimizedAllocation[token];
    const change = ((optimized - original) / original * 100).toFixed(2);
    const changeColor = change >= 0 ? '#10B981' : '#EF4444';
    
    tableHTML += `
      <tr>
        <td style="padding:8px; border-bottom:1px solid #4a5568;">${token}</td>
        <td style="text-align:right; padding:8px; border-bottom:1px solid #4a5568;">${original.toFixed(2)}</td>
        <td style="text-align:right; padding:8px; border-bottom:1px solid #4a5568;">${optimized.toFixed(2)}</td>
        <td style="text-align:right; padding:8px; border-bottom:1px solid #4a5568; color:${changeColor};">
          ${change}%
        </td>
      </tr>
    `;
  });
  
  tableHTML += `
      </tbody>
    </table>
  `;
  
  allocationDiv.innerHTML += tableHTML;
  
  // Portfolio metrics
  allocationDiv.innerHTML += `
    <h3>Portfolio Performance Metrics</h3>
    <div style="display:flex; flex-wrap:wrap; justify-content:space-between; margin-bottom:20px;">
      <div class="metric-card" style="width:48%;">
        <span class="metric-label">Expected Return:</span>
        <span class="metric-value">
          ${(result.metrics.initialReturn * 100).toFixed(2)}% → ${(result.metrics.optimizedReturn * 100).toFixed(2)}%
          <span style="color:#10B981;">(+${result.metrics.improvementReturn}%)</span>
        </span>
      </div>
      <div class="metric-card" style="width:48%;">
        <span class="metric-label">Portfolio Risk:</span>
        <span class="metric-value">
          ${(result.metrics.initialRisk * 100).toFixed(2)}% → ${(result.metrics.optimizedRisk * 100).toFixed(2)}%
          <span style="color:#10B981;">(-${result.metrics.improvementRisk}%)</span>
        </span>
      </div>
      <div class="metric-card" style="width:48%;">
        <span class="metric-label">Sharpe Ratio:</span>
        <span class="metric-value">
          ${result.metrics.sharpeInitial} → ${result.metrics.sharpeOptimized}
          <span style="color:#10B981;">(+${((result.metrics.sharpeOptimized - result.metrics.sharpeInitial) / result.metrics.sharpeInitial * 100).toFixed(2)}%)</span>
        </span>
      </div>
      <div class="metric-card" style="width:48%;">
        <span class="metric-label">Portfolio Value:</span>
        <span class="metric-value">$${result.metrics.initialValue.toFixed(2)}</span>
      </div>
    </div>
  `;
  
  // Quantum computation metrics
  const quantumPerformanceDiv = document.getElementById('quantumPerformance');
  quantumPerformanceDiv.innerHTML = `
    <h3>Quantum Computation Details</h3>
    <div style="display:flex; flex-wrap:wrap; justify-content:space-between; margin-bottom:20px;">
      <div class="metric-card" style="width:48%;">
        <span class="metric-label">Quantum Computer:</span>
        <span class="metric-value">${quantumComputers[result.quantumMetrics.computer].name}</span>
      </div>
      <div class="metric-card" style="width:48%;">
        <span class="metric-label">Algorithm:</span>
        <span class="metric-value">${optimizationMethods[result.quantumMetrics.method].name}</span>
      </div>
      <div class="metric-card" style="width:48%;">
        <span class="metric-label">Qubits Used:</span>
        <span class="metric-value">${result.quantumMetrics.qubits}</span>
      </div>
      <div class="metric-card" style="width:48%;">
        <span class="metric-label">Circuit Depth:</span>
        <span class="metric-value">${result.quantumMetrics.circuitDepth}</span>
      </div>
      <div class="metric-card" style="width:48%;">
        <span class="metric-label">Shots (Measurements):</span>
        <span class="metric-value">${result.quantumMetrics.shots}</span>
      </div>
      <div class="metric-card" style="width:48%;">
        <span class="metric-label">Execution Time:</span>
        <span class="metric-value">${result.quantumMetrics.executionTime}s</span>
      </div>
    </div>
  `;

  // Create pie charts
  createPortfolioCharts(result.initialPortfolio, result.optimizedAllocation);
  
  // Re-process math if there are any equations in the results
  if (typeof MathJax !== 'undefined') {
    MathJax.typesetPromise().catch(function (err) {
      console.log('MathJax typesetting failed: ' + err.message);
    });
  }
}

function createPortfolioCharts(initialPortfolio, optimizedAllocation) {
  // Convert to values
  const initialValues = {};
  const optimizedValues = {};
  
  Object.keys(initialPortfolio).forEach(token => {
    initialValues[token] = initialPortfolio[token] * tokenData[token].price;
  });
  
  Object.keys(optimizedAllocation).forEach(token => {
    optimizedValues[token] = optimizedAllocation[token] * tokenData[token].price;
  });

  // Create initial portfolio pie chart
  const initialData = [{
    values: Object.values(initialValues),
    labels: Object.keys(initialValues),
    type: 'pie',
    name: 'Initial Portfolio',
    marker: {
      colors: ['#3b82f6', '#10B981', '#F59E0B', '#6366F1', '#EC4899', '#8B5CF6']
    },
    textinfo: 'label+percent',
    hoverinfo: 'label+value+percent',
    hole: 0.4
  }];

  const initialLayout = {
    title: 'Initial Portfolio Allocation',
    height: 350,
    paper_bgcolor: '#2d3748',
    plot_bgcolor: '#2d3748',
    font: { color: '#e2e8f0' },
    legend: { orientation: 'h', y: -0.2 },
    annotations: [{
      font: { size: 14, color: '#e2e8f0' },
      showarrow: false,
      text: 'Initial',
      x: 0.5,
      y: 0.5
    }]
  };

  // Create optimized portfolio pie chart
  const optimizedData = [{
    values: Object.values(optimizedValues),
    labels: Object.keys(optimizedValues),
    type: 'pie',
    name: 'Optimized Portfolio',
    marker: {
      colors: ['#3b82f6', '#10B981', '#F59E0B', '#6366F1', '#EC4899', '#8B5CF6']
    },
    textinfo: 'label+percent',
    hoverinfo: 'label+value+percent',
    hole: 0.4
  }];

  const optimizedLayout = {
    title: 'Optimized Portfolio Allocation',
    height: 350,
    paper_bgcolor: '#2d3748',
    plot_bgcolor: '#2d3748',
    font: { color: '#e2e8f0' },
    legend: { orientation: 'h', y: -0.2 },
    annotations: [{
      font: { size: 14, color: '#e2e8f0' },
      showarrow: false,
      text: 'Optimized',
      x: 0.5,
      y: 0.5
    }]
  };

  Plotly.newPlot('chart', initialData, initialLayout);
  Plotly.newPlot('comparisonChart', optimizedData, optimizedLayout);
}