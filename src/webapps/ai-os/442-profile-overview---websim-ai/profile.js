let currentProjects = [];
const STORAGE_KEY = 'websim_profile_projects';
const SORT_KEY = 'websim_project_sort';
let isLoading = true;

function getRelativeTime(date) {
  // Safety check for invalid dates
  if (!date) return 'some time ago';
  
  try {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const now = new Date();
    const past = new Date(date);
    
    // Check if valid date
    if (isNaN(past.getTime())) {
      return 'some time ago';
    }
    
    const diffTime = now - past;
    
    // Convert to seconds
    const diffSeconds = Math.floor(diffTime / 1000);
    
    if (diffSeconds < 60) {
      return rtf.format(-Math.min(diffSeconds, Number.MAX_SAFE_INTEGER), 'second');
    }
    
    // Convert to minutes
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) {
      return rtf.format(-Math.min(diffMinutes, Number.MAX_SAFE_INTEGER), 'minute');
    }
    
    // Convert to hours
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return rtf.format(-Math.min(diffHours, Number.MAX_SAFE_INTEGER), 'hour');
    }
    
    // Convert to days
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) {
      return rtf.format(-Math.min(diffDays, Number.MAX_SAFE_INTEGER), 'day');
    }
    
    // Convert to months
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) {
      return rtf.format(-Math.min(diffMonths, Number.MAX_SAFE_INTEGER), 'month');
    }
    
    // Convert to years
    const diffYears = Math.floor(diffMonths / 12);
    return rtf.format(-Math.min(diffYears, Number.MAX_SAFE_INTEGER), 'year');
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'some time ago';
  }
}

function formatNumber(num) {
  if (!num && num !== 0) return '0';
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

async function initProfile() {
  try {
    const user = await WebsimAPI.getCurrentUser();
    if (!user) {
      showError('User not authenticated');
      return;
    }

    renderProfileHeader(user);
    await loadProjects(user.username);
    await loadUserStats(user.username);
  } catch (error) {
    console.error('Error initializing profile:', error);
    showError('Failed to load profile data');
  }
}

async function loadUserStats(username) {
  try {
    const { stats } = await WebsimAPI.getUserStats(username);
    
    document.getElementById('total-views').textContent = formatNumber(stats.total_views);
    document.getElementById('total-likes').textContent = formatNumber(stats.total_likes);
  } catch (error) {
    console.error('Error loading user stats:', error);
  }
}

async function renderProfileHeader(user) {
  const header = document.getElementById('profile-header');
  
  if (!user) {
    header.innerHTML = '<p>User information unavailable</p>';
    return;
  }
  
  try {
    const timeAgo = getRelativeTime(user.created_at);
    const avatarUrl = user.avatar_url || await WebsimAPI.getUserAvatar(user.username);

    header.innerHTML = `
      <img src="${avatarUrl}" alt="${user.username}" class="avatar">
      <h2 class="username">@${user.username}</h2>
      <time class="joined">Joined ${timeAgo}</time>
      ${user.description ? `<p>${user.description}</p>` : ''}
    `;
  } catch (error) {
    console.error('Error rendering profile header:', error);
    header.innerHTML = `
      <h2 class="username">@${user.username}</h2>
      <p>Error loading profile details</p>
    `;
  }
}

async function loadProjects(username) {
  isLoading = true;
  updateLoadingState();
  
  // Try loading from localStorage first
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) {
    try {
      currentProjects = JSON.parse(cached);
      const sortMethod = localStorage.getItem(SORT_KEY) || 'recent';
      updateSortButtons(sortMethod);
      sortProjects(sortMethod, false);
      updateProjectStats();
      isLoading = false;
      updateLoadingState();
    } catch (e) {
      // If there's any error with cached data, fetch fresh data
      await refreshProjects(username);
    }
    return;
  }

  await refreshProjects(username);
}

function updateLoadingState() {
  const list = document.getElementById('projects-list');
  if (isLoading) {
    list.className = 'loading';
    list.innerHTML = `
      <div class="lds-dual-ring"></div>
      <p>Loading projects...</p>
    `;
  }
}

