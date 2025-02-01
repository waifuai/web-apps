import { waifuBot } from './bot.js';

class ChatUI {
  constructor() {
    this.chatMessages = document.getElementById('chatMessages');
    this.userInput = document.getElementById('userInput');
    this.sendButton = document.getElementById('sendButton');
    this.dereType = document.getElementById('dereType');
    
    this.sendButton.addEventListener('click', () => this.handleSend());
    this.userInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleSend();
    });
  }

  async handleSend() {
    const message = this.userInput.value.trim();
    if (!message) return;

    this.appendMessage(message, 'user-message');
    this.userInput.value = '';

    try {
      const dere = this.dereType.value;
      const aiResponse = await waifuBot.generateAIResponse(message, dere);
      const transformedResponse = waifuBot.applyDereTransformations(aiResponse, dere);
      
      setTimeout(() => {
        this.appendMessage(transformedResponse, 'bot-message');
      }, 800);
    } catch (error) {
      console.error('Chat error:', error);
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
}

new ChatUI();