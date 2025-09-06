class WebsimAPI {
  static async getCurrentUser() {
    const user = await window.websim.getUser();
    return user;
  }

  static async getUserStats(username) {
    const response = await fetch(`/api/v1/users/${username}/stats`);
    return response.json();
  }

  static async getUserProjects(username) {
    // Load all projects by setting a large first parameter
    const response = await fetch(`/api/v1/users/${username}/projects?posted=true&first=100`);
    return response.json();
  }
}