import { waifuBot } from './bot.js';

class ChatUI {
  constructor() {
    this.chatMessages = document.getElementById('chatMessages');
    this.userInput = document.getElementById('userInput');
    this.sendButton = document.getElementById('sendButton');
    this.dereType = document.getElementById('dereType');
    this.themeToggle = document.getElementById('themeToggle');
    this.typingIndicator = null; // Will be set in updateAvatar
    this.waifuAvatar = document.getElementById('waifuAvatar');
    this.clearButton = document.getElementById('clearButton');
    
    // Event listeners
    this.sendButton.addEventListener('click', () => this.handleSend());
    this.userInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleSend();
    });
    this.clearButton.addEventListener('click', () => this.clearChat());
    this.themeToggle.addEventListener('change', () => this.toggleTheme());
    this.dereType.addEventListener('change', () => this.updateAvatar());
    
    // Initialize
    this.userInput.focus();
    this.loadThemePreference();
    this.updateAvatar();
    
    // Auto-welcome message after a short delay
    setTimeout(() => {
      this.userInput.focus();
    }, 500);
  }

  async handleSend() {
    const message = this.userInput.value.trim();
    if (!message) return;

    this.appendMessage(message, 'user-message');
    this.userInput.value = '';
    this.userInput.focus();

    // Show typing indicator
    this.typingIndicator.classList.add('active');

    try {
      const dere = this.dereType.value;
      const aiResponse = await waifuBot.generateAIResponse(message, dere);
      const transformedResponse = waifuBot.applyDereTransformations(aiResponse, dere);
      
      // Hide typing indicator and show response
      setTimeout(() => {
        this.typingIndicator.classList.remove('active');
        this.appendMessage(transformedResponse, 'bot-message');
        // Animate avatar when responding
        this.playAvatarAnimation(dere);
      }, 1000 + Math.random() * 1000); // Random delay to feel more natural
    } catch (error) {
      console.error('Chat error:', error);
      this.typingIndicator.classList.remove('active');
      this.appendMessage("An error occurred... please try again!", 'bot-message');
    }
  }

  appendMessage(text, className) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${className}`;
    messageDiv.textContent = text;
    this.chatMessages.appendChild(messageDiv);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  clearChat() {
    // Keep only the welcome message
    while (this.chatMessages.children.length > 1) {
      this.chatMessages.removeChild(this.chatMessages.lastChild);
    }
  }

  toggleTheme() {
    document.body.classList.toggle('dark-theme');
    localStorage.setItem('darkTheme', this.themeToggle.checked);
    this.updateAvatar();
  }

  loadThemePreference() {
    const darkTheme = localStorage.getItem('darkTheme') === 'true';
    this.themeToggle.checked = darkTheme;
    if (darkTheme) {
      document.body.classList.add('dark-theme');
    }
  }

  playAvatarAnimation(dereType) {
    const avatar = this.waifuAvatar.querySelector('svg');
    if (!avatar) return;
    
    avatar.classList.add('animate-avatar');
    
    // Apply animation based on dere type
    const mouthPath = avatar.querySelector('.mouth');
    const eyeLeft = avatar.querySelector('.eye-left');
    const eyeRight = avatar.querySelector('.eye-right');
    
    switch(dereType) {
      case 'tsundere':
        mouthPath.setAttribute('d', 'M 38 65 Q 50 55 62 65'); // Angry to smiling
        break;
      case 'yandere':
        eyeLeft.setAttribute('d', 'M 30 40 C 32 37 38 37 40 40');
        eyeRight.setAttribute('d', 'M 60 40 C 62 37 68 37 70 40');
        break;
      case 'dandere':
        mouthPath.setAttribute('d', 'M 40 63 Q 50 68 60 63'); // Slight smile
        break;
      case 'kuudere':
        mouthPath.setAttribute('d', 'M 38 62 L 62 62'); // Straight line
        break;
    }
    
    // Reset after animation
    setTimeout(() => {
      avatar.classList.remove('animate-avatar');
      this.updateAvatar();
    }, 1000);
  }

  updateAvatar() {
    const dereType = this.dereType.value;
    const isDarkTheme = document.body.classList.contains('dark-theme');
    
    // Colors based on theme and personality
    let fillColor, outlineColor, blushColor, eyeColor, hairColor;
    
    // Set styles based on dere type
    switch(dereType) {
      case 'tsundere':
        fillColor = isDarkTheme ? "#ff758f" : "#ffb3c1";
        outlineColor = isDarkTheme ? "#404040" : "#333333";
        blushColor = isDarkTheme ? "#ff5252" : "#ff8080";
        eyeColor = isDarkTheme ? "#404040" : "#333333";
        hairColor = isDarkTheme ? "#ff9e80" : "#ffcc80";
        break;
      case 'yandere':
        fillColor = isDarkTheme ? "#ffcdd2" : "#ffecb3";
        outlineColor = isDarkTheme ? "#404040" : "#333333";
        blushColor = isDarkTheme ? "#ff5252" : "#ff8080";
        eyeColor = isDarkTheme ? "#e53935" : "#d32f2f";
        hairColor = isDarkTheme ? "#ff867c" : "#ef9a9a";
        break;
      case 'dandere':
        fillColor = isDarkTheme ? "#bbdefb" : "#e3f2fd";
        outlineColor = isDarkTheme ? "#404040" : "#333333";
        blushColor = isDarkTheme ? "#90caf9" : "#bbdefb";
        eyeColor = isDarkTheme ? "#404040" : "#333333";
        hairColor = isDarkTheme ? "#a1887f" : "#bcaaa4";
        break;
      case 'kuudere':
        fillColor = isDarkTheme ? "#b3e5fc" : "#e1f5fe";
        outlineColor = isDarkTheme ? "#404040" : "#333333";
        blushColor = "none";
        eyeColor = isDarkTheme ? "#404040" : "#333333";
        hairColor = isDarkTheme ? "#90caf9" : "#bbdefb";
        break;
    }
    
    // Create SVG for each personality type
    let svgContent = '';
    let eyeLeftPath, eyeRightPath, mouthPath, extraElements = '';
    
    switch(dereType) {
      case 'tsundere':
        eyeLeftPath = 'M 32 40 C 34 36 39 36 41 40';
        eyeRightPath = 'M 59 40 C 61 36 66 36 68 40';
        mouthPath = 'M 40 62 Q 50 72 60 62';
        extraElements = `
          <path class="hair-front" d="M 30 20 C 20 30 20 50 25 60 C 10 40 15 20 30 20 Z" fill="${hairColor}" />
          <path class="hair-front" d="M 70 20 C 80 30 80 50 75 60 C 90 40 85 20 70 20 Z" fill="${hairColor}" />
          <path class="hair-tie" d="M 24 33 C 29 38 29 45 24 50 C 19 45 19 38 24 33 Z" fill="#ff5252" />
          <path class="hair-tie" d="M 76 33 C 71 38 71 45 76 50 C 81 45 81 38 76 33 Z" fill="#ff5252" />
          <circle class="blush-left" cx="30" cy="50" r="8" fill="${blushColor}" opacity="0.5" />
          <circle class="blush-right" cx="70" cy="50" r="8" fill="${blushColor}" opacity="0.5" />
        `;
        break;
      case 'yandere':
        eyeLeftPath = 'M 32 40 C 34 35 39 35 41 40';
        eyeRightPath = 'M 59 40 C 61 35 66 35 68 40';
        mouthPath = 'M 40 60 Q 50 65 60 60';
        extraElements = `
          <path class="hair-front" d="M 25 15 C 15 25 15 45 20 70 C 5 50 5 20 25 15 Z" fill="${hairColor}" />
          <path class="hair-front" d="M 75 15 C 85 25 85 45 80 70 C 95 50 95 20 75 15 Z" fill="${hairColor}" />
          <line x1="40" y1="36" x2="30" y2="32" stroke="${outlineColor}" stroke-width="1" />
          <line x1="60" y1="36" x2="70" y2="32" stroke="${outlineColor}" stroke-width="1" />
          <circle class="blush-left" cx="30" cy="50" r="8" fill="${blushColor}" opacity="0.5" />
          <circle class="blush-right" cx="70" cy="50" r="8" fill="${blushColor}" opacity="0.5" />
          <path class="heart" d="M 48 75 C 45 72 40 75 40 78 C 40 81 43 83 48 80 C 53 83 56 81 56 78 C 56 75 51 72 48 75 Z" fill="#ff0066" opacity="0.8" />
        `;
        break;
      case 'dandere':
        eyeLeftPath = 'M 35 42 A 3 3 0 1 1 35 41.9';
        eyeRightPath = 'M 65 42 A 3 3 0 1 1 65 41.9';
        mouthPath = 'M 40 65 Q 50 60 60 65';
        extraElements = `
          <path class="hair-front" d="M 30 15 C 15 25 20 50 25 65 C 10 45 10 20 30 15 Z" fill="${hairColor}" />
          <path class="hair-front" d="M 70 15 C 85 25 80 50 75 65 C 90 45 90 20 70 15 Z" fill="${hairColor}" />
          <path class="hair-front" d="M 50 15 C 40 15 35 20 35 25 L 65 25 C 65 20 60 15 50 15 Z" fill="${hairColor}" />
          <circle class="blush-left" cx="30" cy="50" r="6" fill="${blushColor}" opacity="0.4" />
          <circle class="blush-right" cx="70" cy="50" r="6" fill="${blushColor}" opacity="0.4" />
        `;
        break;
      case 'kuudere':
        eyeLeftPath = 'M 32 40 L 41 40';
        eyeRightPath = 'M 59 40 L 68 40';
        mouthPath = 'M 40 62 L 60 62';
        extraElements = `
          <path class="hair-front" d="M 25 20 C 15 30 18 50 25 70 C 10 50 8 20 25 20 Z" fill="${hairColor}" />
          <path class="hair-front" d="M 75 20 C 85 30 82 50 75 70 C 90 50 92 20 75 20 Z" fill="${hairColor}" />
          <path class="glasses" d="M 30 40 C 25 40 25 40 20 40 L 20 39 L 80 39 L 80 40 C 75 40 75 40 70 40" fill="none" stroke="${outlineColor}" stroke-width="1" />
        `;
        break;
    }
    
    // Base SVG with different expressions
    svgContent = `
      <svg viewBox="0 0 100 100" width="120" height="120">
        <defs>
          <radialGradient id="faceGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stop-color="${fillColor}" />
            <stop offset="100%" stop-color="${fillColor}" stop-opacity="0.9" />
          </radialGradient>
        </defs>
        
        <!-- Hair back -->
        <path class="hair-back" d="M 50 10 C 25 10 10 30 10 50 C 10 60 15 75 25 85 C 15 65 15 45 30 25 C 35 20 45 15 50 15 C 55 15 65 20 70 25 C 85 45 85 65 75 85 C 85 75 90 60 90 50 C 90 30 75 10 50 10 Z" fill="${hairColor}" />
        
        <!-- Face -->
        <circle cx="50" cy="50" r="40" fill="url(#faceGradient)" stroke="${outlineColor}" stroke-width="1.5" />
        
        <!-- Extra elements for personality type -->
        ${extraElements}
        
        <!-- Eyes -->
        <path class="eye-left" d="${eyeLeftPath}" stroke="${eyeColor}" stroke-width="2" fill="none" />
        <path class="eye-right" d="${eyeRightPath}" stroke="${eyeColor}" stroke-width="2" fill="none" />
        
        <!-- Mouth -->
        <path class="mouth" d="${mouthPath}" stroke="${outlineColor}" stroke-width="2" fill="none" />
      </svg>
      <div class="typing-indicator" id="typingIndicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;
    
    this.waifuAvatar.innerHTML = svgContent;
    
    // Update typing indicator reference
    this.typingIndicator = document.getElementById('typingIndicator');
  }
}

new ChatUI();