class WebsimAPI {
  static async getCurrentUser() {
    try {
      const user = await window.websim.getUser();
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  static async getUserStats(username) {
    try {
      if (!username) {
        throw new Error('Username is required');
      }
      const response = await fetch(`/api/v1/users/${username}/stats`);
      if (!response.ok) {
        throw new Error(`Failed to fetch user stats: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return { stats: { total_views: 0, total_likes: 0 } };
    }
  }

  static async getUserProjects(username) {
    try {
      if (!username) {
        throw new Error('Username is required');
      }
      // Load all projects by setting a large first parameter
      const response = await fetch(`/api/v1/users/${username}/projects?posted=true&first=100`);
      if (!response.ok) {
        throw new Error(`Failed to fetch user projects: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching user projects:', error);
      return { projects: { data: [] } };
    }
  }
  
  static async getUserAvatar(username) {
    try {
      if (!username) {
        throw new Error('Username is required');
      }
      // Return the avatar URL for a user
      return `https://images.websim.ai/avatar/${username}`;
    } catch (error) {
      console.error('Error getting avatar URL:', error);
      return null;
    }
  }
}