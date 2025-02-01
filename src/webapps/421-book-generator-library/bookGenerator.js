export class BookGenerator {
  constructor() {
    this.currentBook = null;
    this.isPaused = false;
    this.isGenerating = false;
  }

  async generateTitleSuggestions(baseTitle) {
    try {
      const response = await fetch('/api/ai_completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Generate 5 creative book title suggestions based on this topic/title: "${baseTitle}".
          
          interface Response {
            titles: string[];
          }
          
          {
            "titles": [
              "The Hidden Realms of Time",
              "Whispers in the Digital Wind",
              "Chronicles of the Silicon Dawn",
              "Binary Dreams",
              "The Algorithm's Promise"
            ]
          }`,
          data: baseTitle
        })
      });
      
      const data = await response.json();
      return data.titles;
    } catch (error) {
      console.error('Error generating titles:', error);
      throw error;
    }
  }

  async generateTableOfContents(title) {
    try {
      const response = await fetch('/api/ai_completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Generate a table of contents for a book titled "${title}" with 10 chapters and 5 subchapters each.
          
          interface SubChapter {
            title: string;
            content?: string;
          }
          
          interface Chapter {
            title: string;
            subChapters: SubChapter[];
          }
          
          interface Response {
            chapters: Chapter[];
          }
          
          {
            "chapters": [
              {
                "title": "Chapter 1: The Beginning",
                "subChapters": [
                  {"title": "1.1 First Steps"},
                  {"title": "1.2 Early Challenges"},
                  {"title": "1.3 Initial Discoveries"},
                  {"title": "1.4 Foundation Building"},
                  {"title": "1.5 Moving Forward"}
                ]
              }
            ]
          }`,
          data: title
        })
      });
      
      const data = await response.json();
      return data.chapters;
    } catch (error) {
      console.error('Error generating TOC:', error);
      throw error;
    }
  }

  async generateSubChapterContent(title, toc, chapterIndex, subChapterIndex) {
    try {
      const chapter = toc[chapterIndex];
      const subChapter = chapter.subChapters[subChapterIndex];
      
      const response = await fetch('/api/ai_completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Write the content for subchapter ${chapter.title} - ${subChapter.title} of the book "${title}".
          Write in markdown format. Be detailed and engaging. Include relevant examples and explanations.
          
          interface Response {
            content: string;
          }
          
          {
            "content": "## 1.1 First Steps\n\nIn the beginning, there was an idea. An idea that would transform...\n\nThrough careful consideration and planning..."
          }`,
          data: {
            title,
            toc,
            currentChapter: chapter,
            currentSubChapter: subChapter
          }
        })
      });
      
      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('Error generating content:', error);
      throw error;
    }
  }

  async generateBook(title, toc, progressCallback) {
    this.isGenerating = true;
    this.isPaused = false;
    
    for (let i = 0; i < toc.length; i++) {
      for (let j = 0; j < toc[i].subChapters.length; j++) {
        if (this.isPaused) {
          return;
        }
        
        try {
          const content = await this.generateSubChapterContent(title, toc, i, j);
          toc[i].subChapters[j].content = content;
          if (progressCallback) {
            progressCallback(toc, i, j);
          }
        } catch (error) {
          console.error('Error in generation:', error);
          throw error;
        }
      }
    }
    
    this.isGenerating = false;
    return toc;
  }

  pauseGeneration() {
    this.isPaused = true;
  }

  resumeGeneration() {
    this.isPaused = false;
  }
}