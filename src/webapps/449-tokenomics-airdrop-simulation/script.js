document.addEventListener('DOMContentLoaded', () => {
  const runSimulationButton = document.getElementById('run-simulation');
  const airdropStrategySelect = document.getElementById('airdrop-strategy');
  const equalParamsDiv = document.getElementById('equal-params');
  const proportionalParamsDiv = document.getElementById('proportional-params');
  const randomParamsDiv = document.getElementById('random-params');
  const resultsDiv = document.getElementById('results');
  const comparisonDiv = document.getElementById('strategy-comparison');
  const comparisonTextP = document.getElementById('comparison-text');

  // Initialize Chart.js defaults for better appearance
  Chart.defaults.font.family = "'Inter', sans-serif";
  Chart.defaults.color = '#707070';
  Chart.defaults.scale.grid.color = 'rgba(200, 200, 200, 0.2)';

  let priceChartInstance = null;
  let supplyChartInstance = null;

  // Show the active strategy parameter group
  function showActiveStrategy(strategy) {
    const allParamGroups = document.querySelectorAll('.strategy-param-group');
    allParamGroups.forEach(group => {
      group.classList.remove('active');
    });

    switch(strategy) {
      case 'equal':
        equalParamsDiv.classList.add('active');
        break;
      case 'proportional':
        proportionalParamsDiv.classList.add('active');
        break;
      case 'random':
        randomParamsDiv.classList.add('active');
        break;
    }
  }

  // Update the strategy parameters div when strategy changes
  airdropStrategySelect.addEventListener('change', () => {
    const selectedStrategy = airdropStrategySelect.value;
    showActiveStrategy(selectedStrategy);
  });

  // Initialize the first view
  showActiveStrategy(airdropStrategySelect.value);

  // Add pulse animation to run button
  runSimulationButton.addEventListener('mouseover', () => {
    runSimulationButton.style.animation = 'pulse 1s infinite';
  });

  runSimulationButton.addEventListener('mouseout', () => {
    runSimulationButton.style.animation = 'none';
  });

  runSimulationButton.addEventListener('click', () => {
    // Add loading animation
    runSimulationButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Simulating...';
    runSimulationButton.disabled = true;

    // Small delay to allow the UI to update before running the simulation
    setTimeout(() => {
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
        let userDistribution = { hodler: 0, trader: 0, dumper: 0 };

        // Initialize users
        let users = [];
        for (let i = 0; i < numUsers; i++) {
          let userType;
          const rand = Math.random();
          if (rand < hodlerRatio) {
            userType = 'hodler';
            userDistribution.hodler++;
          } else if (rand < hodlerRatio + traderRatio) {
            userType = 'trader';
            userDistribution.trader++;
          } else {
            userType = 'dumper';
            userDistribution.dumper++;
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
        
        // Calculate token distribution by user type
        let tokensByType = { hodler: 0, trader: 0, dumper: 0 };
        users.forEach(user => {
          tokensByType[user.type] += user.tokens;
        });
        
        return { priceHistory, supplyHistory, tokensByType, userDistribution };
      }


      const simulationResults = runSimulation(airdropStrategy);
      const priceData = simulationResults.priceHistory;
      const supplyData = simulationResults.supplyHistory;

      // Calculate some analytics for the comparison text
      const initialPriceValue = priceData[0];
      const finalPriceValue = priceData[priceData.length - 1];
      const priceChangePercent = ((finalPriceValue - initialPriceValue) / initialPriceValue * 100).toFixed(2);
      const priceDirectionText = priceChangePercent >= 0 ? 'increased' : 'decreased';
      
      // Generate analysis text
      let analysisText = `<strong>Analysis:</strong> Using the <strong>${airdropStrategy}</strong> airdrop strategy, the token price ${priceDirectionText} by ${Math.abs(priceChangePercent)}% over ${maxTime} time steps. `;
      
      // Add distribution analysis
      analysisText += `<br><br><strong>Final token distribution:</strong><br>`;
      analysisText += `- Hodlers (${simulationResults.userDistribution.hodler} users): ${Math.round(simulationResults.tokensByType.hodler)} tokens<br>`;
      analysisText += `- Traders (${simulationResults.userDistribution.trader} users): ${Math.round(simulationResults.tokensByType.trader)} tokens<br>`;
      analysisText += `- Dumpers (${simulationResults.userDistribution.dumper} users): ${Math.round(simulationResults.tokensByType.dumper)} tokens<br>`;
      
      // Add strategy-specific insights
      if (airdropStrategy === 'equal') {
        analysisText += `<br>Equal distribution gave every user exactly ${equalAmount} tokens regardless of their behavior. `;
        if (priceChangePercent < 0) {
          analysisText += `The price decrease suggests that dumpers had a significant impact despite their smaller numbers.`;
        } else {
          analysisText += `The price increase suggests that hodlers managed to maintain token value by not selling.`;
        }
      } else if (airdropStrategy === 'proportional') {
        analysisText += `<br>Proportional distribution rewards users based on their activity levels, which can be more effective for long-term engagement. `;
        if (priceChangePercent < 0) {
          analysisText += `However, the price decrease suggests that active users may have been more likely to sell their rewards.`;
        } else {
          analysisText += `The price increase suggests that more active users were also more likely to hold their tokens.`;
        }
      } else if (airdropStrategy === 'random') {
        analysisText += `<br>Random distribution selected approximately ${Math.round(numUsers * randomProb)} users to receive ${randomAmount} tokens each. `;
        if (priceChangePercent < 0) {
          analysisText += `The price decrease suggests that many airdrop recipients may have sold their tokens quickly.`;
        } else {
          analysisText += `The price increase suggests that many randomly selected users chose to hold rather than sell.`;
        }
      }

      // Update comparison text
      comparisonTextP.innerHTML = analysisText;
      comparisonDiv.style.display = 'block';

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
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            borderWidth: 3,
            pointRadius: 2,
            pointHoverRadius: 5,
            tension: 0.3,
            fill: true
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              titleFont: {
                size: 14
              },
              bodyFont: {
                size: 13
              }
            }
          },
          scales: {
            y: {
              beginAtZero: false,
              grid: {
                display: true
              },
              ticks: {
                font: {
                  size: 12
                }
              }
            },
            x: {
              title: {
                display: true,
                text: 'Time Step',
                font: {
                  size: 13
                }
              },
              grid: {
                display: false
              }
            }
          },
          animation: {
            duration: 1500,
            easing: 'easeOutQuart'
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
            backgroundColor: 'rgba(255, 99, 132, 0.1)',
            borderWidth: 3,
            pointRadius: 2,
            pointHoverRadius: 5,
            tension: 0.3,
            fill: true
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              titleFont: {
                size: 14
              },
              bodyFont: {
                size: 13
              }
            }
          },
          scales: {
            y: {
              beginAtZero: false,
              grid: {
                display: true
              },
              ticks: {
                font: {
                  size: 12
                }
              }
            },
            x: {
              title: {
                display: true,
                text: 'Time Step',
                font: {
                  size: 13
                }
              },
              grid: {
                display: false
              }
            }
          },
          animation: {
            duration: 1500,
            easing: 'easeOutQuart'
          }
        }
      });

      // Delay showing results for a smoother animation
      setTimeout(() => {
        resultsDiv.style.display = 'block';
        // Reset button
        runSimulationButton.innerHTML = '<i class="fas fa-play"></i> Run Simulation';
        runSimulationButton.disabled = false;
        
        // Scroll to results
        resultsDiv.scrollIntoView({ behavior: 'smooth' });
      }, 1000);
    }, 500); // Small delay for UI update
  });
});