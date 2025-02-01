document.addEventListener('DOMContentLoaded', () => {
  const runSimulationButton = document.getElementById('run-simulation');
  const airdropStrategySelect = document.getElementById('airdrop-strategy');
  const strategyParamsDiv = document.getElementById('strategy-params');
  const equalParamsDiv = document.getElementById('equal-params');
  const proportionalParamsDiv = document.getElementById('proportional-params');
  const randomParamsDiv = document.getElementById('random-params');
  const resultsDiv = document.getElementById('results');
  const comparisonDiv = document.getElementById('strategy-comparison');
  const comparisonTextP = document.getElementById('comparison-text');

  let priceChartInstance = null;
  let supplyChartInstance = null;

  airdropStrategySelect.addEventListener('change', () => {
    const selectedStrategy = airdropStrategySelect.value;
    equalParamsDiv.style.display = selectedStrategy === 'equal' ? 'block' : 'none';
    proportionalParamsDiv.style.display = selectedStrategy === 'proportional' ? 'block' : 'none';
    randomParamsDiv.style.display = selectedStrategy === 'random' ? 'block' : 'none';
  });

  runSimulationButton.addEventListener('click', () => {
    const initialPrice = parseFloat(document.getElementById('initial-price').value);
    const initialSupply = parseFloat(document.getElementById('initial-supply').value);
    const maxTime = parseInt(document.getElementById('max-time').value);
    const numUsers = parseInt(document.getElementById('num-users').value);

    const hodlerRatio = parseFloat(document.getElementById('hodler-ratio').value);
    const traderRatio = parseFloat(document.getElementById('trader-ratio').value);
    const dumperRatio = parseFloat(document.getElementById('dumper-ratio').value);
    const hodlerHodlProb = parseFloat(document.getElementById('hodler-hodl-prob').value);
    const traderTradeFreq = parseFloat(document.getElementById('trader-trade-freq').value);
    const dumperDumpProb = parseFloat(document.getElementById('dumper-dump-prob').value);

    const airdropStrategy = airdropStrategySelect.value;
    const equalAmount = parseFloat(document.getElementById('equal-amount').value);
    const activityMultiplier = parseFloat(document.getElementById('activity-multiplier').value);
    const randomProb = parseFloat(document.getElementById('random-prob').value);
    const randomAmount = parseFloat(document.getElementById('random-amount').value);


    function simulateAirdrop(strategy, users, currentTime) {
      let airdropSupply = 0;
      if (strategy === 'equal') {
        const amountPerUser = equalAmount;
        users.forEach(user => {
          user.tokens += amountPerUser;
        });
        airdropSupply = numUsers * equalAmount;
      } else if (strategy === 'proportional') {
        // Simulate activity as a random number for demonstration.
        // In a real scenario, this would be based on actual user activity.
        let totalActivity = 0;
        users.forEach(user => {
          user.activity = Math.random() * 100; // Simulate activity
          totalActivity += user.activity;
        });
        users.forEach(user => {
          const airdropAmount = (user.activity / totalActivity) * initialSupply * activityMultiplier / 100 ; // Scale down airdrop amount
          user.tokens += airdropAmount;
          airdropSupply += airdropAmount;
        });

      } else if (strategy === 'random') {
        let randomUsersCount = 0;
        users.forEach(user => {
          if (Math.random() < randomProb) {
            user.tokens += randomAmount;
            airdropSupply += randomAmount;
            randomUsersCount++;
          }
        });
        console.log(`Random airdrop to ${randomUsersCount} users`);
      }
      return airdropSupply;
    }


    function simulateMarket(users, currentPrice, currentSupply) {
      let priceChangeFactor = 1;
      let supplyChange = 0;

      let sellingPressure = 0;
      let buyingPressure = 0;

      users.forEach(user => {
        if (user.type === 'hodler') {
          if (Math.random() > hodlerHodlProb) {
            sellingPressure += user.tokens * 0.01; // Hodlers might sell a small fraction occasionally
            user.tokens *= 0.99;
            supplyChange -= user.tokens * 0.01;
          }
        } else if (user.type === 'trader') {
          if (Math.random() < traderTradeFreq) {
            if (Math.random() < 0.5) {
              buyingPressure += currentPrice * 0.005; // Traders buy
            } else {
              sellingPressure += user.tokens * 0.005; // Traders sell
              user.tokens *= 0.995;
              supplyChange -= user.tokens * 0.005;
            }
          }
        } else if (user.type === 'dumper') {
          if (user.tokens > 0 && Math.random() < dumperDumpProb) {
            sellingPressure += user.tokens * dumperDumpProb; // Dumpers sell a significant portion
            supplyChange -= user.tokens * dumperDumpProb;
            user.tokens *= (1-dumperDumpProb);
          }
        }
      });

      priceChangeFactor = 1 + (buyingPressure - sellingPressure) / currentSupply;
      if (priceChangeFactor < 0.5) priceChangeFactor = 0.5; // Prevent price from crashing too hard in one step.
      if (priceChangeFactor > 2) priceChangeFactor = 2; // Prevent price from pumping too hard in one step.


      return priceChangeFactor;
    }


    function runSimulation(strategy) {
      let currentPrice = initialPrice;
      let currentSupply = initialSupply;
      let priceHistory = [currentPrice];
      let supplyHistory = [currentSupply];

      // Initialize users
      let users = [];
      for (let i = 0; i < numUsers; i++) {
        let userType;
        const rand = Math.random();
        if (rand < hodlerRatio) {
          userType = 'hodler';
        } else if (rand < hodlerRatio + traderRatio) {
          userType = 'trader';
        } else {
          userType = 'dumper';
        }
        users.push({ type: userType, tokens: 0, activity: 0 }); // Initialize users with 0 tokens
      }


      for (let timeStep = 1; timeStep <= maxTime; timeStep++) {
        const airdropSupply = simulateAirdrop(strategy, users, timeStep);
        currentSupply += airdropSupply;

        const priceChangeFactor = simulateMarket(users, currentPrice, currentSupply);
        currentPrice *= priceChangeFactor;


        priceHistory.push(currentPrice);
        supplyHistory.push(currentSupply);
      }
      return { priceHistory, supplyHistory };
    }


    const simulationResults = runSimulation(airdropStrategy);
    const priceData = simulationResults.priceHistory;
    const supplyData = simulationResults.supplyHistory;

    if (priceChartInstance) {
      priceChartInstance.destroy();
    }
    if (supplyChartInstance) {
      supplyChartInstance.destroy();
    }


    const priceCtx = document.getElementById('price-chart').getContext('2d');
    priceChartInstance = new Chart(priceCtx, {
      type: 'line',
      data: {
        labels: Array.from({ length: maxTime + 1 }, (_, i) => i),
        datasets: [{
          label: 'Token Price ($P_t$)',
          data: priceData,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: false
          }
        }
      }
    });

    const supplyCtx = document.getElementById('supply-chart').getContext('2d');
    supplyChartInstance = new Chart(supplyCtx, {
      type: 'line',
      data: {
        labels: Array.from({ length: maxTime + 1 }, (_, i) => i),
        datasets: [{
          label: 'Token Supply ($S_t$)',
          data: supplyData,
          borderColor: 'rgb(255, 99, 132)',
          tension: 0.1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: false
          }
        }
      }
    });

    resultsDiv.style.display = 'block';
    comparisonDiv.style.display = 'none'; // For future strategy comparison
  });
});