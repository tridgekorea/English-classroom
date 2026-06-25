const Notes = (() => {
  const KEY = 'speakup_notes';

  function getAll() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch { return []; }
  }

  function save(all) {
    localStorage.setItem(KEY, JSON.stringify(all));
  }

  function add(phrase, meaning, tags = [], source = '') {
    const all = getAll();
    const note = {
      id: Date.now() + '_' + Math.random().toString(36).slice(2,6),
      phrase, meaning, tags, source,
      createdAt: new Date().toISOString()
    };
    all.unshift(note);
    save(all);
    return note;
  }

  function remove(id) {
    save(getAll().filter(n => n.id !== id));
  }

  function getRandom(count = 5) {
    const all = getAll();
    const shuffled = all.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  function render() {
    const grid = document.getElementById('notes-grid');
    if (!grid) return;
    const all = getAll();
    if (all.length === 0) {
      grid.innerHTML = '<div class="notes-empty">아직 저장된 표현이 없어요.<br>Question이나 Book&Show에서 표현을 저장해보세요!</div>';
      return;
    }
    grid.innerHTML = all.map(n => `
      <div class="note-card" data-id="${n.id}">
        <button class="note-card__delete" data-id="${n.id}" title="삭제">✕</button>
        <div class="note-card__phrase">${esc(n.phrase)}</div>
        <div class="note-card__meaning">${esc(n.meaning)}</div>
        <div class="note-card__tags">
          ${n.tags.map(t => `<span class="note-tag">${esc(t)}</span>`).join('')}
          ${n.source ? `<span class="note-tag">${esc(n.source)}</span>` : ''}
        </div>
      </div>`).join('');

    grid.querySelectorAll('.note-card__delete').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        if (confirm(`"${btn.dataset.id}" 삭제할까요?`)) {
          remove(btn.dataset.id);
          render();
        }
      });
    });
  }

  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  return { add, remove, getAll, getRandom, render };
})();
