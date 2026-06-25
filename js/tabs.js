const Tabs = (() => {
  const TAB_IDS = ['conversation', 'bookshow', 'diary', 'question', 'mynote', 'practice'];

  function init() {
    document.querySelectorAll('.tab-item').forEach(btn => {
      btn.addEventListener('click', () => switchTo(btn.dataset.tab));
    });
    switchTo('conversation');
  }

  function switchTo(tabId) {
    // Update tab buttons
    document.querySelectorAll('.tab-item').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
    // Update content panels
    document.querySelectorAll('.tab-content').forEach(p => p.classList.toggle('active', p.dataset.tab === tabId));
    // Update body accent
    document.body.setAttribute('data-tab', tabId);
    // Update turn counter visibility
    const turnEl = document.getElementById('turn-area');
    if (turnEl) turnEl.style.display = tabId === 'conversation' ? 'flex' : 'none';
    // Update logo accent
    const logo = document.querySelector('.header__logo span');
    if (logo) logo.style.color = 'var(--tab-accent)';
    // Trigger tab-specific init if needed
    if (tabId === 'mynote') Notes.render();
    if (tabId === 'practice') PracticeTab.onEnter();
  }

  return { init, switchTo };
})();
