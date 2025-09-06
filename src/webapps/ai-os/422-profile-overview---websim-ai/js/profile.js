let currentProjects = [];
const STORAGE_KEY = 'websim_profile_projects';
const SORT_KEY = 'websim_project_sort';

function getRelativeTime(date) {
  const now = new Date();
  const past = new Date(date);
  const diffTime = Math.abs(now - past);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffYears > 0) {
    return `${diffYears} year${diffYears === 1 ? '' : 's'} ago`;
  } else if (diffMonths > 0) {
    return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;
  } else if (diffDays > 0) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  } else {
    return 'today';
  }
}

async function initProfile() {
  const user = await WebsimAPI.getCurrentUser();
  if (!user) return;

  renderProfileHeader(user);
  await loadProjects(user.username);
}

function renderProfileHeader(user) {
  const header = document.getElementById('profile-header');
  const timeAgo = getRelativeTime(user.created_at);
  header.innerHTML = `
    <p>@${user.username}</p>
    <time>Joined ${timeAgo}</time>
  `;
}

async function loadProjects(username) {
  // Try loading from localStorage first
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) {
    try {
      currentProjects = JSON.parse(cached);
      const sortMethod = localStorage.getItem(SORT_KEY) || 'recent';
      sortProjects(sortMethod, false);
    } catch (e) {
      // If there's any error with cached data, fetch fresh data
      await refreshProjects(username);
    }
    return;
  }

  await refreshProjects(username);
}

async function refreshProjects(username) {
  if (!username) {
    const user = await WebsimAPI.getCurrentUser();
    username = user.username;
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
    sortProjects(sortMethod, false);
  } catch (error) {
    console.error('Error loading projects:', error);
    // Clear potentially corrupted cache
    localStorage.removeItem(STORAGE_KEY);
    // Show error state in UI
    const list = document.getElementById('projects-list');
    list.innerHTML = '<p>Error loading projects. Please try refreshing.</p>';
  }
}

function sortProjects(method, updateStorage = true) {
  if (updateStorage) {
    localStorage.setItem(SORT_KEY, method);
  }

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
  list.innerHTML = sorted.map(project => {
    const timeAgo = getRelativeTime(project.created_at);
    return `
      <article>
        <h3><a href="/projects/${project.id}">${project.title}</a></h3>
        <p>Views: ${project.views} • Likes: ${project.likes} • Created ${timeAgo}</p>
      </article>
    `;
  }).join('');
}

// Initialize profile on page load
initProfile();