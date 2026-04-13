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
  animateExpression(response.emotion, response.action);
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
          emotion: 'happy' | 'angry' | 'sad' | 'flustered' | 'neutral' | 'excited' | 'surprised';
          action?: 'blush' | 'cry' | 'laugh' | 'pout' | 'wink';
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

function animateExpression(emotion, action = null) {
  const svg = document.querySelector('.waifu-character');
  const eyes = document.querySelectorAll('.eye');
  const eyeWhites = document.querySelectorAll('.eye-white');
  const leftEyelid = document.querySelector('.left-eyelid');
  const rightEyelid = document.querySelector('.right-eyelid');
  const eyebrows = document.querySelectorAll('.eyebrow');
  const mouth = document.querySelector('.mouth');
  const leftBlush = document.querySelector('.left-blush');
  const rightBlush = document.querySelector('.right-blush');
  const leftArm = document.querySelector('.left-arm');
  const rightArm = document.querySelector('.right-arm');

  // Reset previous animations and states
  svg.classList.remove('animate__animated', 'animate__headShake', 'animate__bounce', 'animate__tada');
  leftEyelid.style.opacity = '0';
  rightEyelid.style.opacity = '0';
  leftBlush.style.opacity = '0';
  rightBlush.style.opacity = '0';

  // Reset arm positions
  leftArm.setAttribute('d', 'M120 190 Q90 220 70 300');
  rightArm.setAttribute('d', 'M180 190 Q210 220 230 300');

  // Apply emotion-specific animations
  switch(emotion) {
    case 'happy':
      mouth.setAttribute('d', 'M135 145 Q150 160 165 145');
      eyes.forEach(eye => {
        eye.setAttribute('cy', '108');
        eye.setAttribute('ry', '5');
      });
      eyebrows.forEach(eyebrow => {
        eyebrow.setAttribute('d', eyebrow.classList.contains('left-eyebrow') 
          ? 'M115 90 Q125 85 135 90' 
          : 'M165 90 Q175 85 185 90');
      });
      svg.classList.add('animate__animated', 'animate__bounce');
      break;
      
    case 'angry':
      mouth.setAttribute('d', 'M135 150 Q150 145 165 150');
      eyes.forEach(eye => {
        eye.setAttribute('r', '6');
      });
      eyebrows.forEach(eyebrow => {
        eyebrow.setAttribute('d', eyebrow.classList.contains('left-eyebrow') 
          ? 'M115 95 Q125 85 135 90' 
          : 'M165 90 Q175 85 185 95');
      });
      svg.classList.add('animate__animated', 'animate__headShake');
      // Arms akimbo
      leftArm.setAttribute('d', 'M120 190 Q90 200 80 230');
      rightArm.setAttribute('d', 'M180 190 Q210 200 220 230');
      break;
      
    case 'sad':
      mouth.setAttribute('d', 'M135 150 Q150 140 165 150');
      eyes.forEach(eye => {
        eye.setAttribute('cy', '115');
      });
      eyebrows.forEach(eyebrow => {
        eyebrow.setAttribute('d', eyebrow.classList.contains('left-eyebrow') 
          ? 'M115 100 Q125 105 135 100' 
          : 'M165 100 Q175 105 185 100');
      });
      break;
      
    case 'flustered':
      mouth.setAttribute('d', 'M140 150 Q150 155 160 150');
      leftBlush.style.opacity = '0.7';
      rightBlush.style.opacity = '0.7';
      eyebrows.forEach(eyebrow => {
        eyebrow.setAttribute('d', eyebrow.classList.contains('left-eyebrow') 
          ? 'M115 90 Q125 88 135 90' 
          : 'M165 90 Q175 88 185 90');
      });
      break;
      
    case 'excited':
      mouth.setAttribute('d', 'M135 145 Q150 165 165 145');
      eyes.forEach(eye => {
        eye.setAttribute('r', '8');
      });
      svg.classList.add('animate__animated', 'animate__tada');
      // Arms up in excitement
      leftArm.setAttribute('d', 'M120 190 Q100 160 90 120');
      rightArm.setAttribute('d', 'M180 190 Q200 160 210 120');
      break;
      
    case 'surprised':
      mouth.setAttribute('d', 'M140 150 Q150 160 160 150');
      eyes.forEach(eye => {
        eye.setAttribute('r', '9');
      });
      eyebrows.forEach(eyebrow => {
        eyebrow.setAttribute('d', eyebrow.classList.contains('left-eyebrow') 
          ? 'M115 85 Q125 80 135 85' 
          : 'M165 85 Q175 80 185 85');
      });
      break;
      
    default: // neutral
      mouth.setAttribute('d', 'M135 145 Q150 155 165 145');
      eyes.forEach(eye => {
        eye.setAttribute('cy', '110');
        eye.setAttribute('r', '7');
      });
      eyebrows.forEach(eyebrow => {
        eyebrow.setAttribute('d', eyebrow.classList.contains('left-eyebrow') 
          ? 'M115 95 Q125 90 135 95' 
          : 'M165 95 Q175 90 185 95');
      });
  }

  // Apply action-specific animations
  if (action) {
    switch(action) {
      case 'blush':
        leftBlush.style.opacity = '0.7';
        rightBlush.style.opacity = '0.7';
        break;
        
      case 'cry':
        const tears = document.createElementNS("http://www.w3.org/2000/svg", "path");
        tears.setAttribute('d', 'M125 120 Q124 130 125 140');
        tears.setAttribute('stroke', '#89CFF0');
        tears.setAttribute('stroke-width', '3');
        tears.setAttribute('fill', 'none');
        tears.setAttribute('class', 'tear-drop');
        svg.appendChild(tears);
        
        setTimeout(() => {
          tears.remove();
        }, 2000);
        break;
        
      case 'laugh':
        mouth.setAttribute('d', 'M135 145 Q150 170 165 145');
        eyes.forEach(() => {
          leftEyelid.style.opacity = '1';
          rightEyelid.style.opacity = '1';
        });
        break;
        
      case 'pout':
        mouth.setAttribute('d', 'M140 155 Q150 150 160 155');
        break;
        
      case 'wink':
        leftEyelid.style.opacity = '1';
        break;
    }
  }
}

// Handle user input with Enter key
userInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

// Initialize with greeting
window.onload = function() {
  addMessage("H-hey! Don't get the wrong idea, I just happened to be here!", 'bot');
  
  // Initial pose
  const leftArm = document.querySelector('.left-arm');
  const rightArm = document.querySelector('.right-arm');
  setTimeout(() => {
    // Light arm movement for idle animation
    leftArm.setAttribute('d', 'M120 190 Q95 220 75 290');
    rightArm.setAttribute('d', 'M180 190 Q205 220 225 290');
  }, 1000);
};