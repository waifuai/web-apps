// SVG Namespace
const svgNS = "http://www.w3.org/2000/svg";

function calculatePrices() {
  const mA = parseFloat(document.getElementById('mA').value);
  const bA = parseFloat(document.getElementById('bA').value);
  const SA = parseFloat(document.getElementById('SA').value);
  const mB = parseFloat(document.getElementById('mB').value);
  const bB = parseFloat(document.getElementById('bB').value);
  const SB = parseFloat(document.getElementById('SB').value);
  
  const PA = mA * SA + bA;
  const PB = mB * SB + bB;
  
  return { PA, PB, mA, bA, mB, bB, SA, SB };
}

function updateDisplay() {
  const { PA, PB, mA, bA, mB, bB, SA, SB } = calculatePrices();
  const exchangeAmount = parseFloat(document.getElementById('exchangeAmount').value);
  
  // Update price displays
  document.getElementById('priceA').textContent = PA.toFixed(4);
  document.getElementById('priceB').textContent = PB.toFixed(4);
  
  // Calculate and display exchange rate
  const exchangeRate = PA / PB;
  document.getElementById('exchangeRate').textContent = exchangeRate.toFixed(4);
  
  // Calculate received tokens
  const receivedB = (exchangeAmount * PA) / PB;
  document.getElementById('receivedB').textContent = receivedB.toFixed(4);
  
  // Update formula displays
  document.getElementById('formulaA').innerHTML = `P<sub>A</sub>(S<sub>A</sub>) = ${mA.toFixed(2)} × S<sub>A</sub> + ${bA.toFixed(2)}`;
  document.getElementById('formulaB').innerHTML = `P<sub>B</sub>(S<sub>B</sub>) = ${mB.toFixed(2)} × S<sub>B</sub> + ${bB.toFixed(2)}`;
  
  // Update bonding curves
  drawBondingCurve('curveA', mA, bA, SA, '#6e8efb');
  drawBondingCurve('curveB', mB, bB, SB, '#42d392');
  
  // Update slider values display
  document.querySelectorAll('.slider-container input').forEach(input => {
    const valueDisplay = input.parentElement.querySelector('.slider-value');
    if (valueDisplay) {
      valueDisplay.textContent = input.value;
    }
  });
}

function drawBondingCurve(id, m, b, currentSupply, color) {
  const svg = document.getElementById(id);
  // Clear previous content
  while (svg.firstChild) {
    svg.removeChild(svg.firstChild);
  }
  
  const width = svg.clientWidth;
  const height = svg.clientHeight;
  const padding = 20;
  const maxSupply = currentSupply * 2;
  const maxPrice = m * maxSupply + b;
  
  // Draw axes
  const xAxis = document.createElementNS(svgNS, 'line');
  xAxis.setAttribute('x1', padding);
  xAxis.setAttribute('y1', height - padding);
  xAxis.setAttribute('x2', width - padding);
  xAxis.setAttribute('y2', height - padding);
  xAxis.setAttribute('stroke', '#CBD5E0');
  xAxis.setAttribute('stroke-width', '2');
  svg.appendChild(xAxis);
  
  const yAxis = document.createElementNS(svgNS, 'line');
  yAxis.setAttribute('x1', padding);
  yAxis.setAttribute('y1', padding);
  yAxis.setAttribute('x2', padding);
  yAxis.setAttribute('y2', height - padding);
  yAxis.setAttribute('stroke', '#CBD5E0');
  yAxis.setAttribute('stroke-width', '2');
  svg.appendChild(yAxis);
  
  // X-axis label
  const xLabel = document.createElementNS(svgNS, 'text');
  xLabel.textContent = 'Supply';
  xLabel.setAttribute('x', width - padding - 40);
  xLabel.setAttribute('y', height - 5);
  xLabel.setAttribute('fill', '#4A5568');
  xLabel.setAttribute('font-size', '12px');
  svg.appendChild(xLabel);
  
  // Y-axis label
  const yLabel = document.createElementNS(svgNS, 'text');
  yLabel.textContent = 'Price';
  yLabel.setAttribute('x', 5);
  yLabel.setAttribute('y', padding + 10);
  yLabel.setAttribute('fill', '#4A5568');
  yLabel.setAttribute('font-size', '12px');
  svg.appendChild(yLabel);
  
  // Draw curve
  const path = document.createElementNS(svgNS, 'path');
  let d = `M ${padding},${height - padding - (b * (height - 2 * padding) / maxPrice)}`;
  
  for (let x = 0; x <= maxSupply; x += maxSupply / 50) {
    const price = m * x + b;
    const svgX = padding + (x * (width - 2 * padding) / maxSupply);
    const svgY = height - padding - (price * (height - 2 * padding) / maxPrice);
    d += ` L ${svgX},${svgY}`;
  }
  
  path.setAttribute('d', d);
  path.setAttribute('stroke', color);
  path.setAttribute('stroke-width', '3');
  path.setAttribute('fill', 'none');
  svg.appendChild(path);
  
  // Draw current supply point
  const currentX = padding + (currentSupply * (width - 2 * padding) / maxSupply);
  const currentPrice = m * currentSupply + b;
  const currentY = height - padding - (currentPrice * (height - 2 * padding) / maxPrice);
  
  const point = document.createElementNS(svgNS, 'circle');
  point.setAttribute('cx', currentX);
  point.setAttribute('cy', currentY);
  point.setAttribute('r', '5');
  point.setAttribute('fill', color);
  svg.appendChild(point);
  
  // Highlight lines to axes
  const horizontalLine = document.createElementNS(svgNS, 'line');
  horizontalLine.setAttribute('x1', padding);
  horizontalLine.setAttribute('y1', currentY);
  horizontalLine.setAttribute('x2', currentX);
  horizontalLine.setAttribute('y2', currentY);
  horizontalLine.setAttribute('stroke', color);
  horizontalLine.setAttribute('stroke-width', '1');
  horizontalLine.setAttribute('stroke-dasharray', '4');
  svg.appendChild(horizontalLine);
  
  const verticalLine = document.createElementNS(svgNS, 'line');
  verticalLine.setAttribute('x1', currentX);
  verticalLine.setAttribute('y1', currentY);
  verticalLine.setAttribute('x2', currentX);
  verticalLine.setAttribute('y2', height - padding);
  verticalLine.setAttribute('stroke', color);
  verticalLine.setAttribute('stroke-width', '1');
  verticalLine.setAttribute('stroke-dasharray', '4');
  svg.appendChild(verticalLine);
}

// Add event listeners to all inputs
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', function() {
      updateDisplay();
      
      // Update slider value display
      if (this.type === 'range') {
        const valueDisplay = this.parentElement.querySelector('.slider-value');
        if (valueDisplay) {
          valueDisplay.textContent = this.value;
        }
      }
    });
  });
  
  // Initial calculation
  updateDisplay();
});