export class WaifuBot {
  async generateAIResponse(input, dereType) {
    const exampleMap = {
      tsundere: 'Hmph! W-why would I care about that?! B-baka!',
      yandere: 'That sounds wonderful... just us together... forever... ♡',
      dandere: '...i think that would be nice... maybe...',
      kuudere: 'Analysis complete. Proposal seems acceptable.'
    };

    try {
      const response = await fetch('/api/ai_completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Generate a ${dereType}-style anime waifu response to: "${input}". 
          Include Japanese honorifics and anime tropes. Respond in 1-2 sentences.
          
          interface Response {
            response: string;
          }
          {
            "response": "${exampleMap[dereType]}"
          }`
        })
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      if (!data?.response) throw new Error('Invalid response format');
      
      return data.response;
    } catch (error) {
      console.error('AI API error:', error);
      return this.getFallbackResponse(dereType);
    }
  }

  getFallbackResponse(dereType) {
    const fallbacks = {
      tsundere: 'Ugh! N-not like I wanted to talk to you anyway!',
      yandere: 'Let\'s be together forever... no matter what...',
      dandere: '...okay...',
      kuudere: 'System error. Retry recommended.'
    };
    return fallbacks[dereType] || 'An error occurred... please try again.';
  }

  applyDereTransformations(response, dereType) {
    const transformations = {
      tsundere: (text) => text.replace(/\./g, '!').replace(/(\w)$/, '$1!'),
      yandere: (text) => text + (text.endsWith('♡') ? '' : ' ♡'),
      dandere: (text) => text.toLowerCase(),
      kuudere: (text) => text.split(' ').slice(0, 8).join(' ') + '...'
    };
    return (transformations[dereType] || ((t) => t))(response.trim());
  }
}

export const waifuBot = new WaifuBot();