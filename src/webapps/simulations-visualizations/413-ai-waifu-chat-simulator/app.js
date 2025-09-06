const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');

let currentDereType = 'tsundere'; // Default personality type
let conversationHistory = [];

async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  // Add user message to chat
  addMessage(message, 'user');
  userInput.value = '';

  // Generate waifu response
  const response = await generateWaifuResponse(message);
  addMessage(response.text, 'bot');
  animateExpression(response.emotion);
}

function addMessage(text, sender) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', `${sender}-message`);
  messageDiv.textContent = text;
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function generateWaifuResponse(userMessage) {
  try {
    const response = await fetch('/api/ai_completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        prompt: `You are a ${currentDereType} anime-style waifu. Respond to the user's message while showing your personality.
        Include your current emotional state. Keep responses brief (1-2 sentences).
        
        interface Response {
          text: string;
          emotion: 'happy' | 'angry' | 'sad' | 'flustered' | 'neutral';
          action?: 'blush' | 'cry' | 'laugh';
        }
        
        {
          "text": "B-baka! I wasn't waiting for you or anything!",
          "emotion": "flustered",
          "action": "blush"
        }
        `,
        data: {
          message: userMessage,
          history: conversationHistory.slice(-3)
        }
      }),
    });

    const data = await response.json();
    conversationHistory.push({ user: userMessage, bot: data.text });
    return data;
  } catch (error) {
    console.error('Error generating response:', error);
    return { text: "Hmm... I'm feeling a little confused right now.", emotion: 'neutral' };
  }
}

function animateExpression(emotion) {
  const svg = document.querySelector('.waifu-character');
  const eyes = document.querySelectorAll('.eye');
  const mouth = document.querySelector('.mouth');
  const effects = document.querySelector('.effects');

  // Reset previous animations
  svg.classList.remove('animate__animated', 'animate__headShake', 'animate__bounce');

  switch(emotion) {
    case 'happy':
      mouth.setAttribute('d', 'M80 120 Q100 140 120 120');
      eyes.forEach(eye => eye.setAttribute('cy', '85'));
      svg.classList.add('animate__animated', 'animate__bounce');
      break;
    case 'angry':
      mouth.setAttribute('d', 'M80 130 Q100 110 120 130');
      eyes.forEach(eye => eye.setAttribute('r', '6'));
      svg.classList.add('animate__animated', 'animate__headShake');
      break;
    case 'sad':
      mouth.setAttribute('d', 'M80 130 Q100 120 120 130');
      eyes.forEach(eye => eye.setAttribute('cy', '95'));
      break;
    case 'flustered':
      mouth.setAttribute('d', 'M85 120 Q100 125 115 120');
      effects.querySelectorAll('.blush').forEach(b => b.style.opacity = '0.5');
      setTimeout(() => {
        effects.querySelectorAll('.blush').forEach(b => b.style.opacity = '0');
      }, 2000);
      break;
    default:
      mouth.setAttribute('d', 'M80 120 Q100 130 120 120');
      eyes.forEach(eye => eye.setAttribute('cy', '90'));
  }
}

// Initialize with greeting
addMessage("H-hey! Don't get the wrong idea, I just happened to be here!", 'bot');