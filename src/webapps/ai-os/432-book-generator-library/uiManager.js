export class UIManager {
  constructor(bookGenerator, bookLibrary, tocEditor) {
    this.bookGenerator = bookGenerator;
    this.bookLibrary = bookLibrary;
    this.tocEditor = tocEditor;
    this.currentToc = null;
    this.currentTitle = '';
    this.currentSubtitle = '';
    this.sortOrder = 'date'; // Default sort order
    this.editMode = true; // Default to edit mode for TOC
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
    document.getElementById('toggleEditMode').addEventListener('click', () => this.toggleEditMode());
  }

  toggleEditMode() {
    this.editMode = !this.editMode;
    const btnToggle = document.getElementById('toggleEditMode');
    const tocEditorElement = document.getElementById('tocEditor');
    
    if (this.editMode) {
      btnToggle.textContent = 'View Mode';
      btnToggle.classList.remove('view-mode');
      btnToggle.classList.add('edit-mode');
      tocEditorElement.classList.add('edit-mode');
      tocEditorElement.classList.remove('view-mode');
    } else {
      btnToggle.textContent = 'Edit Mode';
      btnToggle.classList.remove('edit-mode');
      btnToggle.classList.add('view-mode');
      tocEditorElement.classList.remove('edit-mode');
      tocEditorElement.classList.add('view-mode');
    }
    
    this.updateTocDisplay();
  }

  updateTocDisplay() {
    if (!this.currentToc) return;
    
    const tocEditorElement = document.getElementById('tocEditor');
    if (this.editMode) {
      tocEditorElement.innerHTML = this.tocEditor.createEditorHTML(this.currentToc);
      this.tocEditor.setupEditorListeners(tocEditorElement);
    } else {
      this.tocEditor.createViewableHTML(this.currentToc, tocEditorElement);
    }
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

      const suggestionsHtml = suggestions.map(titleData =>
        `<div class="title-suggestion-card" onclick="document.getElementById('bookTitle').value = '${titleData.title.replace(/'/g, "\\'")}'; document.getElementById('bookSubtitle').value = '${titleData.subtitle.replace(/'/g, "\\'")}'; window.uiManager.previewTitleChange('${titleData.title.replace(/'/g, "\\'")}', '${titleData.subtitle.replace(/'/g, "\\'")}')">
          <div class="title-main">${titleData.title}</div>
          <div class="title-subtitle">${titleData.subtitle}</div>
        </div>`
      ).join('');

      document.getElementById('titleSuggestions').innerHTML = suggestionsHtml;
      this.showStatus('', '');
    } catch (error) {
      this.showStatus('Error generating titles: ' + error.message, 'error');
    }
  }

  previewTitleChange(title, subtitle) {
    const previewTitle = document.getElementById('previewTitle');
    if (previewTitle) {
      previewTitle.innerHTML = `
        <h1>${title}</h1>
        <h2>${subtitle}</h2>
      `;
    }
  }

  async handleTocGeneration() {
    const title = document.getElementById('bookTitle').value.trim();
    const subtitle = document.getElementById('bookSubtitle').value.trim();

    if (!title) {
      this.showStatus('Please enter a book title', 'error');
      return;
    }

    try {
      this.showStatus('Generating table of contents...', 'loading');
      const toc = await this.bookGenerator.generateTableOfContents(title, subtitle);
      this.currentToc = toc;
      this.currentTitle = title;
      this.currentSubtitle = subtitle;

      this.updateTocDisplay();

      // Initialize progress tracker
      this.updateGenerationProgress();
      
      this.showStatus('', '');
      this.updatePreview();
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
        this.currentSubtitle,
        this.currentToc,
        (updatedToc, chapterIndex, subChapterIndex) => {
          this.currentToc = updatedToc;
          this.updatePreview();
          this.updateGenerationProgress();
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

  updateGenerationProgress() {
    if (!this.currentToc) return;

    const progressDiv = document.getElementById('generationProgress');
    
    let totalSubchapters = 0;
    let completedSubchapters = 0;
    
    this.currentToc.forEach(chapter => {
      chapter.subChapters.forEach(subChapter => {
        totalSubchapters++;
        if (subChapter.content) {
          completedSubchapters++;
        }
      });
    });
    
    const percentage = totalSubchapters > 0 ? Math.round((completedSubchapters / totalSubchapters) * 100) : 0;
    
    progressDiv.innerHTML = `
      <div class="progress-stats">
        <span>${completedSubchapters} of ${totalSubchapters} subchapters generated (${percentage}%)</span>
      </div>
      <div class="progress-bar-container">
        <div class="progress-bar" style="width: ${percentage}%"></div>
      </div>
    `;
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
      subtitle: this.currentSubtitle,
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
    preview.innerHTML = `
      <div id="previewTitle">
        <h1>${this.currentTitle}</h1>
        ${this.currentSubtitle ? `<h2>${this.currentSubtitle}</h2>` : ''}
      </div>
      ${marked.parse(markdown)}
    `;
  }

  generateMarkdown() {
    if (!this.currentToc) return '';

    let markdown = `# ${this.currentTitle}\n\n`;
    if (this.currentSubtitle) {
      markdown += `## ${this.currentSubtitle}\n\n`;
    }
    
    markdown += '<a id="toc"></a>\n\n';
    markdown += '## Table of Contents\n\n';

    this.currentToc.forEach((chapter, i) => {
      const chapterSlug = this.slugify(chapter.title);
      markdown += `- [${chapter.title}](#${chapterSlug})\n`;
      chapter.subChapters.forEach((subChapter, j) => {
        const subChapterSlug = this.slugify(subChapter.title);
        markdown += `  - [${subChapter.title}](#${subChapterSlug})\n`;
      });
    });

    markdown += '\n---\n\n';

    this.currentToc.forEach(chapter => {
      const chapterSlug = this.slugify(chapter.title);
      markdown += `<a id="${chapterSlug}"></a>\n\n`;
      markdown += `# ${chapter.title} [↑](#toc)\n\n`;
      
      chapter.subChapters.forEach(subChapter => {
        const subChapterSlug = this.slugify(subChapter.title);
        markdown += `<a id="${subChapterSlug}"></a>\n\n`;
        markdown += `## ${subChapter.title} [↑](#toc)\n\n`;
        
        if (subChapter.content) {
          markdown += `${subChapter.content}\n\n`;
        } else {
          markdown += `*Content not yet generated*\n\n`;
        }
      });
    });

    return markdown;
  }

  slugify(text) {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')           // Replace spaces with -
      .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
      .replace(/\-\-+/g, '-')         // Replace multiple - with single -
      .replace(/^-+/, '')             // Trim - from start of text
      .replace(/-+$/, '');            // Trim - from end of text
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
      const totalSubchapterCount = book.toc.reduce((sum, chapter) => sum + chapter.subChapters.length, 0);
      const lastModifiedDate = new Date(book.lastModified).toLocaleString();
      const percentComplete = Math.round((subchapterCount / totalSubchapterCount) * 100);

      return `
        <div class="book-entry">
          <div class="book-info">
            <div class="book-title">${book.title}</div>
            ${book.subtitle ? `<div class="book-subtitle">${book.subtitle}</div>` : ''}
            <div class="book-stats">
              <div class="book-progress">
                <div class="progress-bar-mini-container">
                  <div class="progress-bar-mini" style="width: ${percentComplete}%"></div>
                </div>
                <span>Subchapters generated: ${subchapterCount}/${totalSubchapterCount} (${percentComplete}%)</span>
              </div>
              <div>Last updated: ${lastModifiedDate}</div>
            </div>
          </div>
          <div class="book-controls">
            <button onclick="window.uiManager.loadBook('${book.title.replace(/'/g, "\\'")}')">Load</button>
            <button class="delete-btn" onclick="window.uiManager.deleteBook('${book.title.replace(/'/g, "\\'")}')">Delete</button>
          </div>
        </div>
      `;
    }).join('');
  }

  loadBook(title) {
    const book = this.bookLibrary.getBook(title);
    if (book) {
      this.currentTitle = book.title;
      this.currentSubtitle = book.subtitle || '';
      this.currentToc = book.toc;

      document.getElementById('bookTitle').value = book.title;
      document.getElementById('bookSubtitle').value = book.subtitle || '';
      
      this.updateTocDisplay();
      this.updateGenerationProgress();
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
    this.currentSubtitle = '';
    this.currentToc = null;

    document.getElementById('bookTitle').value = '';
    document.getElementById('bookSubtitle').value = '';
    document.getElementById('tocEditor').innerHTML = '';
    document.getElementById('markdownPreview').innerHTML = '';
    document.getElementById('generationProgress').innerHTML = '';
    document.getElementById('titleSuggestions').innerHTML = '';

    this.showStatus('Book cleared', '');
  }
}