// script.js
document.addEventListener('DOMContentLoaded', function() {
  const emotionInput = document.getElementById('emotion-input');
  const submitButton = document.getElementById('submit-button');
  const emojiDisplay = document.getElementById('emoji-display');
  const timeline = document.getElementById('timeline');
  const progressBar = document.getElementById('progress');
  const progressPercentage = document.getElementById('progress-percentage');
  const resetButton = document.getElementById('reset-button');
  const emotionButtons = document.querySelectorAll('.emotion-btn');
  
  const allExpressions = {
    "happy": ["😊", "😄", "😁", "😎", "🥳"],
    "sad": ["😢", "😞", "😟", "🙁", "😥"],
    "angry": ["😠", "😡", "🤬", "😤", "👿"],
    "surprised": ["😲", "😮", "😯", "🤯", "😳"],
    "neutral": ["😐", "😶", "🙄", "🤔", "🤨"]
  };
  
  let expressionHistory = [];
  let displayedExpressions = new Set();
  let currentEpoch = 0;
  let maxEpochs = 10; // Example max epochs
  let categoryWeights = {
    "happy": 100,
    "sad": 100,
    "angry": 100,
    "surprised": 100,
    "neutral": 100
  };
  
  const flattenExpressions = () => {
    return Object.values(allExpressions).flat();
  };
  
  const totalUniqueExpressions = new Set(flattenExpressions()).size;
  
  async function getAIResponse(userInput) {
    try {
      const response = await fetch('/api/ai_completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Respond with a list of 3 emojis that are related to the emotion "${userInput}".
  
            interface Response {
              ideas: string[];
            }
            {
              "ideas": ["😊", "😄", "😁"]
            }
            `,
          data: userInput
        }),
      });
      const data = await response.json();
      return data.ideas;
    } catch (error) {
      console.error('Error fetching AI response:', error);
      return null;
    }
  }
  
  function updateDisplay(expression, inputEmotion) {
    emojiDisplay.textContent = expression;
    expressionHistory.push({ input: inputEmotion, response: expression, epoch: currentEpoch });
    displayedExpressions.add(expression);
    updateTimeline();
    updateProgressBar();
    updateWeightsVisualization(inputEmotion);
  }
  
  function updateTimeline() {
    timeline.innerHTML = ''; // Clear timeline
    // Display most recent entries first
    const recentEntries = [...expressionHistory].reverse().slice(0, 10);
    
    recentEntries.forEach(item => {
      const li = document.createElement('li');
      li.textContent = `Epoch ${item.epoch}: User felt "${item.input}", system responded with ${item.response}`;
      timeline.appendChild(li);
    });
  }
  
  function updateProgressBar() {
    const coveragePercentage = (displayedExpressions.size / totalUniqueExpressions) * 100;
    progressBar.style.width = `${coveragePercentage}%`;
    progressPercentage.textContent = `${coveragePercentage.toFixed(0)}%`;
  }
  
  function updateWeightsVisualization(inputEmotion) {
    // Decrease weight for the input category, making it less likely to show in future
    if (allExpressions[inputEmotion.toLowerCase()]) {
      // Reduce the selected category weight
      categoryWeights[inputEmotion.toLowerCase()] = Math.max(20, categoryWeights[inputEmotion.toLowerCase()] - 15);
      
      // Increase others slightly to balance
      Object.keys(categoryWeights).forEach(category => {
        if (category !== inputEmotion.toLowerCase()) {
          categoryWeights[category] = Math.min(100, categoryWeights[category] + 5);
        }
      });
    }
    
    // Update visualization
    Object.keys(categoryWeights).forEach(category => {
      const categoryElement = document.querySelector(`.category[data-category="${category}"] .bar`);
      if (categoryElement) {
        categoryElement.style.width = `${categoryWeights[category]}%`;
      }
    });
  }
  
  async function handleInput(inputEmotion) {
    if (!inputEmotion) return;
  
    currentEpoch++;
    const directMatches = allExpressions[inputEmotion.toLowerCase()];
    let expressionToDisplay;
  
    if (directMatches) {
      const unseenDirectMatches = directMatches.filter(exp => !displayedExpressions.has(exp));
      if (unseenDirectMatches.length > 0) {
        expressionToDisplay = unseenDirectMatches[0]; // Prioritize unseen direct matches
      } else {
        // If all direct matches are seen, get AI suggestions for variety
        const aiSuggestions = await getAIResponse(inputEmotion);
        if (aiSuggestions && aiSuggestions.length > 0) {
            const unseenAISuggestions = aiSuggestions.filter(exp => !displayedExpressions.has(exp));
            if (unseenAISuggestions.length > 0) {
                expressionToDisplay = unseenAISuggestions[0];
            } else {
                // If all AI suggestions are also seen, fallback to a random unseen expression
                const allPossibleExpressions = flattenExpressions();
                const unseenGeneralExpressions = allPossibleExpressions.filter(exp => !displayedExpressions.has(exp));
                expressionToDisplay = unseenGeneralExpressions[Math.floor(Math.random() * unseenGeneralExpressions.length)] || "😊"; // Default if nothing unseen
            }
        } else {
          // Fallback if AI fails or returns no suggestions
          const allPossibleExpressions = flattenExpressions();
          const unseenGeneralExpressions = allPossibleExpressions.filter(exp => !displayedExpressions.has(exp));
          expressionToDisplay = unseenGeneralExpressions[Math.floor(Math.random() * unseenGeneralExpressions.length)] || "😊"; // Default if nothing unseen
        }
      }
    } else {
      // If no direct match, use a default or handle as needed
      expressionToDisplay = "🤔"; // Indicate no direct match
    }
  
    updateDisplay(expressionToDisplay, inputEmotion);
  }
  
  // Event listeners
  submitButton.addEventListener('click', () => {
    const inputEmotion = emotionInput.value.trim();
    handleInput(inputEmotion);
    emotionInput.value = ''; // Clear input after submit
  });
  
  emotionInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      submitButton.click();
    }
  });
  
  resetButton.addEventListener('click', () => {
    expressionHistory = [];
    displayedExpressions = new Set();
    currentEpoch = 0;
    
    // Reset category weights
    Object.keys(categoryWeights).forEach(category => {
      categoryWeights[category] = 100;
    });
    
    updateTimeline();
    updateProgressBar();
    updateWeightsVisualization('');
    emojiDisplay.textContent = "😊"; // Reset emoji
  });
  
  // Add event listeners for the quick emotion buttons
  emotionButtons.forEach(button => {
    button.addEventListener('click', () => {
      const emotion = button.getAttribute('data-emotion');
      emotionInput.value = emotion; // Set input value
      handleInput(emotion);
      emotionInput.value = ''; // Clear input after submit
    });
  });
  
  // Initial setup
  updateProgressBar();
  updateWeightsVisualization('');
});