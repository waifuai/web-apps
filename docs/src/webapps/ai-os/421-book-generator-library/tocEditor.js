export class TocEditor {
  constructor() {
    this.toc = [];
  }

  createEditorHTML(toc) {
    this.toc = toc;
    let html = '';
    
    toc.forEach((chapter, i) => {
      html += `
        <div class="chapter-item">
          <div class="editable" data-type="chapter" data-index="${i}">${chapter.title}</div>
          ${chapter.subChapters.map((subChapter, j) => `
            <div class="subchapter-item">
              <div class="editable" data-type="subchapter" data-chapter="${i}" data-index="${j}">
                ${subChapter.title}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    });
    
    return html;
  }

  setupEditorListeners(element) {
    const editables = element.querySelectorAll('.editable');
    
    editables.forEach(editable => {
      editable.addEventListener('click', () => {
        const currentText = editable.textContent.trim();
        const input = document.createElement('input');
        input.value = currentText;
        input.style.width = '100%';
        
        const saveEdit = () => {
          const newText = input.value.trim();
          if (newText && newText !== currentText) {
            const type = editable.dataset.type;
            const chapterIndex = parseInt(type === 'chapter' ? editable.dataset.index : editable.dataset.chapter);
            
            if (type === 'chapter') {
              this.toc[chapterIndex].title = newText;
            } else {
              const subChapterIndex = parseInt(editable.dataset.index);
              this.toc[chapterIndex].subChapters[subChapterIndex].title = newText;
            }
          }
          editable.textContent = newText || currentText;
          input.remove();
        };
        
        input.addEventListener('blur', saveEdit);
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            saveEdit();
          }
        });
        
        editable.textContent = '';
        editable.appendChild(input);
        input.focus();
      });
    });
  }

  getToc() {
    return this.toc;
  }
}