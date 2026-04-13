document.addEventListener('DOMContentLoaded', function() {
  // Initialize the dashboard
  initializeNavigation();
  initializeDashboard();
  initializeTokensPage();
  initializeReportsPage();
  setupCharts();
});

// Navigation functionality
function initializeNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  const tabContents = document.querySelectorAll('.tab-content');
  
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Remove active class from all links and contents
      navLinks.forEach(navLink => navLink.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked link
      this.classList.add('active');
      
      // Show corresponding content
      const targetId = this.getAttribute('href').substring(1);
      document.getElementById(`${targetId}-content`).classList.add('active');
    });
  });

  // Wallet connection button
  const connectWalletBtn = document.getElementById('connectWalletBtn');
  connectWalletBtn.addEventListener('click', function() {
    this.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Connected';
    this.classList.remove('bg-teal-500', 'hover:bg-teal-600');
    this.classList.add('bg-green-600', 'hover:bg-green-700');

    // Show notification
    showNotification('Wallet connected successfully!', 'success');
  });
}

// Dashboard initialization
function initializeDashboard() {
  populateTopTokensTable();
  populateRecentActivities();
}

// Initialize Tokens Page
function initializeTokensPage() {
  // Sample token data
  const tokens = [
    { 
      name: 'Solana', 
      symbol: 'SOL', 
      icon: 'https://cryptologos.cc/logos/solana-sol-logo.svg?v=025', 
      price: 102.43, 
      change: 5.2, 
      commission: 12, 
      conversions: 42, 
      status: 'active' 
    },
    { 
      name: 'Raydium', 
      symbol: 'RAY', 
      icon: 'https://cryptologos.cc/logos/raydium-ray-logo.svg?v=025', 
      price: 0.385, 
      change: -2.1, 
      commission: 10, 
      conversions: 28, 
      status: 'active' 
    },
    { 
      name: 'Serum', 
      symbol: 'SRM', 
      icon: 'https://cryptologos.cc/logos/serum-srm-logo.svg?v=025', 
      price: 0.042, 
      change: 1.8, 
      commission: 15, 
      conversions: 18, 
      status: 'active' 
    },
    { 
      name: 'Bonk', 
      symbol: 'BONK', 
      icon: 'https://cryptologos.cc/logos/bonk-bonk-logo.svg?v=025', 
      price: 0.00000259, 
      change: 12.5, 
      commission: 18, 
      conversions: 110, 
      status: 'active' 
    },
    { 
      name: 'Jupiter', 
      symbol: 'JUP', 
      icon: 'https://cryptologos.cc/logos/jupiter-jup-logo.svg?v=025', 
      price: 1.28, 
      change: 3.7, 
      commission: 8, 
      conversions: 31, 
      status: 'active' 
    },
    { 
      name: 'Orca', 
      symbol: 'ORCA', 
      icon: 'https://cryptologos.cc/logos/orca-orca-logo.svg?v=025', 
      price: 0.82, 
      change: -1.3, 
      commission: 10, 
      conversions: 15, 
      status: 'inactive' 
    }
  ];

  const tokensGrid = document.getElementById('tokensGrid');
  if (!tokensGrid) return;

  tokens.forEach(token => {
    const card = document.createElement('div');
    card.className = 'card rounded-lg p-6';
    
    card.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <div class="flex items-center">
          <img src="${token.icon}" alt="${token.symbol}" class="w-10 h-10 mr-3">
          <div>
            <h3 class="text-xl font-bold">${token.name}</h3>
            <span class="text-sm text-gray-400">${token.symbol}</span>
          </div>
        </div>
        <div class="flex items-center">
          <span class="status-indicator status-${token.status}"></span>
          <span class="text-sm">${token.status.charAt(0).toUpperCase() + token.status.slice(1)}</span>
        </div>
      </div>
      
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p class="text-sm text-gray-400">Current Price</p>
          <p class="text-lg font-bold">$${token.price.toFixed(token.price < 0.01 ? 8 : 2)}</p>
          <span class="text-sm ${token.change >= 0 ? 'text-green-500' : 'text-red-500'}">
            ${token.change >= 0 ? '↑' : '↓'} ${Math.abs(token.change)}%
          </span>
        </div>
        <div>
          <p class="text-sm text-gray-400">Conversions</p>
          <p class="text-lg font-bold">${token.conversions}</p>
          <span class="text-sm text-gray-400">This month</span>
        </div>
      </div>

      <div class="mb-4">
        <label class="block text-sm font-medium mb-2">
          Commission Rate: <span class="commission-value">${token.commission}%</span>
        </label>
        <input type="range" class="commission-slider w-full" min="5" max="20" value="${token.commission}"
               data-token="${token.symbol}">
        <div class="flex justify-between text-xs text-gray-400">
          <span>5%</span>
          <span>10%</span>
          <span>15%</span>
          <span>20%</span>
        </div>
      </div>

      <div class="flex space-x-2">
        <button class="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-medium py-2 px-4 rounded transition duration-300 text-sm">
          <i class="fas fa-link mr-1"></i> Generate Link
        </button>
        <button class="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded transition duration-300">
          <i class="fas fa-ellipsis-v"></i>
        </button>
      </div>
    `;

    tokensGrid.appendChild(card);

    // Add commission slider functionality
    const slider = card.querySelector('.commission-slider');
    const valueDisplay = card.querySelector('.commission-value');
    
    slider.addEventListener('input', (e) => {
      valueDisplay.textContent = `${e.target.value}%`;
    });

    slider.addEventListener('change', (e) => {
      showNotification(`Commission rate for ${token.symbol} updated to ${e.target.value}%`, 'success');
      
      // In a real app, you'd send this to your backend
      console.log(`Updated ${token.symbol} commission to ${e.target.value}%`);
    });
  });

  // Add button functionality for generating referral links
  const generateButtons = document.querySelectorAll('#tokensGrid button:not(:last-child)');
  generateButtons.forEach(button => {
    button.addEventListener('click', function() {
      const card = this.closest('.card');
      const tokenSymbol = card.querySelector('.commission-slider').getAttribute('data-token');
      const commission = card.querySelector('.commission-value').textContent;
      
      generateReferralLink(tokenSymbol, commission);
    });
  });
}

function generateReferralLink(token, commission) {
  const referralId = Math.random().toString(36).substring(2, 15);
  const referralLink = `https://tokenaffiliates.com/ref/${referralId}?token=${token}&commission=${commission}`;
  
  // Create a modal to display the link
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="absolute inset-0 bg-black bg-opacity-50" id="modal-overlay"></div>
    <div class="bg-gray-800 rounded-lg p-6 max-w-md w-full relative z-10">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold">Referral Link Generated</h3>
        <button id="close-modal" class="text-gray-400 hover:text-white">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <p class="mb-3">Share this unique referral link to earn ${commission} commission on ${token} sales:</p>
      <div class="bg-gray-900 p-3 rounded-lg mb-4 break-all">
        <code>${referralLink}</code>
      </div>
      <div class="flex justify-between">
        <button id="copy-link" class="bg-teal-500 hover:bg-teal-600 text-white font-medium py-2 px-4 rounded transition duration-300">
          <i class="fas fa-copy mr-1"></i> Copy Link
        </button>
        <div class="flex space-x-2">
          <button class="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full transition duration-300">
            <i class="fab fa-twitter"></i>
          </button>
          <button class="bg-indigo-500 hover:bg-indigo-600 text-white p-2 rounded-full transition duration-300">
            <i class="fab fa-discord"></i>
          </button>
          <button class="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full transition duration-300">
            <i class="fab fa-telegram"></i>
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Add event listeners
  document.getElementById('modal-overlay').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  document.getElementById('close-modal').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  document.getElementById('copy-link').addEventListener('click', () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      showNotification('Referral link copied to clipboard!', 'success');
    });
  });
}

