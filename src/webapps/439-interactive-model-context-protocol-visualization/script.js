document.addEventListener('DOMContentLoaded', function() {
  const diagram = document.getElementById('diagram');
  const tooltip = document.getElementById('tooltip');
  const infoPanel = document.getElementById('infoPanel');
  const infoPanelTitle = document.getElementById('infoPanelTitle');
  const infoPanelContent = document.getElementById('infoPanelContent');
  const closePanel = document.getElementById('closePanel');
  const resetButton = document.getElementById('resetView');
  const showAllButton = document.getElementById('showAll');
  const resetZoomButton = document.getElementById('resetZoom');
  const loadingOverlay = document.getElementById('loadingOverlay');
  
  let activeComponent = null;
  let activeConnections = [];
  let cachedComponentDetails = {}; // Cache for component details
  let cachedOverview = null; // Cache for protocol overview
  
  // Drag functionality variables
  let isDragging = false;
  let startX, startY;
  let initialOffsetX = 0, initialOffsetY = 0;
  let currentOffsetX = 0, currentOffsetY = 0;
  let scale = 1;
  
  // Initialize
  const components = [...componentsData]; // Create a copy to avoid modification of the original
  const connections = [...connectionsData];

  // Load cached data from localStorage if available
  function loadCachedData() {
    try {
      const cachedData = localStorage.getItem('mcp_component_details');
      if (cachedData) {
        cachedComponentDetails = JSON.parse(cachedData);
      }
      
      const cachedOverviewData = localStorage.getItem('mcp_overview');
      if (cachedOverviewData) {
        cachedOverview = JSON.parse(cachedOverviewData);
      }
    } catch (error) {
      console.error('Error loading cached data:', error);
      // If there's an error, we'll just proceed without the cached data
    }
  }
  
  // Save data to localStorage
  function saveCachedData() {
    try {
      localStorage.setItem('mcp_component_details', JSON.stringify(cachedComponentDetails));
      if (cachedOverview) {
        localStorage.setItem('mcp_overview', JSON.stringify(cachedOverview));
      }
    } catch (error) {
      console.error('Error saving cached data:', error);
    }
  }

  // Create nodes with icons
  function createNode(component) {
    const node = document.createElement('div');
    node.className = 'node';
    node.id = component.id;
    node.style.backgroundColor = component.color;
    node.style.left = `${component.x}%`;
    node.style.top = `${component.y}%`;
    
    // Add delay based on index for staggered animation
    node.style.opacity = '0';
    
    node.innerHTML = `
      <div class="node-icon">${component.icon}</div>
      <div>${component.name}</div>
    `;
    
    node.addEventListener('mouseover', () => {
      showTooltip(component);
      highlightConnections(component.id);
    });
    
    node.addEventListener('mouseout', () => {
      hideTooltip();
      if (!activeComponent) {
        resetConnectionHighlights();
      }
    });
    
    node.addEventListener('click', (e) => {
      // Prevent click from being interpreted as drag
      if (!isDragging) {
        showInfoPanel(component);
      }
      e.stopPropagation();
    });
    
    return node;
  }

  // Improved connection creation with bezier curves
  function createConnection(start, end, description) {
    const connection = document.createElement('div');
    connection.className = 'connection';
    connection.dataset.start = start;
    connection.dataset.end = end;
    connection.dataset.description = description;
    
    updateConnectionPosition(connection);
    
    connection.addEventListener('mouseover', () => {
      showConnectionTooltip(connection);
    });
    
    connection.addEventListener('mouseout', () => {
      hideTooltip();
    });
    
    return connection;
  }

  function updateConnectionPosition(connection) {
    const start = connection.dataset.start;
    const end = connection.dataset.end;
    
    const startNode = document.getElementById(start);
    const endNode = document.getElementById(end);
    
    if (!startNode || !endNode) return;
    
    const startRect = startNode.getBoundingClientRect();
    const endRect = endNode.getBoundingClientRect();
    const diagramRect = diagram.getBoundingClientRect();
    
    const startX = startRect.left + startRect.width/2 - diagramRect.left;
    const startY = startRect.top + startRect.height/2 - diagramRect.top;
    const endX = endRect.left + endRect.width/2 - diagramRect.left;
    const endY = endRect.top + endRect.height/2 - diagramRect.top;
    
    const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
    
    connection.style.width = `${length}px`;
    connection.style.left = `${startX}px`;
    connection.style.top = `${startY}px`;
    connection.style.transform = `rotate(${angle}deg)`;
  }

  function showTooltip(component) {
    tooltip.innerHTML = component.description;
    tooltip.style.display = 'block';
    
    const updateTooltipPosition = (e) => {
      tooltip.style.left = `${e.pageX + 15}px`;
      tooltip.style.top = `${e.pageY + 15}px`;
    };
    
    document.addEventListener('mousemove', updateTooltipPosition);
    
    // Store the event listener removal function
    tooltip.removeListener = () => {
      document.removeEventListener('mousemove', updateTooltipPosition);
    };
  }

  function showConnectionTooltip(connection) {
    tooltip.innerHTML = connection.dataset.description;
    tooltip.style.display = 'block';
    
    const updateTooltipPosition = (e) => {
      tooltip.style.left = `${e.pageX + 15}px`;
      tooltip.style.top = `${e.pageY + 15}px`;
    };
    
    document.addEventListener('mousemove', updateTooltipPosition);
    
    // Store the event listener removal function
    tooltip.removeListener = () => {
      document.removeEventListener('mousemove', updateTooltipPosition);
    };
  }

  function hideTooltip() {
    if (tooltip.removeListener) {
      tooltip.removeListener();
    }
    tooltip.style.display = 'none';
  }

  function highlightConnections(nodeId) {
    activeConnections = [];
    document.querySelectorAll('.connection').forEach(conn => {
      if (conn.dataset.start === nodeId || conn.dataset.end === nodeId) {
        conn.classList.add('active');
        activeConnections.push(conn);
      }
    });
  }

  function resetConnectionHighlights() {
    activeConnections.forEach(conn => {
      conn.classList.remove('active');
    });
    activeConnections = [];
  }

  async function showInfoPanel(component) {
    // Clear previous content
    infoPanelTitle.textContent = component.name;
    infoPanelContent.innerHTML = '<div class="loading">Loading details...</div>';
    
    // Remove active class from all nodes
    document.querySelectorAll('.node').forEach(node => node.classList.remove('active'));
    
    // Add active class to clicked node
    document.getElementById(component.id).classList.add('active');
    activeComponent = component.id;
    
    // Show the panel
    infoPanel.classList.add('visible');
    
    // Highlight relevant connections
    highlightConnections(component.id);
    
    try {
      // Use cached data or fetch new data
      let componentDetails;
      if (cachedComponentDetails[component.name]) {
        componentDetails = cachedComponentDetails[component.name];
      } else {
        componentDetails = await getComponentDetails(component.name);
        // Cache the newly fetched data
        cachedComponentDetails[component.name] = componentDetails;
        saveCachedData();
      }
      
      // Create the content with both static and AI data
      const content = `
        <div class="component-description">
          <p>${component.details}</p>
          
          <h3>Key Endpoints</h3>
          <ul>
            ${component.endpoints.map(endpoint => `<li><code>${endpoint}</code></li>`).join('')}
          </ul>
          
          <h3>Example Use Cases</h3>
          <div class="example-block">
            ${component.examples.map(example => `<p>• ${example}</p>`).join('')}
          </div>
          
          <h3>Technical Implementation</h3>
          <p>${componentDetails.details}</p>
          
          <h3>Integration Examples</h3>
          <div class="example-block">
            ${componentDetails.examples.map(example => `<p>• ${example}</p>`).join('')}
          </div>
          
          <h3>Related Components</h3>
          <div class="tags">
            ${getRelatedComponents(component.id).map(id => 
              `<span class="tag" data-component="${id}">${components.find(c => c.id === id).name}</span>`
            ).join('')}
          </div>
        </div>
      `;
      
      infoPanelContent.innerHTML = content;
      
      // Add click handlers to tags
      document.querySelectorAll('.tag').forEach(tag => {
        tag.addEventListener('click', () => {
          const componentId = tag.dataset.component;
          const component = components.find(c => c.id === componentId);
          if (component) {
            showInfoPanel(component);
          }
        });
      });
      
    } catch (error) {
      infoPanelContent.innerHTML = `
        <div class="error">
          <p>Error loading advanced details. Please try again.</p>
          <p>${component.details}</p>
        </div>
      `;
      console.error('Error fetching component details:', error);
    }
  }

  function getRelatedComponents(componentId) {
    const related = new Set();
    
    connections.forEach(([start, end]) => {
      if (start === componentId) {
        related.add(end);
      } else if (end === componentId) {
        related.add(start);
      }
    });
    
    return Array.from(related);
  }

  async function getComponentDetails(componentName) {
    try {
      const response = await fetch('/api/ai_completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: `Provide detailed technical information about the ${componentName} component of the Model Context Protocol, focusing on implementation details and practical usage scenarios.
          
          <typescript-interface>
          interface Response {
            details: string;
            examples: string[];
          }
          </typescript-interface>
          
          <example>
          {
            "details": "The component is implemented using a client-server architecture where endpoints are exposed through a JSON-RPC interface. The implementation handles authentication, error conditions, and provides standardized response formats.",
            "examples": ["Example: A Python server implementing the MCP protocol can expose filesystem resources with 'file://' URIs, allowing the LLM to query directory contents and read files.", "Example: A Node.js implementation can wrap REST APIs as resources, automatically handling authentication and rate limiting."]
          }
          </example>`,
          data: componentName
        })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching component details:', error);
      return {
        details: "Technical details could not be loaded at this time.",
        examples: ["N/A"]
      };
    }
  }

  async function getProtocolOverview() {
    try {
      const response = await fetch('/api/ai_completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: `Provide a comprehensive overview of the Model Context Protocol system, explaining how the components work together to enable secure LLM interactions with external systems.
          
          <typescript-interface>
          interface Response {
            overview: string;
            keyFeatures: string[];
            securityConsiderations: string[];
            bestPractices: string[];
          }
          </typescript-interface>
          
          <example>
          {
            "overview": "The Model Context Protocol creates a standardized interface between LLMs and external systems, using a client-server architecture with well-defined components for data access and functionality.",
            "keyFeatures": ["Secure resource access with URI-based identification", "Reusable prompts with templating capabilities", "Tool execution with schema validation"],
            "securityConsiderations": ["Input validation to prevent injection attacks", "Access control for sensitive resources", "Authentication and authorization mechanisms"],
            "bestPractices": ["Use resources for static content, tools for actions", "Implement proper error handling with descriptive messages", "Log all interactions for debugging and security auditing"]
          }
          </example>`,
          data: ""
        })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching protocol overview:', error);
      return {
        overview: "Protocol overview could not be loaded at this time.",
        keyFeatures: ["N/A"],
        securityConsiderations: ["N/A"],
        bestPractices: ["N/A"]
      };
    }
  }

  // Async function to preload all component details and protocol overview
  async function preloadAllData() {
    loadingOverlay.style.display = 'flex';
    
    try {
      // Load cached data first
      loadCachedData();
      
      // If we don't have a complete cache, fetch the missing data
      const fetchPromises = [];
      
      // Preload component details if not cached
      for (const component of components) {
        if (!cachedComponentDetails[component.name]) {
          fetchPromises.push(
            getComponentDetails(component.name)
              .then(details => {
                cachedComponentDetails[component.name] = details;
              })
          );
        }
      }
      
      // Preload protocol overview if not cached
      if (!cachedOverview) {
        fetchPromises.push(
          getProtocolOverview()
            .then(overview => {
              cachedOverview = overview;
            })
        );
      }
      
      // Wait for all fetches to complete
      if (fetchPromises.length > 0) {
        await Promise.all(fetchPromises);
        // Save all fetched data to localStorage
        saveCachedData();
      }
    } catch (error) {
      console.error('Error preloading data:', error);
    } finally {
      // Hide loading overlay
      loadingOverlay.style.display = 'none';
    }
  }

  // Initialize the diagram
  async function initializeDiagram() {
    // Preload all component data
    await preloadAllData();
    
    // Create nodes
    components.forEach(component => {
      diagram.appendChild(createNode(component));
    });

    // Create connections after a short delay to ensure nodes are positioned
    setTimeout(() => {
      connections.forEach(([start, end, description]) => {
        diagram.appendChild(createConnection(start, end, description));
      });
      
      // Make nodes visible with staggered animation
      document.querySelectorAll('.node').forEach((node, index) => {
        setTimeout(() => {
          node.style.opacity = '1';
        }, 100 * index);
      });
    }, 100);
  }

  // Implement dragging functionality
  function setupDraggable() {
    // Mouse events
    diagram.addEventListener('mousedown', (e) => {
      if (e.target === diagram || e.target.id === 'diagramBackdrop') {
        startDrag(e.clientX, e.clientY);
      }
    });
    
    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        drag(e.clientX, e.clientY);
      }
    });
    
    document.addEventListener('mouseup', () => {
      endDrag();
    });
    
    // Touch events
    diagram.addEventListener('touchstart', (e) => {
      if (e.target === diagram || e.target.id === 'diagramBackdrop') {
        const touch = e.touches[0];
        startDrag(touch.clientX, touch.clientY);
        e.preventDefault();
      }
    });
    
    document.addEventListener('touchmove', (e) => {
      if (isDragging) {
        const touch = e.touches[0];
        drag(touch.clientX, touch.clientY);
        e.preventDefault();
      }
    });
    
    document.addEventListener('touchend', () => {
      endDrag();
    });
    
    // Mousewheel zoom
    diagram.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY;
      
      // Determine zoom direction
      if (delta < 0) {
        // Zoom in
        scale = Math.min(scale * 1.1, 2);
      } else {
        // Zoom out
        scale = Math.max(scale / 1.1, 0.5);
      }
      
      applyTransform();
      updateAllConnections();
    });
  }
  
  function startDrag(x, y) {
    isDragging = true;
    startX = x;
    startY = y;
    initialOffsetX = currentOffsetX;
    initialOffsetY = currentOffsetY;
    diagram.style.cursor = 'grabbing';
  }
  
  function drag(x, y) {
    if (!isDragging) return;
    
    const dx = (x - startX) / scale;
    const dy = (y - startY) / scale;
    
    currentOffsetX = initialOffsetX + dx;
    currentOffsetY = initialOffsetY + dy;
    
    applyTransform();
    updateAllConnections();
  }
  
  function endDrag() {
    isDragging = false;
    diagram.style.cursor = 'grab';
  }
  
  function applyTransform() {
    // Apply transform to all nodes
    document.querySelectorAll('.node').forEach(node => {
      // Get the original position from the component data
      const component = components.find(c => c.id === node.id);
      if (component) {
        const originalX = component.x;
        const originalY = component.y;
        
        // Apply transformation
        const newX = (originalX / 100 * diagram.offsetWidth) * scale + currentOffsetX;
        const newY = (originalY / 100 * diagram.offsetHeight) * scale + currentOffsetY;
        
        // Calculate relative position
        const relativeX = (newX / diagram.offsetWidth) * 100;
        const relativeY = (newY / diagram.offsetHeight) * 100;
        
        // Apply new position
        node.style.left = `${relativeX}%`;
        node.style.top = `${relativeY}%`;
        
        // Apply scale to the node
        node.style.transform = `scale(${scale})`;
      }
    });
  }
  
  function updateAllConnections() {
    document.querySelectorAll('.connection').forEach(connection => {
      updateConnectionPosition(connection);
    });
  }
  
  function resetDiagram() {
    scale = 1;
    currentOffsetX = 0;
    currentOffsetY = 0;
    
    applyTransform();
    updateAllConnections();
  }

  // Event Listeners
  closePanel.addEventListener('click', () => {
    infoPanel.classList.remove('visible');
    document.querySelectorAll('.node').forEach(node => node.classList.remove('active'));
    resetConnectionHighlights();
    activeComponent = null;
  });

  resetButton.addEventListener('click', () => {
    infoPanel.classList.remove('visible');
    document.querySelectorAll('.node').forEach(node => node.classList.remove('active'));
    resetConnectionHighlights();
    activeComponent = null;
    resetDiagram();
  });
  
  resetZoomButton.addEventListener('click', () => {
    resetDiagram();
  });

  showAllButton.addEventListener('click', async () => {
    // Display comprehensive information about all components
    infoPanelTitle.textContent = "Model Context Protocol Overview";
    infoPanelContent.innerHTML = '<div class="loading">Loading comprehensive details...</div>';
    infoPanel.classList.add('visible');
    
    try {
      // Use cached overview if available, otherwise fetch it
      const overview = cachedOverview || await getProtocolOverview();
      
      infoPanelContent.innerHTML = `
        <div class="protocol-overview">
          <p>${overview.overview}</p>
          
          <h3>Component Interaction Diagram</h3>
          <div class="feature-grid">
            ${components.map(comp => `
              <div class="feature-item">
                <h4>${comp.name}</h4>
                <p>${comp.description}</p>
              </div>
            `).join('')}
          </div>
          
          <h3>Key Features</h3>
          <ul>
            ${overview.keyFeatures.map(feature => `<li>${feature}</li>`).join('')}
          </ul>
          
          <h3>Security Considerations</h3>
          <ul>
            ${overview.securityConsiderations.map(item => `<li>${item}</li>`).join('')}
          </ul>
          
          <h3>Best Practices</h3>
          <ul>
            ${overview.bestPractices.map(practice => `<li>${practice}</li>`).join('')}
          </ul>
        </div>
      `;
      
      // Add click handlers to feature items
      document.querySelectorAll('.feature-item').forEach(item => {
        item.addEventListener('click', () => {
          const componentName = item.querySelector('h4').textContent;
          const component = components.find(c => c.name === componentName);
          if (component) {
            showInfoPanel(component);
          }
        });
      });
    } catch (error) {
      infoPanelContent.innerHTML = `
        <div class="error">
          <p>Error loading overview. Please try again.</p>
        </div>
      `;
      console.error('Error displaying overview:', error);
    }
  });

  // Handle window resize to update connections
  window.addEventListener('resize', () => {
    updateAllConnections();
  });

  // Initialize
  setupDraggable();
  initializeDiagram();
});