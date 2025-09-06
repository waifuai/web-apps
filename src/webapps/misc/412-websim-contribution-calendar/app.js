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

function generateCalendar(contributions) {
  const calendarEl = document.getElementById('calendar');
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  document.body.appendChild(tooltip);

  const contributionMap = contributions.reduce((acc, c) => {
    const date = new Date(c.date).toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth() - 6, 1);
  
  for (let week = 0; week < 26; week++) {
    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + (week * 7 + day));
      
      if (currentDate > today) continue;

      const cell = document.createElement('div');
      cell.className = 'day-cell';
      const dateString = currentDate.toISOString().split('T')[0];
      
      const count = contributionMap[dateString] || 0;
      const intensity = Math.min(Math.floor(count / 3), 4);
      cell.style.backgroundColor = `var(--color-scale-${intensity})`;
      
      cell.dataset.date = dateString;
      cell.dataset.count = count;

      cell.addEventListener('mouseover', (e) => {
        tooltip.textContent = `${dateString} · ${count} contributions`;
        tooltip.style.left = `${e.pageX + 10}px`;
        tooltip.style.top = `${e.pageY + 10}px`;
      });

      cell.addEventListener('mouseout', () => {
        tooltip.style.left = '-999px';
      });

      cell.addEventListener('click', () => {
        const target = document.querySelector(`[data-contribution-date="${dateString}"]`);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });

      calendarEl.appendChild(cell);
    }
  }
}

function renderContributionsList(contributions) {
  const listEl = document.getElementById('contributions-list');
  const grouped = contributions.reduce((acc, c) => {
    const date = new Date(c.date).toISOString().split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(c);
    return acc;
  }, {});

  Object.entries(grouped).forEach(([date, items]) => {
    const dateHeader = document.createElement('div');
    dateHeader.className = 'contribution-item';
    dateHeader.dataset.contributionDate = date;
    dateHeader.innerHTML = `
      <div class="contribution-date">${new Date(date).toLocaleDateString()}</div>
    `;
    listEl.appendChild(dateHeader);

    items.forEach(item => {
      const el = document.createElement('a');
      el.className = 'contribution-item';
      el.href = item.url;
      el.target = "_blank";
      el.innerHTML = `
        <div class="contribution-type">${item.type}</div>
        <div class="contribution-title">${item.title || 'Untitled'}</div>
      `;
      listEl.appendChild(el);
    });
  });
}

export async function initCalendar() {
  const user = await window.websim.getCreatedBy();
  const contributions = await fetchUserContributions(user.username);
  
  generateCalendar(contributions);
  renderContributionsList(contributions);
}