function setupCharts() {
  // Performance Chart
  const ctx = document.getElementById('performanceChart');
  if (!ctx) return;

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Jan 1', 'Jan 5', 'Jan 10', 'Jan 15', 'Jan 20', 'Jan 25', 'Jan 30'],
      datasets: [
        {
          label: 'Commission Earnings (SOL)',
          data: [12, 19, 15, 25, 22, 30, 35],
          borderColor: '#4fd1c5',
          backgroundColor: 'rgba(79, 209, 197, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Referral Traffic',
          data: [50, 65, 60, 95, 80, 110, 130],
          borderColor: '#9f7aea',
          backgroundColor: 'rgba(159, 122, 234, 0.0)',
          tension: 0.4,
          fill: false,
          borderDash: [5, 5]
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#fff',
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(26, 32, 44, 0.9)',
          titleColor: '#fff',
          bodyColor: '#e2e8f0',
          borderColor: 'rgba(79, 209, 197, 0.3)',
          borderWidth: 1
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: '#fff'
          },
          grid: {
            color: 'rgba(255,255,255,0.1)'
          }
        },
        x: {
          ticks: {
            color: '#fff'
          },
          grid: {
            color: 'rgba(255,255,255,0.1)'
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'nearest'
      }
    }
  });

  // Chart timeframe change handler
  const chartTimeframe = document.getElementById('chartTimeframe');
  if (chartTimeframe) {
    chartTimeframe.addEventListener('change', function() {
      // In a real app, you'd fetch data based on the selected timeframe
      // For demo purposes, we'll just show a notification
      showNotification(`Chart updated to show data for ${this.options[this.selectedIndex].text}`, 'info');
      
      // Update chart with random data to simulate change
      chart.data.datasets[0].data = Array.from({length: 7}, () => Math.floor(Math.random() * 40) + 10);
      chart.data.datasets[1].data = Array.from({length: 7}, () => Math.floor(Math.random() * 100) + 50);
      chart.update();
    });
  }
}

