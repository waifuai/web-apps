function calculatePrices() {
  const mA = parseFloat(document.getElementById('mA').value);
  const bA = parseFloat(document.getElementById('bA').value);
  const SA = parseFloat(document.getElementById('SA').value);
  const mB = parseFloat(document.getElementById('mB').value);
  const bB = parseFloat(document.getElementById('bB').value);
  const SB = parseFloat(document.getElementById('SB').value);
  
  const PA = mA * SA + bA;
  const PB = mB * SB + bB;
  
  return { PA, PB };
}

function updateDisplay() {
  const { PA, PB } = calculatePrices();
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
}

// Add event listeners to all inputs
document.querySelectorAll('input').forEach(input => {
  input.addEventListener('input', updateDisplay);
});

// Initial calculation
updateDisplay();