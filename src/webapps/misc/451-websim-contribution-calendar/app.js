const API_BASE = '/api/v1';

async function fetchUserContributions(username) {
  const [projectsRes, likesRes] = await Promise.all([
    fetch(`${API_BASE}/users/${username}/projects?first=100`),
    fetch(`${API_BASE}/users/${username}/likes?first=100`)
  ]);
  
  const [projects, likes] = await Promise.all([
    projectsRes.json(),
    likesRes.json()
  ]);

  return [
    ...projects.projects.data.map(p => ({
      type: 'project',
      date: p.project.created_at,
      title: p.project.title,
      url: `/p/${p.project.id}`
    })),
    ...likes.likes.data.map(l => ({
      type: 'like',
      date: l.like.created_at,
      title: l.site?.title,
      url: `/c/${l.like.site_id}`
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));
}

function generateMonthLabels() {
  const today = new Date();
  const monthLabelsContainer = document.querySelector('.month-labels');
  const months = [];
  
  for (let i = 0; i < 6; i++) {
    const date = new Date(today);
    date.setMonth(today.getMonth() - i);
    months.unshift(date);
  }
  
  // Get unique months
  const uniqueMonths = [];
  months.forEach(date => {
    const monthName = date.toLocaleString('default', { month: 'short' });
    if (!uniqueMonths.includes(monthName)) {
      uniqueMonths.push(monthName);
    }
  });
  
  // Create month labels
  uniqueMonths.forEach(month => {
    const monthLabel = document.createElement('div');
    monthLabel.className = 'month-label';
    monthLabel.textContent = month;
    monthLabelsContainer.appendChild(monthLabel);
  });
}

function generateCalendar(contributions) {
  const calendarEl = document.getElementById('calendar');
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  document.body.appendChild(tooltip);

  generateMonthLabels();

  // Create a map of contributions by date
  const contributionMap = contributions.reduce((acc, c) => {
    const date = new Date(c.date).toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth() - 6, 1);
  
  let maxContributions = 0;
  let currentStreak = 0;
  let maxDayCount = 0;
  let totalContributions = 0;
  
  // Calculate statistics 
  const dates = Object.keys(contributionMap).sort();
  let lastActiveDate = null;
  
  for (const date in contributionMap) {
    const count = contributionMap[date];
    totalContributions += count;
    
    if (count > maxDayCount) {
      maxDayCount = count;
    }
    
    const dateObj = new Date(date);
    if (dateObj <= today) {
      // Check if this date is consecutive from last active date
      if (lastActiveDate) {
        const dayDiff = Math.floor((dateObj - lastActiveDate) / (1000 * 60 * 60 * 24));
        if (dayDiff === 1) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }
      lastActiveDate = dateObj;
    }
  }
  
  // Create calendar grid cells
  for (let day = 0; day < 7; day++) {
    for (let week = 0; week < 26; week++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + (week * 7 + day));
      
      if (currentDate > today) continue;

      const cell = document.createElement('div');
      cell.className = 'day-cell';
      const dateString = currentDate.toISOString().split('T')[0];
      
      const count = contributionMap[dateString] || 0;
      const intensity = Math.min(Math.floor(count / 2), 4);
      cell.style.backgroundColor = `var(--color-scale-${intensity})`;
      
      cell.dataset.date = dateString;
      cell.dataset.count = count;

      cell.addEventListener('mouseover', (e) => {
        const dateDisplay = new Date(dateString).toLocaleDateString('en-US', { 
          weekday: 'short', 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
        
        tooltip.innerHTML = `
          <strong>${dateDisplay}</strong><br>
          ${count} contribution${count !== 1 ? 's' : ''}
        `;
        
        const rect = e.target.getBoundingClientRect();
        tooltip.style.left = `${rect.left + window.scrollX - tooltip.offsetWidth/2 + rect.width/2}px`;
        tooltip.style.top = `${rect.top + window.scrollY - tooltip.offsetHeight - 8}px`;
        tooltip.style.visibility = 'visible';
      });

      cell.addEventListener('mouseout', () => {
        tooltip.style.visibility = 'hidden';
      });

      cell.addEventListener('click', () => {
        // Remove active class from all cells
        document.querySelectorAll('.day-cell.active').forEach(el => {
          el.classList.remove('active');
        });
        
        // Add active class to clicked cell
        cell.classList.add('active');
        
        const target = document.querySelector(`[data-contribution-date="${dateString}"]`);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });

      calendarEl.appendChild(cell);
    }
  }
  
  // Update stats
  document.getElementById('total-count').textContent = totalContributions;
  document.getElementById('streak-count').textContent = currentStreak;
  document.getElementById('max-day-count').textContent = maxDayCount;
}

function renderContributionsList(contributions) {
  const listEl = document.getElementById('contributions-list');
  const grouped = contributions.reduce((acc, c) => {
    const date = new Date(c.date).toISOString().split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(c);
    return acc;
  }, {});

  // Sort dates in descending order
  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

  sortedDates.forEach(date => {
    const items = grouped[date];
    
    const dateHeader = document.createElement('div');
    dateHeader.className = 'contribution-item';
    dateHeader.dataset.contributionDate = date;
    
    const formattedDate = new Date(date).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    dateHeader.innerHTML = `
      <div class="contribution-date">${formattedDate}</div>
    `;
    listEl.appendChild(dateHeader);

    items.forEach(item => {
      const el = document.createElement('a');
      el.className = 'contribution-item';
      el.href = item.url;
      el.target = "_blank";
      el.innerHTML = `
        <div class="contribution-type ${item.type.toLowerCase()}">${item.type}</div>
        <div class="contribution-title">${item.title || 'Untitled'}</div>
      `;
      listEl.appendChild(el);
    });
  });
}

export async function initCalendar() {
  try {
    const user = await window.websim.getCreatedBy();
    const contributions = await fetchUserContributions(user.username);
    
    generateCalendar(contributions);
    renderContributionsList(contributions);
  } catch (error) {
    console.error('Error initializing calendar:', error);
  }
}