function populateTopTokensTable() {
  const table = document.getElementById('topTokensTable');
  if (!table) return;

  const tokenData = [
    {
      name: 'Solana',
      symbol: 'SOL',
      price: 102.43,
      conversions: 42,
      earnings: 1458.21,
      commission: 12,
      change: 5.2
    },
    {
      name: 'Bonk',
      symbol: 'BONK',
      price: 0.00000259,
      conversions: 110,
      earnings: 892.64,
      commission: 18,
      change: 12.5
    },
    {
      name: 'Jupiter',
      symbol: 'JUP',
      price: 1.28,
      conversions: 31,
      earnings: 524.87,
      commission: 8,
      change: 3.7
    },
    {
      name: 'Raydium',
      symbol: 'RAY',
      price: 0.385,
      conversions: 28,
      earnings: 352.16,
      commission: 10,
      change: -2.1
    },
    {
      name: 'Serum',
      symbol: 'SRM',
      price: 0.042,
      conversions: 18,
      earnings: 186.32,
      commission: 15,
      change: 1.8
    }
  ];

  tokenData.forEach(token => {
    const row = document.createElement('tr');
    row.className = 'border-b border-gray-700';
    
    row.innerHTML = `
      <td class="py-3">
        <div class="flex items-center">
          <div class="mr-3 bg-gray-700 rounded-full w-8 h-8 flex items-center justify-center">
            ${token.symbol.charAt(0)}
          </div>
          <div>
            <div class="font-medium">${token.name}</div>
            <div class="text-sm text-gray-400">${token.symbol}</div>
          </div>
        </div>
      </td>
      <td class="py-3">$${token.price.toFixed(token.price < 0.01 ? 8 : 2)}</td>
      <td class="py-3">${token.conversions}</td>
      <td class="py-3">${token.earnings.toFixed(2)} SOL</td>
      <td class="py-3">${token.commission}%</td>
      <td class="py-3">
        <span class="${token.change >= 0 ? 'text-green-500' : 'text-red-500'}">
          ${token.change >= 0 ? '↑' : '↓'} ${Math.abs(token.change)}%
        </span>
      </td>
      <td class="py-3">
        <button class="bg-gray-700 hover:bg-gray-600 text-white p-1 rounded transition duration-300" 
                title="Generate Referral Link">
          <i class="fas fa-link"></i>
        </button>
      </td>
    `;
    
    table.appendChild(row);
  });

  // Add event listeners to the generate link buttons
  const generateButtons = table.querySelectorAll('button');
  generateButtons.forEach((button, index) => {
    button.addEventListener('click', function() {
      const token = tokenData[index];
      generateReferralLink(token.symbol, `${token.commission}%`);
    });
  });
}

