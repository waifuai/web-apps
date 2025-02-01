'use strict';

// Global state for current book generation
let currentBook = {
  id: null,
  title: '',
  tocMarkdown: '',
  // array of generated subchapters objects: { chapterTitle, subchapterTitle, content }
  subchapters: [],
  // pointers for current generation step
  currentChapterIndex: 0,
  currentSubchapterIndex: 0,
  // toc as parsed structure: array of chapters, where each chapter has { chapterTitle, subchapters: [] }
  tocStructure: []
};

let abortController = null;
let generationPaused = false;

document.addEventListener('DOMContentLoaded', () => {
  // attach event listeners
  document.getElementById('btnGenerateTOC').addEventListener('click', handleGenerateTOC);
  document.getElementById('btnGenerateSubchapter').addEventListener('click', handleGenerateSubchapter);
  document.getElementById('btnPause').addEventListener('click', handlePause);
  document.getElementById('btnCopyMarkdown').addEventListener('click', handleCopyMarkdown);
  document.getElementById('btnSaveBook').addEventListener('click', saveCurrentBook);
  document.getElementById('btnClearBook').addEventListener('click', clearCurrentBook);
  document.getElementById('sortLibrary').addEventListener('change', populateLibrary);
  
  // update markdown preview when markdown output changes
  document.getElementById('markdownOutput').addEventListener('input', updatePreview);
  
  // load library from localStorage
  populateLibrary();
});

// Utility: display loading status
function setStatus(message, isError = false) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.style.color = isError ? 'red' : '#555';
}

// Utility: Update markdown preview using marked library
function updatePreview() {
  const markdown = document.getElementById('markdownOutput').value;
  const previewDiv = document.getElementById('markdownPreview');
  previewDiv.innerHTML = marked.parse(markdown);
}