function updateProjectStats() {
  document.getElementById('total-projects').textContent = currentProjects.length;
  document.getElementById('projects-count').textContent = currentProjects.length;
}

async function refreshProjects(username) {
  isLoading = true;
  updateLoadingState();
  
  const refreshIcon = document.getElementById('refresh-icon');
  refreshIcon.style.animation = 'lds-dual-ring 1.2s linear infinite';
  
  if (!username) {
    try {
      const user = await WebsimAPI.getCurrentUser();
      username = user.username;
    } catch (error) {
      console.error('Error getting current user:', error);
      showError('Failed to authenticate user');
      refreshIcon.style.animation = '';
      return;
    }
  }

  try {
    const data = await WebsimAPI.getUserProjects(username);
    if (!data.projects?.data) {
      throw new Error('Invalid project data');
    }

    currentProjects = data.projects.data.map(p => ({
      id: p.project.id,
      title: p.project.title || 'Untitled Project',
      views: p.project.stats.views,
      likes: p.project.stats.likes,
      created_at: p.project.created_at
    }));

    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentProjects));
    
    const sortMethod = localStorage.getItem(SORT_KEY) || 'recent';
    updateSortButtons(sortMethod);
    sortProjects(sortMethod, false);
    updateProjectStats();
    
    isLoading = false;
    updateLoadingState();
  } catch (error) {
    console.error('Error loading projects:', error);
    // Clear potentially corrupted cache
    localStorage.removeItem(STORAGE_KEY);
    // Show error state in UI
    const list = document.getElementById('projects-list');
    list.className = 'error';
    list.innerHTML = '<p>Error loading projects. Please try refreshing.</p>';
  } finally {
    refreshIcon.style.animation = '';
  }
}

function updateSortButtons(activeMethod) {
  document.getElementById('sort-recent').classList.remove('active');
  document.getElementById('sort-views').classList.remove('active');
  document.getElementById('sort-likes').classList.remove('active');
  
  document.getElementById(`sort-${activeMethod}`).classList.add('active');
}

function sortProjects(method, updateStorage = true) {
  if (updateStorage) {
    localStorage.setItem(SORT_KEY, method);
  }
  
  updateSortButtons(method);

  const sorted = [...currentProjects].sort((a, b) => {
    switch(method) {
      case 'views':
        return b.views - a.views;
      case 'likes':
        return b.likes - a.likes;
      case 'recent':
      default:
        return new Date(b.created_at) - new Date(a.created_at);
    }
  });

  const list = document.getElementById('projects-list');
  list.className = ''; // Remove any state classes
  
  if (sorted.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <p>No projects found</p>
      </div>
    `;
    return;
  }

  list.innerHTML = sorted.map(project => {
    try {
      const timeAgo = getRelativeTime(project.created_at);
      return `
        <div class="project-card">
          <h3 class="project-title"><a href="https://websim.ai/p/${project.id}">${project.title}</a></h3>
          <div class="project-meta">
            <span class="meta-item">
              <svg class="icon" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              ${timeAgo}
            </span>
            <span class="meta-item">
              <svg class="icon" viewBox="0 0 24 24">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              ${formatNumber(project.views)} views
            </span>
            <span class="meta-item">
              <svg class="icon" viewBox="0 0 24 24">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              ${formatNumber(project.likes)} likes
            </span>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Error rendering project card:', error);
      return `
        <div class="project-card">
          <h3 class="project-title"><a href="https://websim.ai/p/${project.id}">${project.title}</a></h3>
          <div class="project-meta">
            <span class="meta-item">Error displaying project details</span>
          </div>
        </div>
      `;
    }
  }).join('');
}

function showError(message) {
  const list = document.getElementById('projects-list');
  list.className = 'error';
  list.innerHTML = `<p>${message}</p>`;
}

// Initialize profile on page load
document.addEventListener('DOMContentLoaded', initProfile);