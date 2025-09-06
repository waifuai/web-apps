class BondingCurve {
  static calculatePrice(supply, basePrice, curveType = 'linear') {
    if (curveType === 'linear') {
      return basePrice * (supply / 1000 + 1);
    }
    return basePrice * Math.pow(1.1, supply / 100);
  }
}

class MockMCPServer {
  constructor() {
    this.balances = new Map([['SOL', 0]]);
    this.quotes = new Map([['SOL-USDT', 150], ['USDT-SOL', 1 / 150]]);
    this.icos = new Map();
  }

  handleCommand(command) {
    const [cmd, ...args] = command.split(' ');
    try {
      switch (cmd.toLowerCase()) {
        case 'create_token':
          this.balances.set(args[0], 0);
          return `Created token ${args[0]}`;
        case 'barter':
          return this.executeBarter(args[0], args[1], parseFloat(args[2]));
        case 'deposit':
          return this.deposit(args[0], parseFloat(args[1]));
        case 'withdraw':
          return this.withdraw(args[0], parseFloat(args[1]));
        case 'quote':
          return this.getQuote(args[0], args[1], parseFloat(args[2]));
        case 'swap':
          return this.swap(args[0], args[1], parseFloat(args[2]), parseFloat(args[3]));
        case 'balance':
          return this.balances.get(args[0]).toFixed(2);
        case 'set_quote':
          return this.setQuote(args[0], args[1], parseFloat(args[2]));
        default:
          throw new Error('Invalid command');
      }
    } catch (e) {
      return `Error: ${e.message}`;
    }
  }

  deposit(token, amount) {
    this.balances.set(token, (this.balances.get(token) || 0) + amount);
    return `Deposited ${amount} ${token}`;
  }

  withdraw(token, amount) {
    if ((this.balances.get(token) || 0) < amount) throw new Error('Insufficient balance');
    this.balances.set(token, this.balances.get(token) - amount);
    return `Withdrew ${amount} ${token}`;
  }

  getQuote(fromToken, toToken, amount) {
    const pair = `${fromToken}-${toToken}`;
    const rate = this.quotes.get(pair) || 0;
    return `${amount} ${fromToken} = ${(amount * rate).toFixed(2)} ${toToken} @ ${rate.toFixed(2)}`;
  }

  swap(fromToken, toToken, amount, leverage) {
    const rate = this.quotes.get(`${fromToken}-${toToken}`);
    if (!rate) throw new Error('No quote available');
    if ((this.balances.get(fromToken) || 0) < amount) throw new Error('Insufficient balance');

    this.balances.set(fromToken, this.balances.get(fromToken) - amount);
    const received = amount * rate * leverage;
    this.balances.set(toToken, (this.balances.get(toToken) || 0) + received);

    return `Swapped ${amount} ${fromToken} for ${received.toFixed(2)} ${toToken} with ${leverage}x leverage`;
  }

  setQuote(fromToken, toToken, price) {
    this.quotes.set(`${fromToken}-${toToken}`, price);
    this.quotes.set(`${toToken}-${fromToken}`, 1 / price);
    return `Set ${fromToken}-${toToken} rate to ${price}`;
  }

  executeBarter(fromToken, toToken, amount) {
    if (!this.icos.has(toToken)) throw new Error('Recipient ICO not found');
    if ((this.balances.get(fromToken) || 0) < amount) throw new Error('Insufficient balance');

    const ico = this.icos.get(toToken);
    const price = BondingCurve.calculatePrice(ico.supply, ico.basePrice, ico.curveType);
    const received = amount / price;

    this.balances.set(fromToken, this.balances.get(fromToken) - amount);
    this.balances.set(toToken, (this.balances.get(toToken) || 0) + received);
    ico.supply += received;

    return `Bartered ${amount} ${fromToken} for ${received.toFixed(2)} ${toToken}`;
  }
}

class SolanaDex {
  constructor() {
    this.mcpServer = new MockMCPServer();
  }

  logTransaction(message) {
    const log = document.getElementById('transactionLog');
    if (!log) return;
    const entry = document.createElement('div');
    entry.className = 'transaction-entry';
    entry.innerHTML = `
      <span class="timestamp">${new Date().toLocaleTimeString()}</span>
      <span class="message">${message}</span>
    `;
    log.prepend(entry);
  }

  async handleQuote(event) {
    event.preventDefault();
    const fromToken = document.getElementById('fromToken').value;
    const toToken = document.getElementById('toToken').value;
    const amount = parseFloat(document.getElementById('quoteAmount').value);

    const result = this.mcpServer.handleCommand(`quote ${fromToken} ${toToken} ${amount}`);
    document.getElementById('quoteResult').textContent = result;
    this.logTransaction(`Quote request: ${result}`);
  }