// Utility: parse TOC markdown into structure. Expects chapters to be indicated with "#", and subchapters as list items starting with "-".
function parseTOC(markdown) {
  const lines = markdown.split('\n');
  const toc = [];
  let currentChapter = null;
  lines.forEach(line => {
    if (line.startsWith('# ')) {
      // New chapter
      if (currentChapter) toc.push(currentChapter);
      currentChapter = { chapterTitle: line.replace(/^#\s*/, '').trim(), subchapters: [] };
    } else if (line.startsWith('-')) {
      if (currentChapter) {
        currentChapter.subchapters.push(line.replace(/^-+/, '').trim());
      }
    }
  });
  if (currentChapter) toc.push(currentChapter);
  return toc;
}

// Handler: generate table of contents and title suggestions using the built in AI
async function handleGenerateTOC() {
  const titleInput = document.getElementById('bookTitle').value.trim();
  if (!titleInput) {
    alert('Please enter a book title or topic.');
    return;
  }
  setStatus('Generating table of contents, please wait...');
  
  // Build prompt for AI
  const prompt = `Given the book title/topic "${titleInput}", suggest three alternative book titles and generate a table of contents for a 10-chapter book, each with about 5 subchapters. Provide the table of contents in markdown format with chapters starting with "# " and subchapters as list items starting with "-".`;
  
  try {
    const response = await callAI(prompt);
    // Assume AI returns markdown text with suggestions and toc separated by a divider "===="
    // For example: "Suggestions:\n- Title Alternative 1\n- Title Alternative 2\n- Title Alternative 3\n====\n# Chapter 1: ...\n..."
    let suggestionsText = "";
    let tocMarkdown = "";
    if (response.includes('====')) {
      const parts = response.split('====');
      suggestionsText = parts[0].replace(/Suggestions:\s*/i, '').trim();
      tocMarkdown = parts[1].trim();
    } else {
      tocMarkdown = response.trim();
    }
    // update suggestions area if any suggestions returned
    const suggestionsDiv = document.getElementById('suggestions');
    suggestionsDiv.innerHTML = suggestionsText ? `<strong>Title Suggestions:</strong><br>${suggestionsText.replace(/\n/g, '<br>')}` : '';
    
    document.getElementById('tocInput').value = tocMarkdown;
    // update currentBook state
    currentBook.id = Date.now().toString();
    currentBook.title = titleInput;
    currentBook.tocMarkdown = tocMarkdown;
    currentBook.subchapters = [];
    currentBook.currentChapterIndex = 0;
    currentBook.currentSubchapterIndex = 0;
    currentBook.tocStructure = parseTOC(tocMarkdown);
    document.getElementById('markdownOutput').value = generateMarkdownOutput();
    updatePreview();
    setStatus('TOC generated successfully.');
  } catch (error) {
    console.error(error);
    setStatus('Error generating TOC.', true);
  }
}

// Handler: generate the next subchapter using AI
async function handleGenerateSubchapter() {
  // if already waiting, do nothing
  if (abortController) return;
  
  // Refresh tocStructure from the editable tocInput in case user changed it
  const tocText = document.getElementById('tocInput').value;
  currentBook.tocMarkdown = tocText;
  currentBook.tocStructure = parseTOC(tocText);
  
  const toc = currentBook.tocStructure;
  if (!toc.length) {
    alert('Please generate a valid table of contents first.');
    return;
  }
  
  // Check if all subchapters generated
  if (currentBook.currentChapterIndex >= toc.length) {
    setStatus('All subchapters have been generated.');
    return;
  }
  
  const chapter = toc[currentBook.currentChapterIndex];
  if (currentBook.currentSubchapterIndex >= chapter.subchapters.length) {
    // Move to next chapter
    currentBook.currentChapterIndex++;
    currentBook.currentSubchapterIndex = 0;
    if (currentBook.currentChapterIndex >= toc.length) {
      setStatus('All subchapters generated.');
      return;
    }
  }
  
  const currentCh = toc[currentBook.currentChapterIndex];
  const currentSub = currentCh.subchapters[currentBook.currentSubchapterIndex];
  
  setStatus(`Generating: ${currentCh.chapterTitle} > ${currentSub}`);
  document.getElementById('btnPause').disabled = false;
  
  // Build prompt for subchapter content
  const prompt = `Write the subchapter "${currentSub}" for the book titled "${currentBook.title}". The full table of contents is:
${currentBook.tocMarkdown}
Make the content engaging and detailed.`;
  
  // Setup abort controller to support pausing
  abortController = new AbortController();
  generationPaused = false;
  
  try {
    const response = await callAI(prompt, abortController.signal);
    // Append generated subchapter to currentBook
    currentBook.subchapters.push({
      chapterTitle: currentCh.chapterTitle,
      subchapterTitle: currentSub,
      content: response.trim()
    });
    // Update pointers for next generation
    currentBook.currentSubchapterIndex++;
    // Append to markdown output
    let newMarkdown = document.getElementById('markdownOutput').value;
    newMarkdown += `\n\n# ${currentCh.chapterTitle}\n## ${currentSub}\n\n${response.trim()}\n`;
    document.getElementById('markdownOutput').value = newMarkdown;
    updatePreview();
    setStatus(`Subchapter "${currentSub}" generated.`);
  } catch (error) {
    if (error.name === 'AbortError') {
      setStatus('Generation paused.');
    } else {
      console.error(error);
      setStatus('Error generating subchapter.', true);
    }
  } finally {
    abortController = null;
    document.getElementById('btnPause').disabled = true;
  }
}

// Handler: pause the generation (abort the current API call)
function handlePause() {
  if (abortController) {
    abortController.abort();
    generationPaused = true;
    document.getElementById('btnPause').disabled = true;
  }
}

// Function to copy markdown output to clipboard
function handleCopyMarkdown() {
  const markdownText = document.getElementById('markdownOutput').value;
  navigator.clipboard.writeText(markdownText).then(() => {
    setStatus('Markdown copied to clipboard.');
  }).catch(err => {
    console.error(err);
    setStatus('Failed to copy markdown.', true);
  });
}

// Function to generate complete markdown output from currentBook state
function generateMarkdownOutput() {
  let md = `# ${currentBook.title}\n\n`;
  // Optionally, include TOC
  md += `## Table of Contents\n\n${currentBook.tocMarkdown}\n\n`;
  currentBook.subchapters.forEach(sc => {
    md += `# ${sc.chapterTitle}\n`;
    md += `## ${sc.subchapterTitle}\n\n${sc.content}\n\n`;
  });
  return md;
}

// Function to save/update the current book into local storage
function saveCurrentBook() {
  if (!currentBook.id) {
    alert('No book to save. Please generate a book first.');
    return;
  }
  // add/update currentBook in library array in localStorage
  let library = JSON.parse(localStorage.getItem('bookLibrary')) || [];
  const index = library.findIndex(b => b.id === currentBook.id);
  const timestamp = new Date().toISOString();
  const bookEntry = {
    id: currentBook.id,
    title: currentBook.title,
    tocMarkdown: currentBook.tocMarkdown,
    subchapters: currentBook.subchapters,
    updatedAt: timestamp
  };
  if (index > -1) {
    library[index] = bookEntry;
  } else {
    library.push(bookEntry);
  }
  localStorage.setItem('bookLibrary', JSON.stringify(library));
  setStatus('Book saved to library.');
  populateLibrary();
}

// Function to clear the current book
function clearCurrentBook() {
  if (confirm('Are you sure you want to clear the current book? Unsaved changes will be lost.')) {
    currentBook = {
      id: null,
      title: '',
      tocMarkdown: '',
      subchapters: [],
      currentChapterIndex: 0,
      currentSubchapterIndex: 0,
      tocStructure: []
    };
    document.getElementById('bookTitle').value = '';
    document.getElementById('tocInput').value = '';
    document.getElementById('markdownOutput').value = '';
    document.getElementById('suggestions').innerHTML = '';
    updatePreview();
    setStatus('Cleared current book.');
  }
}

// Function to populate the library list from localStorage
function populateLibrary() {
  const libraryContainer = document.getElementById('libraryList');
  libraryContainer.innerHTML = '';
  let library = JSON.parse(localStorage.getItem('bookLibrary')) || [];
  
  // sorting
  const sortBy = document.getElementById('sortLibrary').value;
  if (sortBy === 'alpha') {
    library.sort((a, b) => a.title.localeCompare(b.title));
  } else {
    library.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }
  
  if (!library.length) {
    libraryContainer.textContent = 'No books in library.';
    return;
  }
  
  library.forEach(book => {
    const div = document.createElement('div');
    div.className = 'library-book';
    const info = document.createElement('div');
    info.innerHTML = `<strong>${book.title}</strong><br>
      Subchapters Generated: ${book.subchapters.length}<br>
      Last Updated: ${new Date(book.updatedAt).toLocaleString()}`;
    
    const actions = document.createElement('div');
    const loadBtn = document.createElement('button');
    loadBtn.textContent = 'Load';
    loadBtn.addEventListener('click', () => loadBook(book.id));
    
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deleteBook(book.id));
    
    actions.appendChild(loadBtn);
    actions.appendChild(deleteBtn);
    div.appendChild(info);
    div.appendChild(actions);
    libraryContainer.appendChild(div);
  });
}

// Function to load a book from library into the current UI
function loadBook(bookId) {
  let library = JSON.parse(localStorage.getItem('bookLibrary')) || [];
  const book = library.find(b => b.id === bookId);
  if (!book) return;
  
  currentBook = {
    id: book.id,
    title: book.title,
    tocMarkdown: book.tocMarkdown,
    subchapters: book.subchapters,
    currentChapterIndex: book.subchapters.length ? computeNextIndices(book) : 0,
    currentSubchapterIndex: 0,
    tocStructure: parseTOC(book.tocMarkdown)
  };
  document.getElementById('bookTitle').value = currentBook.title;
  document.getElementById('tocInput').value = currentBook.tocMarkdown;
  document.getElementById('markdownOutput').value = generateMarkdownOutput();
  updatePreview();
  setStatus(`Loaded book: ${currentBook.title}`);
}

// Helper to compute next indices based on already generated subchapters
function computeNextIndices(book) {
  // Calculate total subchapters from parsed toc
  const toc = parseTOC(book.tocMarkdown);
  let totalSubs = toc.reduce((acc, cur) => acc + cur.subchapters.length, 0);
  let generated = book.subchapters.length;
  // Walk through toc to find position
  let chapterIndex = 0;
  let subchapterIndex = 0;
  let count = 0;
  for (let i = 0; i < toc.length; i++) {
    for (let j = 0; j < toc[i].subchapters.length; j++) {
      count++;
      if (count > generated) {
        chapterIndex = i;
        subchapterIndex = j;
                return { chapterIndex, subchapterIndex };
      }
    }
  }
  return { chapterIndex: toc.length, subchapterIndex: 0 };
}

// Function to delete a book from library
function deleteBook(bookId) {
  if (!confirm('Are you sure you want to delete this book?')) return;
  let library = JSON.parse(localStorage.getItem('bookLibrary')) || [];
  library = library.filter(b => b.id !== bookId);
  localStorage.setItem('bookLibrary', JSON.stringify(library));
  populateLibrary();
  setStatus('Book deleted from library.');
}

// Function to call the built in AI via /api/ai_completion
async function callAI(prompt, signal) {
  // Show spinner in status
  setStatus('Waiting for AI response...');
  // Simulate API call to /api/ai_completion using fetch
  const response = await fetch('/api/ai_completion', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    signal: signal,
    body: JSON.stringify({
      prompt: prompt,
      // For simplicity, we pass prompt as data as well.
      data: prompt
    })
  });
  if (!response.ok) {
    throw new Error('AI API responded with error.');
  }
  const resJson = await response.json();
  // expect resJson to have a property "response" with the text
  return resJson.response;
}