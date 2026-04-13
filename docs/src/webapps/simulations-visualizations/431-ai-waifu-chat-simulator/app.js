import anime from 'https://cdn.skypack.dev/animejs@3.2.1';

const emotions = {
  happy: {
    mouth: 'M135 145 Q150 160 165 145',
    eyebrows: {
      left: 'M110 90 Q125 85 140 90',
      right: 'M160 90 Q175 85 190 90'
    },
    eyes: 'scaleY(1)',
    blush: '0.7',
    effects: ['✨', '🌸', '💕'],
    bodyColor: '#ffccdd',
    hairColor: '#9a7ebf'
  },
  angry: {
    mouth: 'M135 155 Q150 145 165 155',
    eyebrows: {
      left: 'M110 85 Q125 75 140 90',
      right: 'M160 90 Q175 75 190 85'
    },
    eyes: 'scaleY(0.7)',
    blush: '0.3',
    effects: ['💢', '🔥', '😤'],
    bodyColor: '#ffb3b3',
    hairColor: '#8a5ead'
  },
  sad: {
    mouth: 'M135 155 Q150 145 165 155',
    eyebrows: {
      left: 'M110 95 Q125 100 140 95',
      right: 'M160 95 Q175 100 190 95'
    },
    eyes: 'scaleY(0.8)',
    blush: '0.2',
    effects: ['💧', '🌧️', '😢'],
    bodyColor: '#c6e2ff',
    hairColor: '#8477a5'
  },
  neutral: {
    mouth: 'M140 145 Q150 148 160 145',
    eyebrows: {
      left: 'M110 90 Q125 90 140 90',
      right: 'M160 90 Q175 90 190 90'
    },
    eyes: 'scaleY(1)',
    blush: '0.3',
    effects: ['✨'],
    bodyColor: '#ffccdd',
    hairColor: '#9a7ebf'
  }
};

const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const waifuSvg = document.getElementById('waifu-svg');
const effectsContainer = document.getElementById('effects');

let conversationHistory = [];

// Start periodic blinking
setInterval(() => {
  anime({
    targets: '.eye-pupil',
    scaleY: [
      { value: 1, duration: 100 },
      { value: 0.1, duration: 100 },
      { value: 1, duration: 100 }
    ],
    easing: 'easeInOutQuad'
  });
}, 4000);

// Initial body sway animation
anime({
  targets: '#waifu-svg',
  translateY: ['0px', '-5px', '0px'],
  duration: 3000,
  loop: true,
  easing: 'easeInOutQuad'
});

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
    targets: '#left-eyebrow',
    d: [{ value: config.eyebrows.left }],
    easing: 'easeInOutQuad',
    duration: 500
  });

  anime({
    targets: '#right-eyebrow',
    d: [{ value: config.eyebrows.right }],
    easing: 'easeInOutQuad',
    duration: 500
  });

  anime({
    targets: '.eye-pupil',
    scaleY: config.eyes,
    duration: 300,
    easing: 'easeInOutQuad'
  });

  anime({
    targets: '.blush',
    opacity: config.blush,
    duration: 500,
    easing: 'easeInOutQuad'
  });

  // Add emotional effects
  config.effects.forEach(effect => {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', Math.random() * 150 + 75);
    text.setAttribute('y', Math.random() * 100 + 150);
    text.setAttribute('class', 'emotional-effect');
    text.textContent = effect;
    effectsContainer.appendChild(text);
    
    setTimeout(() => text.remove(), 3000);
  });

  // Update body color
  anime({
    targets: '.body',
    fill: config.bodyColor,
    duration: 1000,
    easing: 'easeInOutQuad'
  });

  // Update hair color
  anime({
    targets: ['.hair-front', '.hair-back', '.hair-strand-1', '.hair-strand-2', '.hair-bangs'],
    fill: config.hairColor,
    stroke: config.hairColor,
    duration: 1000,
    easing: 'easeInOutQuad'
  });

  // Additional animations based on emotions
  if (emotion === 'happy') {
    anime({
      targets: '#waifu-svg',
      rotate: ['0deg', '2deg', '-2deg', '0deg'],
      duration: 1000,
      easing: 'easeInOutQuad'
    });
  } else if (emotion === 'angry') {
    anime({
      targets: '#waifu-svg',
      translateX: ['0px', '-5px', '5px', '-3px', '3px', '0px'],
      duration: 500,
      easing: 'easeInOutQuad'
    });
  } else if (emotion === 'sad') {
    anime({
      targets: '#waifu-svg',
      translateY: ['0px', '5px', '0px'],
      duration: 1000,
      easing: 'easeInOutQuad'
    });
  }
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