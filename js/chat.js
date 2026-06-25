const Chat = (() => {
  let history = [];
  let feedbackHistory = [];
  let turnCount = 0;

  function parseAIResponse(raw) {
    const get = (tag) => {
      const r = new RegExp(`\\[${tag}\\]([\\s\\S]*?)(?=\\[(?:REPLY|PRONUNCIATION|FEEDBACK|SUGGESTIONS|EXPRESSION)\\]|$)`);
      const m = raw.match(r);
      return m ? m[1].trim() : '';
    };
    return {
      reply:        get('REPLY'),
      pronunciation: get('PRONUNCIATION'),
      feedback:     get('FEEDBACK'),
      suggestions:  get('SUGGESTIONS'),
      expression:   get('EXPRESSION')
    };
  }

  function renderUserMessage(text) {
    append(`<div class="msg msg--user">
      <div class="msg__avatar msg__avatar--user">나</div>
      <div class="msg__bubble msg__bubble--user">${esc(text)}</div>
    </div>`);
  }

  function renderAIMessage(parsed) {
    // Pronunciation
    let pronHTML = '';
    if (parsed.pronunciation && parsed.pronunciation !== '없음') {
      const lines = parsed.pronunciation.split('\n').filter(l => l.trim());
      pronHTML = `<div class="msg__pronunciation">
        <span class="pron__label">🔊 발음 가이드</span>
        ${lines.map(l => `<div class="pron__line">${esc(l)}</div>`).join('')}
      </div>`;
    }

    // Feedback
    let fbHTML = '';
    if (parsed.feedback) {
      fbHTML = `<div class="msg__feedback">
        <span class="feedback__label">💬 피드백</span>
        <span class="feedback__text">${esc(parsed.feedback)}</span>
      </div>`;
    }

    // Suggestions (일반 대화)
    let sugHTML = '';
    if (parsed.suggestions) {
      const lines = parsed.suggestions.split('\n').filter(l => l.trim());
      sugHTML = `<div class="msg__suggestions">
        <span class="sug__label">💡 이렇게 말해볼 수 있어요</span>
        ${lines.map(l => {
          const text = l.replace(/^[ABC]\.\s*/,'').trim();
          return `<button class="sug__pill" onclick="Chat.fillInput(this)">${esc(text)}</button>`;
        }).join('')}
      </div>`;
    }

    // Expression (팝컬처)
    let exprHTML = '';
    if (parsed.expression) {
      const lines = parsed.expression.split('\n').filter(l => l.trim());
      exprHTML = `<div class="msg__expression">
        <span class="expr__label">🎬 실제 표현</span>
        ${lines.map(l => `<div class="expr__line">${esc(l)}</div>`).join('')}
      </div>`;
    }

    append(`<div class="msg msg--ai">
      <div class="msg__avatar msg__avatar--ai">AI</div>
      <div class="msg__content">
        <div class="msg__bubble msg__bubble--ai">${esc(parsed.reply || '...')}</div>
        ${pronHTML}${exprHTML}${sugHTML}${fbHTML}
      </div>
    </div>`);
  }

  function fillInput(btn) {
    const input = document.getElementById('user-input');
    input.value = btn.textContent;
    input.focus();
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  }

  function renderSystemMessage(text) {
    append(`<div class="msg msg--system">${esc(text)}</div>`);
  }

  function renderTyping() {
    const box = document.getElementById('chat-box');
    const el = document.createElement('div');
    el.className = 'msg msg--ai';
    el.id = 'typing-indicator';
    el.innerHTML = `<div class="msg__avatar msg__avatar--ai">AI</div>
      <div class="msg__bubble msg__bubble--ai typing-bubble"><span></span><span></span><span></span></div>`;
    box.appendChild(el);
    scrollBottom();
  }

  function removeTyping() { document.getElementById('typing-indicator')?.remove(); }

  function addToHistory(role, content) { history.push({ role, content }); }

  function addFeedback(userText, feedback, turnNum) {
    if (!feedback) return;
    const item = { userText, feedback, turn: turnNum, time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) };
    feedbackHistory.unshift(item);
    renderFeedbackHistory();
  }

  function addFeedbackDirect(item) { feedbackHistory.push(item); }

  function renderFeedbackHistory() {
    const panel = document.getElementById('feedback-list');
    if (!panel) return;
    if (feedbackHistory.length === 0) {
      panel.innerHTML = '<p class="history__empty">아직 피드백이 없어요.<br>대화를 시작해보세요!</p>';
      return;
    }
    panel.innerHTML = feedbackHistory.map(item => `
      <div class="history__item">
        <div class="history__meta">Turn ${item.turn} · ${item.time}</div>
        <div class="history__user">"${esc(item.userText)}"</div>
        <div class="history__feedback">${esc(item.feedback)}</div>
      </div>`).join('');
  }

  function reset() {
    history = []; feedbackHistory = []; turnCount = 0;
    document.getElementById('chat-box').innerHTML = '';
    document.getElementById('turn-count').textContent = '0';
    renderFeedbackHistory();
  }

  function incrementTurn() {
    turnCount++;
    document.getElementById('turn-count').textContent = turnCount;
    return turnCount;
  }

  function setTurnCount(n) {
    turnCount = n;
    document.getElementById('turn-count').textContent = n;
  }

  function append(html) {
    const box = document.getElementById('chat-box');
    box.insertAdjacentHTML('beforeend', html);
    scrollBottom();
  }

  function scrollBottom() {
    const box = document.getElementById('chat-box');
    box.scrollTop = box.scrollHeight;
  }

  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  return {
    parseAIResponse, renderUserMessage, renderAIMessage, renderSystemMessage,
    renderTyping, removeTyping, addToHistory, addFeedback, addFeedbackDirect,
    renderFeedbackHistory, reset, incrementTurn, setTurnCount, fillInput,
    getHistory: () => history,
    getTurnCount: () => turnCount,
    getFeedbackHistory: () => feedbackHistory
  };
})();
