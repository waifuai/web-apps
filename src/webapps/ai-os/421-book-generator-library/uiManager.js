export class UIManager {
  constructor(bookGenerator, bookLibrary, tocEditor) {
    this.bookGenerator = bookGenerator;
    this.bookLibrary = bookLibrary;
    this.tocEditor = tocEditor;
    this.currentToc = null;
    this.currentTitle = '';
    this.sortOrder = 'date'; // Default sort order
    window.uiManager = this; // Make uiManager globally accessible
  }

  init() {
    this.setupEventListeners();
    this.updateLibraryDisplay();
  }

  setupEventListeners() {
    document.getElementById('generateTitles').addEventListener('click', () => this.handleTitleGeneration());
    document.getElementById('generateToc').addEventListener('click', () => this.handleTocGeneration());
    document.getElementById('startGeneration').addEventListener('click', () => this.handleContentGeneration());
    document.getElementById('pauseGeneration').addEventListener('click', () => this.handlePauseGeneration());
    document.getElementById('copyMarkdown').addEventListener('click', () => this.handleCopyMarkdown());
    document.getElementById('saveToLibrary').addEventListener('click', () => this.handleSaveToLibrary());
    document.getElementById('clearBook').addEventListener('click', () => this.handleClearBook());
    document.getElementById('sortByAlpha').addEventListener('click', () => this.handleSortByAlpha());
    document.getElementById('sortByDate').addEventListener('click', () => this.handleSortByDate());
  }

  async handleTitleGeneration() {
    const titleInput = document.getElementById('bookTitle');
    const baseTitle = titleInput.value.trim();

    if (!baseTitle) {
      this.showStatus('Please enter a book title or topic', 'error');
      return;
    }

    try {
      this.showStatus('Generating title suggestions...', 'loading');
      const suggestions = await this.bookGenerator.generateTitleSuggestions(baseTitle);

      const suggestionsHtml = suggestions.map(title =>
        `<button class="title-suggestion" onclick="document.getElementById('bookTitle').value = '${title.replace(/'/g, "\\'")}'">
          ${title}
        </button>`
      ).join('');

      document.getElementById('titleSuggestions').innerHTML = suggestionsHtml;
      this.showStatus('', '');
    } catch (error) {
      this.showStatus('Error generating titles: ' + error.message, 'error');
    }
  }

  async handleTocGeneration() {
    const title = document.getElementById('bookTitle').value.trim();

    if (!title) {
      this.showStatus('Please enter a book title', 'error');
      return;
    }

    try {
      this.showStatus('Generating table of contents...', 'loading');
      const toc = await this.bookGenerator.generateTableOfContents(title);
      this.currentToc = toc;
      this.currentTitle = title;

      const tocEditorElement = document.getElementById('tocEditor');
      tocEditorElement.innerHTML = this.tocEditor.createEditorHTML(toc);
      this.tocEditor.setupEditorListeners(tocEditorElement);

      this.showStatus('', '');
    } catch (error) {
      this.showStatus('Error generating table of contents: ' + error.message, 'error');
    }
  }

  async handleContentGeneration() {
    if (!this.currentToc) {
      this.showStatus('Please generate a table of contents first', 'error');
      return;
    }

    try {
      this.showStatus('Generating content...', 'loading');
      document.getElementById('startGeneration').disabled = true;
      document.getElementById('pauseGeneration').disabled = false;

      await this.bookGenerator.generateBook(
        this.currentTitle,
        this.currentToc,
        (updatedToc, chapterIndex, subChapterIndex) => {
          this.currentToc = updatedToc;
          this.updatePreview();
          this.showStatus(
            `Generating: Chapter ${chapterIndex + 1}.${subChapterIndex + 1}`,
            'loading'
          );
        }
      );

      this.showStatus('Generation complete!', '');
      document.getElementById('startGeneration').disabled = false;
      document.getElementById('pauseGeneration').disabled = true;
    } catch (error) {
      this.showStatus('Error generating content: ' + error.message, 'error');
      document.getElementById('startGeneration').disabled = false;
      document.getElementById('pauseGeneration').disabled = true;
    }
  }

  handlePauseGeneration() {
    if (this.bookGenerator.isGenerating) {
      this.bookGenerator.pauseGeneration();
      document.getElementById('pauseGeneration').textContent = 'Resume Generation';
      this.showStatus('Generation paused', '');
    } else {
      this.bookGenerator.resumeGeneration();
      document.getElementById('pauseGeneration').textContent = 'Pause Generation';
      this.handleContentGeneration();
    }
  }

  handleCopyMarkdown() {
    const markdown = this.generateMarkdown();
    navigator.clipboard.writeText(markdown).then(() => {
      this.showStatus('Markdown copied to clipboard!', '');
    }).catch(err => {
      this.showStatus('Failed to copy markdown: ' + err.message, 'error');
    });
  }

  handleSaveToLibrary() {
    if (!this.currentTitle || !this.currentToc) {
      this.showStatus('No book to save', 'error');
      return;
    }

    const book = {
      title: this.currentTitle,
      toc: this.currentToc,
      lastModified: new Date().toISOString()
    };

    this.bookLibrary.addBook(book);
    this.updateLibraryDisplay();
    this.showStatus('Book saved to library!', '');
  }

  handleSortByAlpha() {
    this.sortOrder = 'alpha';
    this.updateLibraryDisplay();
  }

  handleSortByDate() {
    this.sortOrder = 'date';
    this.updateLibraryDisplay();
  }

  updatePreview() {
    const markdown = this.generateMarkdown();
    const preview = document.getElementById('markdownPreview');
    preview.innerHTML = marked.parse(markdown);
  }

  generateMarkdown() {
    if (!this.currentToc) return '';

    let markdown = `# ${this.currentTitle}\n\n`;
    markdown += '## Table of Contents\n\n';

    this.currentToc.forEach((chapter, i) => {
      markdown += `${chapter.title}\n`;
      chapter.subChapters.forEach((subChapter, j) => {
        markdown += `  ${subChapter.title}\n`;
      });
      markdown += '\n';
    });

    markdown += '\n## Content\n\n';

    this.currentToc.forEach(chapter => {
      markdown += `# ${chapter.title}\n\n`;
      chapter.subChapters.forEach(subChapter => {
        if (subChapter.content) {
          markdown += `${subChapter.content}\n\n`;
        }
      });
    });

    return markdown;
  }

  updateLibraryDisplay() {
    const libraryDiv = document.getElementById('bookLibrary');
    let books = this.bookLibrary.getAllBooks();

    if (this.sortOrder === 'alpha') {
      books.sort((a, b) => a.title.localeCompare(b.title));
    } else if (this.sortOrder === 'date') {
      books.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
    }

    libraryDiv.innerHTML = books.map(book => {
      const subchapterCount = this.bookLibrary.getSubchapterCount(book);
      const lastModifiedDate = new Date(book.lastModified).toLocaleString();

      return `
        <div class="book-entry">
          <div class="book-info">
            <div class="book-title">${book.title}</div>
            <div class="book-stats">
              Subchapters generated: ${subchapterCount}, Last updated: ${lastModifiedDate}
            </div>
          </div>
          <div class="book-controls">
            <button onclick="window.uiManager.loadBook('${book.title.replace(/'/g, "\\'")}')">Load</button>
            <button onclick="window.uiManager.deleteBook('${book.title.replace(/'/g, "\\'")}')">Delete</button>
          </div>
        </div>
      `;
    }).join('');
  }

  loadBook(title) {
    const book = this.bookLibrary.getBook(title);
    if (book) {
      this.currentTitle = book.title;
      this.currentToc = book.toc;

      document.getElementById('bookTitle').value = book.title;
      const tocEditorElement = document.getElementById('tocEditor');
      tocEditorElement.innerHTML = this.tocEditor.createEditorHTML(book.toc);
      this.tocEditor.setupEditorListeners(tocEditorElement);

      this.updatePreview();
      this.showStatus('Book loaded!', '');
    }
  }

  deleteBook(title) {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      this.bookLibrary.deleteBook(title);
      this.updateLibraryDisplay();
      this.showStatus('Book deleted from library', '');
    }
  }

  showStatus(message, type) {
    const statusDiv = document.getElementById('apiStatus');
    statusDiv.textContent = message;
    statusDiv.className = type;
  }

  handleClearBook() {
    this.currentTitle = '';
    this.currentToc = null;

    document.getElementById('bookTitle').value = '';
    document.getElementById('tocEditor').innerHTML = '';
    document.getElementById('markdownPreview').innerHTML = '';

    this.showStatus('Book cleared', '');
  }
}