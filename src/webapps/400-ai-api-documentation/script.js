document.addEventListener('DOMContentLoaded', () => {
  // Theme toggling
  const themeToggle = document.getElementById('themeToggle');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  
  function setTheme(isDark) {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    themeToggle.textContent = isDark ? '☀️' : '🌙';
  }
  
  // Initial theme
  setTheme(prefersDark.matches);
  
  themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    setTheme(!isDark);
  });

  // Load examples
  const examplesContainer = document.getElementById('examples-container');
  const examples = [
    {
      title: 'Basic Completion',
      description: 'Simple example of generating creative content',
      code: `async function getCreativeNames() {
  const response = await fetch('/api/ai_completion', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: \`Generate 3 creative names for a tech startup.
      
interface Response {
  names: string[];
  taglines: string[];
}
{
  "names": ["ByteBridge", "QuantumLeap", "NeuraTech"],
  "taglines": [
    "Bridging the digital divide",
    "Future-forward innovation",
    "Intelligence evolved"
  ]
}\`
    })
  });
  
  return await response.json();
}`
    },
    {
      title: 'Context-Aware Generation',
      description: 'Example using context data for better results',
      code: `async function getPersonalizedContent(userPreferences) {
  const response = await fetch('/api/ai_completion', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: \`Generate personalized content recommendations based on user preferences.
      
interface Response {
  recommendations: Array<{
    title: string;
    reason: string;
    score: number;
  }>;
}
{
  "recommendations": [
    {
      "title": "Advanced AI Patterns",
      "reason": "Matches interest in artificial intelligence",
      "score": 0.95
    }
  ]
}\`,
      data: userPreferences
    })
  });
  
  return await response.json();
}`
    }
  ];

  examples.forEach(example => {
    const exampleElement = document.createElement('div');
    exampleElement.classList.add('example-box');
    exampleElement.innerHTML = `
      <h3>${example.title}</h3>
      <p>${example.description}</p>
      <pre><code class="language-javascript">${example.code}</code></pre>
    `;
    examplesContainer.appendChild(exampleElement);
  });

  // Update the last updated date
  const lastUpdated = document.getElementById('lastUpdated');
  lastUpdated.textContent = new Date().toLocaleDateString();

  // Initialize Prism for syntax highlighting
  Prism.highlightAll();

  // Smooth scroll for navigation
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      document.querySelector(this.getAttribute('href')).scrollIntoView({
        behavior: 'smooth'
      });
    });
  });
});