export class BookLibrary {
  constructor() {
    this.books = [];
  }

  loadBooks() {
    const savedBooks = localStorage.getItem('aiBooks');
    if (savedBooks) {
      this.books = JSON.parse(savedBooks);
    }
  }

  saveBooks() {
    localStorage.setItem('aiBooks', JSON.stringify(this.books));
  }

  addBook(book) {
    const existingIndex = this.books.findIndex(b => b.title === book.title);
    if (existingIndex !== -1) {
      this.books[existingIndex] = book;
    } else {
      this.books.push(book);
    }
    this.saveBooks();
  }

  deleteBook(title) {
    this.books = this.books.filter(book => book.title !== title);
    this.saveBooks();
  }

  getBook(title) {
    return this.books.find(book => book.title === title);
  }

  getAllBooks() {
    return this.books;
  }

  getChapterCount(book) {
    if (!book || !book.toc) {
      return 0;
    }
    let count = 0;
    for (const chapter of book.toc) {
      for (const subChapter of chapter.subChapters) {
        if (subChapter.content) {
          count++;
        }
      }
    }
    return count;
  }

  getSubchapterCount(book) {
    if (!book || !book.toc) {
      return 0;
    }
    let count = 0;
    for (const chapter of book.toc) {
      for (const subChapter of chapter.subChapters) {
        if (subChapter.content) {
          count++;
        }
      }
    }
    return count;
  }
}