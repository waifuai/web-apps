// Wait until DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const generateBtn = document.getElementById('generate-btn');
  generateBtn.addEventListener('click', async () => {
    const promptText = document.getElementById('prompt-input').value;
    // Call the built-in AI language model to process the prompt and generate diagram data
    const diagramData = await getAIResponse(promptText);
    drawDiagram(diagramData);
  });
});

/**
 * Simulate a call to the built in AI language model endpoint.
 * In a real scenario this would fetch data from '/api/ai_completion'
 * The response follows this interface:
 *
 * interface DiagramData {
 *   nodes: {
 *     id: string;
 *     label: string;
 *     x: number;
 *     y: number;
 *   }[];
 *   edges: {
 *     from: string;
 *     to: string;
 *     label?: string;
 *   }[];
 * }
 *
 * {
 *   "nodes": [
 *     {"id": "client", "label": "Client (Claude Desktop, Zed, Sourcegraph Cody)", "x": 350, "y": 50},
 *     {"id": "resources", "label": "Resources", "x": 150, "y": 200},
 *     {"id": "prompts", "label": "Prompts", "x": 350, "y": 200},
 *     {"id": "tools", "label": "Tools", "x": 550, "y": 200},
 *     {"id": "support", "label": "Sampling, Transports, Notifications", "x": 350, "y": 350}
 *   ],
 *   "edges": [
 *     {"from": "client", "to": "resources", "label": "discovers"},
 *     {"from": "client", "to": "prompts", "label": "retrieves"},
 *     {"from": "client", "to": "tools", "label": "calls"},
 *     {"from": "resources", "to": "support", "label": "updates"},
 *     {"from": "prompts", "to": "support", "label": "integrates"}
 *   ]
 * }
 */
async function getAIResponse(promptText) {
  // For demo purposes, we simulate a response based on the promptText.
  // In a real implementation, you would make a fetch call to /api/ai_completion
  // and pass promptText in an appropriate format.
  // Example:
  // const response = await fetch('/api/ai_completion', { ... });
  // return await response.json();

  // Simulated response (could be enhanced to reflect nuances of the promptText)
  const simulatedResponse = {
    nodes: [
      {
        id: "client",
        label: "Client (Claude Desktop, Zed, Sourcegraph Cody)",
        x: 350,
        y: 50
      },
      {
        id: "resources",
        label: "Resources",
        x: 150,
        y: 200
      },
      {
        id: "prompts",
        label: "Prompts",
        x: 350,
        y: 200
      },
      {
        id: "tools",
        label: "Tools",
        x: 550,
        y: 200
      },
      {
        id: "support",
        label: "Sampling, Transports, Notifications",
        x: 350,
        y: 350
      }
    ],
    edges: [
      { from: "client", to: "resources", label: "discovers" },
      { from: "client", to: "prompts", label: "retrieves" },
      { from: "client", to: "tools", label: "calls" },
      { from: "resources", to: "support", label: "updates" },
      { from: "prompts", to: "support", label: "integrates" }
    ]
  };

  // Simulate some network latency
  return new Promise(resolve => setTimeout(() => resolve(simulatedResponse), 500));
}

/**
 * Draws the diagram on the SVG canvas using the given diagramData.
 * @param {Object} diagramData - Object containing nodes and edges.
 */
function drawDiagram(diagramData) {
  const svg = document.getElementById('diagram-canvas');
  // Clear previous content
  while (svg.lastChild) {
    svg.removeChild(svg.lastChild);
  }

  // Define marker for arrowheads
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
  marker.setAttribute("id", "arrowhead");
  marker.setAttribute("markerWidth", "10");
  marker.setAttribute("markerHeight", "7");
  marker.setAttribute("refX", "10");
  marker.setAttribute("refY", "3.5");
  marker.setAttribute("orient", "auto");
  const arrowPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  arrowPath.setAttribute("d", "M0,0 L0,7 L10,3.5 z");
  arrowPath.setAttribute("fill", "#888");
  marker.appendChild(arrowPath);
  defs.appendChild(marker);
  svg.appendChild(defs);

  // Draw edges first so they render behind nodes
  diagramData.edges.forEach(edge => {
    const fromNode = diagramData.nodes.find(n => n.id === edge.from);
    const toNode = diagramData.nodes.find(n => n.id === edge.to);
    if (fromNode && toNode) {
      // Create line for edge
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", fromNode.x);
      line.setAttribute("y1", fromNode.y + 30); // offset from the bottom of the node
      line.setAttribute("x2", toNode.x);
      line.setAttribute("y2", toNode.y - 10); // offset from the top of the node
      line.setAttribute("class", "edge");
      svg.appendChild(line);

      // If there is a label, position it at the midpoint of the line
      if (edge.label) {
        const midX = (fromNode.x + toNode.x) / 2;
        const midY = (fromNode.y + toNode.y) / 2;
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", midX);
        text.setAttribute("y", midY - 5);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("fill", "#555");
        text.textContent = edge.label;
        svg.appendChild(text);
      }
    }
  });

  // Draw nodes
  diagramData.nodes.forEach(node => {
    // Create group for node
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "node");
    g.setAttribute("transform", `translate(${node.x - 75}, ${node.y - 20})`); // center the node

    // Create rectangle shape for node
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("width", "150");
    rect.setAttribute("height", "40");
    rect.setAttribute("rx", "5");
    rect.setAttribute("ry", "5");
    rect.setAttribute("fill", "#fff");
    rect.setAttribute("stroke", "#4a90e2");
    rect.setAttribute("stroke-width", "2");
    g.appendChild(rect);

    // Create text label inside node
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", "75");
    text.setAttribute("y", "25");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    text.setAttribute("fill", "#333");
    text.style.fontSize = "12px";
    text.textContent = node.label;
    g.appendChild(text);

    svg.appendChild(g);
  });
}