  async handleSwap(event) {
    event.preventDefault();
    const fromToken = document.getElementById('swapFrom').value;
    const toToken = document.getElementById('swapTo').value;
    const amount = parseFloat(document.getElementById('swapAmount').value);
    const leverage = document.getElementById('leverage').value;

    try {
      const result = this.mcpServer.handleCommand(`swap ${fromToken} ${toToken} ${amount} ${leverage}`);
      this.logTransaction(result);
    } catch (e) {
      this.logTransaction(`Swap failed: ${e.message}`);
    }
  }
}

class TokenizedEconomy extends SolanaDex {
  constructor() {
    super();
    this.activeICOs = [];
    this.tokenRegistry = new Map();
    this.chart = null;
  }

  initializeCharts() {
    const canvas = document.getElementById('curveChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    this.chart = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: []
      },
      options: {
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                const x = context.raw.x;
                const y = context.raw.y;
                return `Supply: ${x}, Price: ${y} SOL`;
              }
            }
          }
        },
        scales: {
          x: {
            type: 'linear',
            position: 'bottom',
            title: { display: true, text: 'Supply' }
          },
          y: {
            title: { display: true, text: 'Price (SOL)' }
          }
        }
      }
    });
    this.updateBondingCurveChart();
  }

  updateBondingCurveChart() {
    if (this.chart) {
      if (this.activeICOs.length > 0) {
        let datasets = [];
        this.activeICOs.forEach(ico => {
          let dataPoints = [];
          let steps = 10;
          for (let i = 0; i <= steps; i++) {
            let supply = (ico.totalSupply / steps) * i;
            let price = BondingCurve.calculatePrice(supply, ico.basePrice, ico.curveType);
            dataPoints.push({ x: supply, y: parseFloat(price.toFixed(2)) });
          }
          datasets.push({
            label: `${ico.name} Bonding Curve`,
            data: dataPoints,
            borderColor: ico.color,
            backgroundColor: ico.color,
            showLine: true,
            tension: 0.4,
          });
        });
        this.chart.data.datasets = datasets;
      } else {
        // No ICOs, show a default sample curve
        this.chart.data.datasets = [{
          label: 'Bonding Curve',
          data: Array.from({ length: 10 }, (_, i) => ({ x: i * 100, y: Number((Math.random() * 100).toFixed(2)) })),
          borderColor: 'var(--primary)',
          backgroundColor: 'var(--primary)',
          showLine: true,
          tension: 0.4,
        }];
      }
      this.chart.update();
    }
  }

  createICOCard(ico) {
    const card = document.createElement('div');
    card.className = 'ico-card';
    card.innerHTML = `
      <h3>${ico.name}</h3>
      <div class="ico-progress">
        <div class="ico-progress-bar" style="width: ${(ico.totalSupply > 0 ? (ico.supply / ico.totalSupply) * 100 : 0)}%"></div>
      </div>
      <div class="curve-controls">
        <div>
          <label>Current Price: ${ico.currentPrice.toFixed(2)} SOL</label>
          <input type="range" min="1" max="1000" value="${ico.supply}" disabled>
        </div>
        <div>
          <input type="number" placeholder="Buy amount" class="ico-amount">
          <button class="buy-token" data-ico="${ico.name}">Invest</button>
        </div>
      </div>
      <canvas class="ico-chart"></canvas>
    `;
    const investBtn = card.querySelector('.buy-token');
    if (investBtn) {
      investBtn.addEventListener('click', () => {
        const input = card.querySelector('.ico-amount');
        const investAmount = parseFloat(input.value);
        if (isNaN(investAmount) || investAmount <= 0) {
          this.logTransaction('Invalid invest amount');
          return;
        }
        const result = this.mcpServer.handleCommand(`barter SOL ${ico.name} ${investAmount}`);
        this.logTransaction(result);
        this.updateTokenPortfolio();
      });
    }
    return card;
  }

  updateTokenPortfolio() {
    const portfolio = document.getElementById('tokenPortfolio');
    if (!portfolio) return;
    portfolio.innerHTML = '';
    this.mcpServer.balances.forEach((balance, token) => {
      if (token === 'SOL' || !this.tokenRegistry.has(token)) return;
      const tokenInfo = this.tokenRegistry.get(token);
      if (!tokenInfo) return;
      const element = document.createElement('div');
      element.className = 'token-chip';
      element.innerHTML = `
        <span class="logo" style="background: ${tokenInfo.color}">${token[0]}</span>
        ${balance.toFixed(2)} ${token}
      `;
      portfolio.appendChild(element);
    });
  }

  async handleICOCreation(event) {
    event.preventDefault();
    const name = document.getElementById('icoName').value;
    const totalSupply = parseInt(document.getElementById('totalSupply').value);
    const curveType = document.getElementById('curveType').value;
    const basePrice = parseFloat(document.getElementById('basePrice').value);

    const newICO = {
      name,
      totalSupply,
      curveType,
      basePrice,
      supply: 0,
      currentPrice: BondingCurve.calculatePrice(0, basePrice, curveType),
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`
    };

    this.activeICOs.push(newICO);
    this.tokenRegistry.set(name, newICO);
    this.mcpServer.icos.set(name, newICO);
    this.mcpServer.handleCommand(`create_token ${name}`);

    const icoList = document.querySelector('#icoMarketplace .ico-list');
    if (icoList) {
      icoList.appendChild(this.createICOCard(newICO));
    }
    
    this.logTransaction(`Launched new ICO: ${name}`);
    this.updateTokenSelectors();
    this.updateBondingCurveChart();
  }

  updateTokenSelectors() {
    const selectors = document.querySelectorAll('#barterFrom, #barterTo');
    selectors.forEach(select => {
      const currentValue = select.value;
      select.innerHTML = this.activeICOs
        .map(ico => `<option value="${ico.name}" ${ico.name === currentValue ? 'selected' : ''}>${ico.name}</option>`)
        .join('');
    });
  }

  async handleBarter(event) {
    event.preventDefault();
    const fromToken = document.getElementById('barterFrom').value;
    const toToken = document.getElementById('barterTo').value;
    const amount = parseFloat(document.getElementById('barterAmount').value);

    try {
      const result = this.mcpServer.handleCommand(`barter ${fromToken} ${toToken} ${amount}`);
      this.updateTokenPortfolio();
      this.logTransaction(result);
      document.getElementById('barterResult').textContent = result;
    } catch (e) {
      this.logTransaction(`Barter failed: ${e.message}`);
    }
  }

  resetSimulation() {
    this.mcpServer = new MockMCPServer();
    this.activeICOs = [];
    this.tokenRegistry.clear();
    this.mcpServer.handleCommand('deposit SOL 1000');
    this.mcpServer.handleCommand('set_quote SOL USDT 150');

    const icoList = document.querySelector('#icoMarketplace .ico-list');
    if (icoList) icoList.innerHTML = '';
    const portfolio = document.getElementById('tokenPortfolio');
    if (portfolio) portfolio.innerHTML = '';
    const transactionLog = document.getElementById('transactionLog');
    if (transactionLog) transactionLog.innerHTML = '';
    this.updateTokenSelectors();
    this.updateTokenPortfolio();

    if (this.chart) {
      this.chart.destroy();
      this.initializeCharts();
    }

    this.logTransaction('System reset to initial state');
  }

  generateRandomData() {
    const icoNames = ['Web3AI', 'DeFi Nexus', 'CryptoCraft', 'ChainForge', 'QuantumLedger'];
    for (let i = 0; i < 3; i++) {
      const icoName = icoNames[Math.floor(Math.random() * icoNames.length)];
      const totalSupply = Math.floor(Math.random() * 10000) + 5000;
      const curveType = Math.random() > 0.5 ? 'linear' : 'exponential';
      const basePrice = Math.random() * 10 + 0.5;
      const ico = {
        name: icoName,
        totalSupply,
        curveType,
        basePrice,
        supply: 0,
        currentPrice: BondingCurve.calculatePrice(0, basePrice, curveType),
        color: `hsl(${Math.random() * 360}, 70%, 50%)`
      };

      this.activeICOs.push(ico);
      this.tokenRegistry.set(ico.name, ico);
      this.mcpServer.icos.set(ico.name, ico);
      this.mcpServer.handleCommand(`create_token ${ico.name}`);
      const icoList = document.querySelector('#icoMarketplace .ico-list');
      if (icoList) {
        icoList.appendChild(this.createICOCard(ico));
      }
    }

    const actions = ['deposit', 'barter', 'swap'];
    for (let i = 0; i < 5; i++) {
      const action = actions[Math.floor(Math.random() * actions.length)];
      try {
        switch (action) {
          case 'deposit':
            this.mcpServer.handleCommand(`deposit SOL ${Math.floor(Math.random() * 500) + 100}`);
            break;
          case 'barter':
            if (this.activeICOs.length === 0) break;
            const ico = this.activeICOs[Math.floor(Math.random() * this.activeICOs.length)];
            this.mcpServer.handleCommand(`barter SOL ${ico.name} ${Math.random() * 100}`);
            break;
          case 'swap':
            this.mcpServer.handleCommand(`swap SOL USDT ${Math.random() * 50} 1`);
            break;
        }
      } catch (e) {
        // Ignore errors in random data generation
      }
    }

    this.updateTokenSelectors();
    this.updateTokenPortfolio();
    this.logTransaction('Generated random economic activity');
    this.updateBondingCurveChart();
  }

  executeAutonomousBarter() {
    if (this.activeICOs.length === 0) {
      this.logTransaction("No active ICOs available for autonomous barter. Launching an ICO automatically.");
      this.executeAutonomousICO();
      return;
    }
    const ico = this.activeICOs[Math.floor(Math.random() * this.activeICOs.length)];
    let investAmount = parseFloat((Math.random() * 20 + 1).toFixed(2));
    const solBalance = parseFloat(this.mcpServer.balances.get('SOL') || 0);
    if (solBalance < investAmount) investAmount = solBalance;
    if (investAmount <= 0) {
      this.logTransaction("Insufficient SOL balance for trading.");
      return;
    }
    try {
      const result = this.mcpServer.handleCommand(`barter SOL ${ico.name} ${investAmount}`);
      this.logTransaction("Autonomous Barter: " + result);
    } catch (error) {
      this.logTransaction("Autonomous Barter Error: " + error.message);
    }
    this.updateTokenPortfolio();
    this.updateBondingCurveChart();
  }

  executeAutonomousICO() {
    const icoNames = ['QuantumTrade', 'BlockInnovate', 'CryptoVentures', 'TokenNext', 'FutureChain'];
    let name = icoNames[Math.floor(Math.random() * icoNames.length)] + '-' + Math.floor(Math.random() * 1000);
    let totalSupply = Math.floor(Math.random() * 10000) + 5000;
    let curveType = Math.random() > 0.5 ? 'linear' : 'exponential';
    let basePrice = parseFloat((Math.random() * 10 + 0.5).toFixed(2));
    const newICO = {
      name,
      totalSupply,
      curveType,
      basePrice,
      supply: 0,
      currentPrice: BondingCurve.calculatePrice(0, basePrice, curveType),
      color: `hsl(${Math.random() * 360}, 70%, 50%)`
    };

    this.activeICOs.push(newICO);
    this.tokenRegistry.set(name, newICO);
    this.mcpServer.icos.set(name, newICO);
    this.mcpServer.handleCommand(`create_token ${name}`);

    const icoList = document.querySelector('#icoMarketplace .ico-list');
    if (icoList) {
      icoList.appendChild(this.createICOCard(newICO));
    }
    
    this.logTransaction(`Launched Autonomous ICO: ${name}`);
    this.updateTokenSelectors();
    this.updateBondingCurveChart();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const economy = new TokenizedEconomy();
  economy.initializeCharts();

  const icoForm = document.getElementById('icoForm');
  if (icoForm) {
    icoForm.addEventListener('submit', (e) => economy.handleICOCreation(e));
  }
  const barterForm = document.getElementById('barterForm');
  if (barterForm) {
    barterForm.addEventListener('submit', (e) => economy.handleBarter(e));
  }
  const randomDataBtn = document.getElementById('randomDataBtn');
  if (randomDataBtn) {
    randomDataBtn.addEventListener('click', () => economy.generateRandomData());
  }
  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => economy.resetSimulation());
  }
  const autoBarterBtn = document.getElementById('autoBarterModeBtn');
  let autoBarterInterval = null;
  if (autoBarterBtn) {
    autoBarterBtn.addEventListener('click', () => {
      if (!autoBarterInterval) {
        autoBarterBtn.textContent = "Stop Autonomous Barter Mode";
        autoBarterInterval = setInterval(() => {
          economy.executeAutonomousBarter();
        }, 3000);
      } else {
        clearInterval(autoBarterInterval);
        autoBarterInterval = null;
        autoBarterBtn.textContent = "Start Autonomous Barter Mode";
      }
    });
  }
  const autoIcoBtn = document.getElementById('autoIcoModeBtn');
  let autoIcoInterval = null;
  if (autoIcoBtn) {
    autoIcoBtn.addEventListener('click', () => {
      if (!autoIcoInterval) {
        autoIcoBtn.textContent = "Stop Autonomous ICO Mode";
        autoIcoInterval = setInterval(() => {
          economy.executeAutonomousICO();
        }, 5000);
      } else {
        clearInterval(autoIcoInterval);
        autoIcoInterval = null;
        autoIcoBtn.textContent = "Start Autonomous ICO Mode";
      }
    });
  }

  economy.mcpServer.handleCommand('deposit SOL 1000');
  economy.mcpServer.handleCommand('set_quote SOL USDT 150');
  economy.updateTokenPortfolio();
  economy.updateTokenSelectors();

  setInterval(() => {
    economy.updateBondingCurveChart();
  }, 3000);
});