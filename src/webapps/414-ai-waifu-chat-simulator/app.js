import anime from 'https://cdn.skypack.dev/animejs@3.2.1';

const emotions = {
  happy: {
    mouth: 'M85 95 Q100 110 115 95',
    eyes: 'scaleY(1)',
    effects: ['✨', '🌸'],
    color: '#ffdd66'
  },
  angry: {
    mouth: 'M85 85 Q100 80 115 85',
    eyes: 'scaleY(0.7)',
    effects: ['💢', '🔥'],
    color: '#ff4444'
  },
  sad: {
    mouth: 'M85 100 Q100 90 115 100',
    eyes: 'scaleY(0.8)',
    effects: ['💧', '🌧️'],
    color: '#6699ff'
  }
};

const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const waifuSvg = document.getElementById('waifu-svg');
const effectsContainer = document.getElementById('effects');

let conversationHistory = [];

function addMessage(text, isUser) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', isUser ? 'user-message' : 'bot-message');
  messageDiv.textContent = text;
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function applyEmotion(emotion) {
  const config = emotions[emotion] || emotions.happy;
  
  // Animate facial features
  anime({
    targets: '#mouth',
    d: [{ value: config.mouth }],
    easing: 'easeInOutQuad',
    duration: 500
  });

  anime({
    targets: '#eyes',
    scaleY: config.eyes,
    duration: 300,
    easing: 'easeInOutQuad'
  });

  // Add emotional effects
  config.effects.forEach(effect => {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', Math.random() * 150 + 25);
    text.setAttribute('y', 250);
    text.setAttribute('class', 'emotional-effect');
    text.textContent = effect;
    effectsContainer.appendChild(text);
    
    setTimeout(() => text.remove(), 3000);
  });

  // Update body color
  anime({
    targets: '.body',
    fill: config.color,
    duration: 1000,
    easing: 'easeInOutQuad'
  });
}

async function getAIResponse(prompt) {
  try {
    const response = await fetch('/api/ai_completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        prompt: `Respond as an anime-style waifu. Format your response as JSON with "text" and "emotion" fields.
        
        interface WaifuResponse {
          text: string;
          emotion: 'happy' | 'angry' | 'sad' | 'neutral';
        }
        
        {
          "text": "Oh, senpai! You remembered my favorite! *giggles*",
          "emotion": "happy"
        }`,
        data: conversationHistory
      }),
    });

    const { text, emotion } = await response.json();
    return { text, emotion };
  } catch (error) {
    console.error('AI Error:', error);
    return { 
      text: "Hmm... my circuits are feeling fuzzy...", 
      emotion: "sad" 
    };
  }
}

sendBtn.addEventListener('click', async () => {
  const message = userInput.value.trim();
  if (!message) return;

  userInput.value = '';
  addMessage(message, true);
  conversationHistory.push({ role: 'user', content: message });

  const { text, emotion } = await getAIResponse(message);
  addMessage(text, false);
  applyEmotion(emotion);
  conversationHistory.push({ role: 'assistant', content: text });
});

userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendBtn.click();
});

// Initial greeting
setTimeout(() => {
  addMessage("Konnichiwa, senpai! What would you like to talk about today? (*^ω^)", false);
  applyEmotion('happy');
}, 1000);