function populateRecentActivities() {
  const activities = document.getElementById('recentActivities');
  if (!activities) return;

  const activityData = [
    { 
      type: 'conversion',
      text: 'New conversion from SOL referral link',
      amount: '12.5 SOL',
      time: '35 minutes ago',
      icon: 'exchange-alt',
      iconBg: 'bg-teal-500'
    },
    { 
      type: 'payout',
      text: 'Commission payout processed',
      amount: '342.87 SOL',
      time: '2 hours ago',
      icon: 'money-bill-wave',
      iconBg: 'bg-green-500'
    },
    { 
      type: 'referral',
      text: 'New referral link created for BONK',
      amount: null,
      time: '5 hours ago',
      icon: 'link',
      iconBg: 'bg-purple-500'
    },
    { 
      type: 'rate',
      text: 'Commission rate changed for JUP',
      amount: '8% → 10%',
      time: 'Yesterday',
      icon: 'percentage',
      iconBg: 'bg-blue-500'
    }
  ];

  activityData.forEach(activity => {
    const activityItem = document.createElement('div');
    activityItem.className = 'flex items-start';
    
    activityItem.innerHTML = `
      <div class="${activity.iconBg} bg-opacity-20 p-2 rounded-full mr-4">
        <i class="fas fa-${activity.icon} text-${activity.iconBg.replace('bg-', '')}"></i>
      </div>
      <div class="flex-1">
        <div class="flex justify-between">
          <p class="font-medium">${activity.text}</p>
          <span class="text-gray-400 text-sm">${activity.time}</span>
        </div>
        ${activity.amount ? `<p class="text-sm text-gray-300">${activity.amount}</p>` : ''}
      </div>
    `;
    
    activities.appendChild(activityItem);
  });
}

function initializeReportsPage() {
  const savedReportsTable = document.getElementById('savedReportsTable');
  if (!savedReportsTable) return;
  
  const reportsData = [
    {
      name: 'January Commission Summary',
      type: 'Commission Summary',
      dateRange: 'Jan 1 - Jan 31, 2024',
      created: 'Feb 1, 2024'
    },
    {
      name: 'Q4 Performance Review',
      type: 'Performance Analytics',
      dateRange: 'Oct 1 - Dec 31, 2023',
      created: 'Jan 5, 2024'
    },
    {
      name: 'SOL Token Conversion Analysis',
      type: 'Conversion Rates',
      dateRange: 'Last 90 Days',
      created: 'Jan 15, 2024'
    }
  ];
  
  reportsData.forEach(report => {
    const row = document.createElement('tr');
    row.className = 'border-b border-gray-700';
    
    row.innerHTML = `
      <td class="py-3">
        <div class="font-medium">${report.name}</div>
      </td>
      <td class="py-3">${report.type}</td>
      <td class="py-3">${report.dateRange}</td>
      <td class="py-3">${report.created}</td>
      <td class="py-3">
        <div class="flex space-x-2">
          <button class="bg-teal-500 hover:bg-teal-600 text-white p-1 rounded transition duration-300" 
                  title="Download Report">
            <i class="fas fa-download"></i>
          </button>
          <button class="bg-gray-700 hover:bg-gray-600 text-white p-1 rounded transition duration-300" 
                  title="View Report">
            <i class="fas fa-eye"></i>
          </button>
          <button class="bg-gray-700 hover:bg-gray-600 text-white p-1 rounded transition duration-300" 
                  title="Delete Report">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    `;
    
    savedReportsTable.appendChild(row);
  });
}

// Helper function to show notifications
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `fixed bottom-4 right-4 bg-gray-800 text-white py-2 px-4 rounded-lg shadow-lg flex items-center z-50 notification-${type}`;
  
  let icon = 'info-circle';
  if (type === 'success') icon = 'check-circle';
  if (type === 'error') icon = 'exclamation-circle';
  if (type === 'warning') icon = 'exclamation-triangle';
  
  notification.innerHTML = `
    <i class="fas fa-${icon} mr-2 ${type === 'success' ? 'text-green-500' : type === 'error' ? 'text-red-500' : type === 'warning' ? 'text-yellow-500' : 'text-blue-500'}"></i>
    <span>${message}</span>
  `;
  
  document.body.appendChild(notification);
  
  // Remove notification after 3 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(20px)';
    notification.style.transition = 'opacity 0.5s, transform 0.5s';
    
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 500);
  }, 3000);
}