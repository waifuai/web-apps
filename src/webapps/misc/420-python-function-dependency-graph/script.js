document.addEventListener('DOMContentLoaded', () => {
  const generateGraphButton = document.getElementById('generateGraph');
  const pythonCodeTextarea = document.getElementById('pythonCode');
  const graphContainer = document.getElementById('graphContainer');
  const loadExampleCodeButton = document.getElementById('loadExampleCode');
  const fontSizeSlider = document.getElementById('fontSizeSlider');
  const fontSizeValueDisplay = document.getElementById('fontSizeValue');
  const resetLayoutButton = document.getElementById('resetLayout');
  const saveAsJpgButton = document.getElementById('saveAsJpg');

  let cy; // Cytoscape instance

  loadExampleCodeButton.addEventListener('click', () => {
    const exampleCode = `def function_a():
    function_b()
    function_c()

def function_b():
    pass

def function_c():
    function_d()

def function_d():
    pass

def main_function():
    function_a()`;
    pythonCodeTextarea.value = exampleCode;
  });

  generateGraphButton.addEventListener('click', async () => {
    const pythonCode = pythonCodeTextarea.value;

    if (!pythonCode.trim()) {
      alert('Please enter Python code.');
      return;
    }

    const dependencyData = await getFunctionDependencies(pythonCode);
    if (dependencyData) {
      renderGraph(dependencyData);
    } else {
      alert('Failed to generate dependency graph.');
    }
  });

  async function getFunctionDependencies(pythonCode) {
    try {
      const response = await fetch('/api/ai_completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Analyze the following Python code and extract the function dependencies. Represent the dependencies as a JSON object where keys are function names and values are lists of function names they call. If a function doesn't call any other function, its value should be an empty list.

          interface Response {
            dependencies: {
              [functionName: string]: string[];
            };
          }

          {
            "dependencies": {
              "functionA": ["functionB", "functionC"],
              "functionB": [],
              "functionC": ["functionD"],
              "functionD": []
            }
          }
          `,
          data: pythonCode,
        }),
      });

      if (!response.ok) {
        console.error('HTTP error!', response.status);
        return null;
      }

      const data = await response.json();
      return data.dependencies;
    } catch (error) {
      console.error('Error fetching function dependencies:', error);
      return null;
    }
  }

  function renderGraph(dependencyData) {
    graphContainer.innerHTML = ''; // Clear previous graph

    cy = cytoscape({
      container: graphContainer,
      elements: [],
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#007bff',
            'label': 'data(id)',
            'color': 'black',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': `${fontSizeSlider.value}px` // Initial font size
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#ccc',
            'curve-style': 'bezier',
            'target-arrow-color': '#ccc',
            'target-arrow-shape': 'triangle'
          }
        }
      ],
      layout: {
        name: 'cose'
      }
    });

    const nodes = Object.keys(dependencyData).map(funcName => ({ data: { id: funcName } }));
    cy.add(nodes);

    let edges = [];
    for (const funcName in dependencyData) {
      dependencyData[funcName].forEach(dependency => {
        edges.push({ data: { source: funcName, target: dependency } });
      });
    }
    cy.add(edges);

    cy.layout({ name: 'cose' }).run(); // Run layout after adding elements
  }

  fontSizeSlider.addEventListener('input', () => {
    const fontSize = fontSizeSlider.value;
    fontSizeValueDisplay.textContent = `${fontSize}px`;
    if (cy) {
      cy.style().selector('node').style({ 'font-size': `${fontSize}px` }).update();
    }
  });

  resetLayoutButton.addEventListener('click', () => {
    if (cy) {
      cy.layout({ name: 'cose' }).run();
    }
  });

  saveAsJpgButton.addEventListener('click', () => {
    if (cy) {
      const jpgData = cy.jpg({
        bg: '#ffffff', // Optional: white background
        quality: 0.9 // Optional: JPG quality
      });

      const a = document.createElement('a');
      a.href = jpgData;
      a.download = 'dependency_graph.jpg';
      document.body.appendChild(a); // Append to the document
      a.click();
      document.body.removeChild(a); // Clean up
    }
  });
});