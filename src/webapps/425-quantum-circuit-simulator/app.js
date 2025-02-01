// Using ES Module style coding
// Circuit simulation for 1 qubit circuits with noise and a simple optimizer

// Utility: Complex number implementation
class Complex {
  constructor(re, im) {
    this.re = re;
    this.im = im;
  }
  add(other) {
    return new Complex(this.re + other.re, this.im + other.im);
  }
  multiply(other) {
    return new Complex(
      this.re * other.re - this.im * other.im,
      this.re * other.im + this.im * other.re
    );
  }
  scale(scalar) {
    return new Complex(this.re * scalar, this.im * scalar);
  }
  conjugate() {
    return new Complex(this.re, -this.im);
  }
}

// Utility: 2x2 Matrix multiplication and applying matrix to vector
function multiplyMatrixVector(matrix, vector) {
  return [
    matrix[0][0].multiply(vector[0]).add(matrix[0][1].multiply(vector[1])),
    matrix[1][0].multiply(vector[0]).add(matrix[1][1].multiply(vector[1]))
  ];
}

function multiplyMatrices(m1, m2) {
  const result = [[], []];
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      result[i][j] = new Complex(0, 0);
      for (let k = 0; k < 2; k++) {
        result[i][j] = result[i][j].add(m1[i][k].multiply(m2[k][j]));
      }
    }
  }
  return result;
}

// Define common gate matrices
const I = [
  [new Complex(1, 0), new Complex(0, 0)],
  [new Complex(0, 0), new Complex(1, 0)]
];

const X = [
  [new Complex(0, 0), new Complex(1, 0)],
  [new Complex(1, 0), new Complex(0, 0)]
];

const Y = [
  [new Complex(0, 0), new Complex(0, -1)],
  [new Complex(0, 1), new Complex(0, 0)]
];

const Z = [
  [new Complex(1, 0), new Complex(0, 0)],
  [new Complex(0, 0), new Complex(-1, 0)]
];

const H = [
  [new Complex(1/Math.sqrt(2), 0), new Complex(1/Math.sqrt(2), 0)],
  [new Complex(1/Math.sqrt(2), 0), new Complex(-1/Math.sqrt(2), 0)]
];

function Rx(theta) {
  // Rotation around X axis: cos(theta/2)*I - i*sin(theta/2)*X
  const cos = Math.cos(theta/2);
  const sin = Math.sin(theta/2);
  return [
    [new Complex(cos, 0), new Complex(0, -sin)],
    [new Complex(0, -sin), new Complex(cos, 0)]
  ];
}

function Rz(theta) {
  // Rotation around Z axis: exp(-i*theta/2) and exp(i*theta/2)
  return [
    [new Complex(Math.cos(theta/2), -Math.sin(theta/2)), new Complex(0,0)],
    [new Complex(0,0), new Complex(Math.cos(theta/2), Math.sin(theta/2))]
  ];
}

// Gate lookup for simulation and rendering
function getGateMatrix(gate) {
  if (gate.gate === 'H') return H;
  if (gate.gate === 'X') return X;
  if (gate.gate === 'Y') return Y;
  if (gate.gate === 'Z') return Z;
  if (gate.gate === 'Rx') return Rx(gate.params[0]);
  if (gate.gate === 'Rz') return Rz(gate.params[0]);
  return I;
}

// Generate a random gate from a list
function randomGate() {
  const availableGates = ['H', 'X', 'Y', 'Z', 'Rx', 'Rz'];
  const choice = availableGates[Math.floor(Math.random()*availableGates.length)];
  if (choice === 'Rx' || choice === 'Rz') {
    // Random angle between 0 and 2pi
    return { gate: choice, params: [Math.random()*2*Math.PI] };
  }
  return { gate: choice, params: [] };
}

// Generate a random circuit with a given number of gates
function generateRandomCircuit(length = 8) {
  const circuit = [];
  for (let i = 0; i < length; i++) {
    circuit.push(randomGate());
  }
  return circuit;
}

// Simple simulation that applies each gate to a qubit state ([1,0]).
// With noise: after each gate, with probability noiseProb, apply a random Pauli error.
function simulateCircuit(circuit, noiseProb = 0.1) {
  let state = [new Complex(1,0), new Complex(0,0)];
  let appliedCircuit = []; // track applied gates including noise
  circuit.forEach(gate => {
    const U = getGateMatrix(gate);
    state = multiplyMatrixVector(U, state);
    appliedCircuit.push(gate);
    // Apply noise: with probability noiseProb, apply a random Pauli gate from {X, Y, Z}
    if (Math.random() < noiseProb) {
      const noiseGates = ['X', 'Y', 'Z'];
      const noiseChoice = noiseGates[Math.floor(Math.random()*noiseGates.length)];
      const noiseGate = { gate: noiseChoice, params: [] };
      const Unoise = getGateMatrix(noiseGate);
      state = multiplyMatrixVector(Unoise, state);
      appliedCircuit.push({gate: 'Noisy-'+noiseChoice, params: []});
    }
  });
  return { state, appliedCircuit };
}

