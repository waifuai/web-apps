import { BookGenerator } from './bookGenerator.js';
import { BookLibrary } from './bookLibrary.js';
import { UIManager } from './uiManager.js';
import { TocEditor } from './tocEditor.js';

const bookGenerator = new BookGenerator();
const bookLibrary = new BookLibrary();
const tocEditor = new TocEditor();
const uiManager = new UIManager(bookGenerator, bookLibrary, tocEditor);

window.addEventListener('load', () => {
  bookLibrary.loadBooks();
  uiManager.init();
});