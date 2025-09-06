// script.js
const emotionInput = document.getElementById('emotion-input');
const submitButton = document.getElementById('submit-button');
const emojiDisplay = document.getElementById('emoji-display');
const timeline = document.getElementById('timeline');
const progressBar = document.getElementById('progress');
const progressPercentage = document.getElementById('progress-percentage');
const resetButton = document.getElementById('reset-button');

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
}

function updateTimeline() {
  timeline.innerHTML = ''; // Clear timeline
  expressionHistory.forEach(item => {
    const li = document.createElement('li');
    li.textContent = `Epoch ${item.epoch}: User felt '${item.input}', system responded with ${item.response}`;
    timeline.appendChild(li);
  });
}

function updateProgressBar() {
  const coveragePercentage = (displayedExpressions.size / totalUniqueExpressions) * 100;
  progressBar.style.width = `${coveragePercentage}%`;
  progressPercentage.textContent = `${coveragePercentage.toFixed(0)}%`;
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
  updateTimeline();
  updateProgressBar();
  emojiDisplay.textContent = "😊"; // Reset emoji
});

// Initial setup (optional - if you want to display something on load)
updateProgressBar();