// Optimization: Cancel consecutive self-inverse gates and merge rotations if possible.
function optimizeCircuit(circuit) {
  const optimized = [];
  let i = 0;
  while(i < circuit.length) {
    const current = circuit[i];
    // If it's a rotation gate and next gate is the same rotation type, try combining.
    if ((current.gate === 'Rx' || current.gate === 'Rz') && i < circuit.length - 1) {
      const next = circuit[i+1];
      if (next.gate === current.gate) {
        // Combine angles
        let angle = current.params[0] + next.params[0];
        // Normalize angle to [0, 2pi)
        angle = angle % (2*Math.PI);
        // If equivalent to identity (angle close to 0 or 2pi), skip both.
        if (Math.abs(angle) < 1e-6 || Math.abs(angle - 2*Math.PI) < 1e-6) {
          i += 2;
          continue;
        } else {
          optimized.push({ gate: current.gate, params: [angle] });
          i += 2;
          continue;
        }
      }
    }
    // Cancel self-inverse consecutive gates for H, X, Y, Z.
    if (['H','X','Y','Z'].includes(current.gate) && i < circuit.length - 1) {
      const next = circuit[i+1];
      if (current.gate === next.gate) {
        // These gates cancel each other: skip both
        i += 2;
        continue;
      }
    }
    optimized.push(current);
    i++;
  }
  return optimized;
}

// Render circuit as an inline SVG diagram.
function renderCircuit(circuit) {
  const gateWidth = 60;
  const gateHeight = 40;
  const gap = 20;
  const svgWidth = circuit.length * (gateWidth + gap) + gap;
  const svgHeight = 100;
  const xmlns = "http://www.w3.org/2000/svg";
  const svgElem = document.createElementNS(xmlns, "svg");
  svgElem.setAttribute("width", svgWidth);
  svgElem.setAttribute("height", svgHeight);

  // Draw a horizontal line representing the qubit wire
  const wire = document.createElementNS(xmlns, "line");
  wire.setAttribute("x1", 0);
  wire.setAttribute("y1", svgHeight/2);
  wire.setAttribute("x2", svgWidth);
  wire.setAttribute("y2", svgHeight/2);
  wire.setAttribute("stroke", "#333");
  wire.setAttribute("stroke-width", "2");
  svgElem.appendChild(wire);

  circuit.forEach((gate, index) => {
    const x = gap + index * (gateWidth + gap);
    const y = (svgHeight - gateHeight) / 2;
    // Draw rectangle for the gate
    const rect = document.createElementNS(xmlns, "rect");
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", gateWidth);
    rect.setAttribute("height", gateHeight);
    rect.setAttribute("fill", "#4a90e2");
    rect.setAttribute("stroke", "#333");
    rect.setAttribute("stroke-width", "2");
    rect.setAttribute("rx", "5");
    rect.setAttribute("ry", "5");
    svgElem.appendChild(rect);
    // Text inside the rectangle
    const text = document.createElementNS(xmlns, "text");
    text.setAttribute("x", x + gateWidth/2);
    text.setAttribute("y", y + gateHeight/2 + 5);
    text.setAttribute("fill", "white");
    text.setAttribute("font-size", "14");
    text.setAttribute("font-family", "Arial, sans-serif");
    text.setAttribute("text-anchor", "middle");
    let label = gate.gate;
    if (gate.params.length > 0) {
      label += `(${gate.params[0].toFixed(2)})`;
    }
    text.textContent = label;
    svgElem.appendChild(text);
  });
  return svgElem;
}

// Update UI helpers
function displayCircuit(circuit) {
  const detailsElem = document.getElementById("circuitDetails");
  detailsElem.textContent = JSON.stringify(circuit, null, 2);
  const diagramContainer = document.getElementById("circuitDiagram");
  diagramContainer.innerHTML = "";
  diagramContainer.appendChild(renderCircuit(circuit));
}

function displaySimulationResult(result) {
  const simElem = document.getElementById("simulationResult");
  // Show state with probability amplitudes (magnitude)
  const amplitude = result.state.map(c => Math.sqrt(c.re*c.re + c.im*c.im).toFixed(3));
  simElem.textContent = 
`Final quantum state amplitudes:
|0>: ${amplitude[0]}
|1>: ${amplitude[1]}

Applied Gates (including noise):
${JSON.stringify(result.appliedCircuit, null, 2)}
`;
}

// Global state
let currentCircuit = [];

// Wire up UI events
document.getElementById("generateCircuit").addEventListener("click", () => {
  currentCircuit = generateRandomCircuit(8);
  displayCircuit(currentCircuit);
  document.getElementById("simulationResult").textContent = "";
});

document.getElementById("simulateCircuit").addEventListener("click", () => {
  if (currentCircuit.length === 0) {
    alert("Generate a circuit first!");
    return;
  }
  const simulation = simulateCircuit(currentCircuit, 0.15);
  displaySimulationResult(simulation);
});

document.getElementById("optimizeCircuit").addEventListener("click", () => {
  if (currentCircuit.length === 0) {
    alert("Generate a circuit first!");
    return;
  }
  currentCircuit = optimizeCircuit(currentCircuit);
  displayCircuit(currentCircuit);
});