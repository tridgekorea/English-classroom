const App = (() => {
  let currentScenario = 'daily';
  let currentLevel = 'intermediate';
  let currentTopicId = null;
  let currentTopicPrompt = null;
  let currentTopicLabel = '';
  let currentSessionId = null;
  let autoSaveTimer = null;
  let isLoading = false;

  function init() {
    setupAPIKey();
    setupScenarios();
    setupLevel();
    setupInput();
    setupHint();
    setupSidebar();
    setupTheme();
    Chat.renderFeedbackHistory();
    showTopicPicker();
    Mic.init();
  }

  // ── API Key ──
  function setupAPIKey() {
    const modal = document.getElementById('api-modal');
    const keyInput = document.getElementById('api-key-input');
    const saveBtn = document.getElementById('api-key-save');
    const errorEl = document.getElementById('api-key-error');
    if (!API.getKey()) modal.classList.add('active');
    saveBtn.addEventListener('click', () => {
      const val = keyInput.value.trim();
      if (!val.startsWith('sk-')) { errorEl.textContent = 'API 키는 sk-로 시작해야 해요.'; return; }
      errorEl.textContent = '';
      API.saveKey(val);
      modal.classList.remove('active');
      keyInput.value = '';
    });
    keyInput.addEventListener('keydown', e => { if (e.key === 'Enter') saveBtn.click(); });
    document.getElementById('change-key-btn').addEventListener('click', () => {
      modal.classList.add('active'); keyInput.focus();
    });
  }

  // ── Scenarios ──
  function setupScenarios() {
    document.querySelectorAll('.scenario-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (isLoading) return;
        document.querySelectorAll('.scenario-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentScenario = btn.dataset.scenario;
        currentTopicId = null; currentTopicPrompt = null;
        showTopicPicker();
      });
    });
  }

  // ── Level ──
  function setupLevel() {
    document.querySelectorAll('.level-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentLevel = btn.dataset.level;
        document.getElementById('level-desc').textContent = LEVELS[currentLevel].description;
      });
    });
  }

  // ── Topic Picker ──
  function showTopicPicker() {
    const scen = SCENARIOS[currentScenario];
    const picker = document.getElementById('topic-picker');
    const chatArea = document.getElementById('chat-area');
    chatArea.style.display = 'none';
    picker.style.display = 'flex';

    picker.innerHTML = `
      <div class="tp-header">
        <span class="tp-emoji">${scen.emoji}</span>
        <div>
          <div class="tp-title">${scen.label}</div>
          <div class="tp-sub">${scen.description}</div>
        </div>
      </div>
      <div class="tp-grid">
        ${scen.topics.map(t => `
          <button class="tp-btn" data-id="${t.id}" data-prompt="${t.prompt || ''}">
            <span class="tp-icon">${t.icon}</span>
            <span class="tp-label">${t.label}</span>
          </button>
        `).join('')}
      </div>
      <div class="tp-custom" id="custom-area" style="display:none">
        <input type="text" id="custom-topic-input" placeholder="주제를 영어 또는 한국어로 입력하세요 (예: talking about K-pop)" maxlength="80" />
        <button id="custom-start-btn">시작</button>
      </div>
    `;

    picker.querySelectorAll('.tp-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        picker.querySelectorAll('.tp-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        if (id === 'custom') {
          document.getElementById('custom-area').style.display = 'flex';
          document.getElementById('custom-topic-input').focus();
        } else {
          document.getElementById('custom-area').style.display = 'none';
          currentTopicId = id;
          currentTopicPrompt = btn.dataset.prompt;
          currentTopicLabel = btn.querySelector('.tp-label').textContent;
          startConversation(null);
        }
      });
    });

    document.getElementById('custom-start-btn')?.addEventListener('click', () => {
      const val = document.getElementById('custom-topic-input').value.trim();
      if (!val) return;
      currentTopicId = 'custom';
      currentTopicPrompt = val;
      currentTopicLabel = val;
      startConversation(null);
    });

    document.getElementById('custom-topic-input')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('custom-start-btn').click();
    });
  }

  // ── Start Conversation (null = 새세션, session = 이어하기) ──
  function startConversation(resumeSession) {
    const picker = document.getElementById('topic-picker');
    const chatArea = document.getElementById('chat-area');
    picker.style.display = 'none';
    chatArea.style.display = 'flex';

    Chat.reset();

    if (resumeSession) {
      // 이어하기: 기존 세션 복원
      currentScenario = resumeSession.scenario;
      currentLevel = resumeSession.level;
      currentTopicId = resumeSession.topicId;
      currentTopicPrompt = resumeSession.topicPrompt;
      currentTopicLabel = resumeSession.topicLabel;
      currentSessionId = resumeSession.id;

      // 대화 내용 복원
      resumeSession.messages.forEach(msg => {
        Chat.addToHistory(msg.role, msg.content);
        if (msg.role === 'assistant') {
          const parsed = Chat.parseAIResponse(msg.content);
          Chat.renderAIMessage(parsed);
        } else {
          Chat.renderUserMessage(msg.content);
        }
      });
      // 피드백 히스토리 복원
      if (resumeSession.feedbacks) {
        resumeSession.feedbacks.forEach(f => Chat.addFeedbackDirect(f));
        Chat.renderFeedbackHistory();
      }
      // 턴 카운트 복원
      Chat.setTurnCount(resumeSession.turnCount || 0);

      // 이어하기 안내 메시지
      Chat.renderSystemMessage(`이전 세션을 불러왔어요. ${resumeSession.turnCount}턴부터 이어갑니다!`);
    } else {
      // 새 세션
      currentSessionId = null;
      const scen = SCENARIOS[currentScenario];
      const starter = getTopicStarter(currentScenario, currentTopicId, currentTopicPrompt);
      Chat.addToHistory('assistant', `[REPLY]\n${starter}\n\n[PRONUNCIATION]\n없음\n\n[FEEDBACK]\n`);
      Chat.renderAIMessage({ reply: starter, pronunciation: '', feedback: '' });
    }

    const scen = SCENARIOS[currentScenario];
    document.getElementById('scenario-label').textContent = `${scen.emoji} ${currentTopicLabel}`;
    updateSaveStatus('저장되지 않음');
    scheduleAutoSave();
  }

  // ── Auto Save ──
  function scheduleAutoSave() {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => doSave(true), 3000);
  }

  function doSave(auto = false) {
    const scen = SCENARIOS[currentScenario];
    const session = {
      id: currentSessionId,
      scenario: currentScenario,
      scenarioLabel: `${scen.emoji} ${scen.label}`,
      topicId: currentTopicId,
      topicLabel: currentTopicLabel,
      topicPrompt: currentTopicPrompt,
      level: currentLevel,
      messages: Chat.getHistory(),
      feedbacks: Chat.getFeedbackHistory(),
      turnCount: Chat.getTurnCount()
    };
    currentSessionId = Storage.saveSession(session);
    updateSaveStatus(auto ? '자동저장됨' : '저장완료 ✓');
    History.refresh();
  }

  function updateSaveStatus(text) {
    const el = document.getElementById('save-status');
    if (el) el.textContent = text;
  }

  // ── Input ──
  function setupInput() {
    const input = document.getElementById('user-input');
    document.getElementById('send-btn').addEventListener('click', handleSend);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    });
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    });

    document.getElementById('change-topic-btn').addEventListener('click', () => {
      if (isLoading) return;
      showTopicPicker();
    });

    document.getElementById('save-btn').addEventListener('click', () => {
      if (Chat.getTurnCount() === 0) return;
      doSave(false);
    });
  }

  // ── Hint ──
  function setupHint() {
    document.getElementById('hint-btn').addEventListener('click', async () => {
      const lastAI = [...Chat.getHistory()].reverse().find(m => m.role === 'assistant');
      if (!lastAI) return;
      const parsed = Chat.parseAIResponse(lastAI.content);
      try {
        const hint = await API.getHint(parsed.reply, currentLevel, currentTopicPrompt || currentScenario);
        document.getElementById('user-input').value = hint;
      } catch(e) {
        if (e.message === 'NO_KEY') document.getElementById('api-modal').classList.add('active');
      }
    });
  }

  // ── Sidebar (Feedback + History tabs) ──
  function setupSidebar() {
    document.getElementById('history-toggle').addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      const btn = document.getElementById('history-toggle');
      sidebar.classList.toggle('open');
      btn.classList.toggle('active');
      if (sidebar.classList.contains('open')) History.refresh();
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.tab;
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        document.getElementById('tab-' + tab).classList.add('active');
        if (tab === 'history') History.refresh();
      });
    });
  }

  // ── Send ──
  async function handleSend() {
    if (isLoading) return;
    if (!API.getKey()) { document.getElementById('api-modal').classList.add('active'); return; }
    const input = document.getElementById('user-input');
    const text = input.value.trim();
    if (!text) return;
    input.value = ''; input.style.height = 'auto';
    isLoading = true;
    document.getElementById('send-btn').disabled = true;
    document.getElementById('send-btn').textContent = '...';

    Chat.renderUserMessage(text);
    Chat.addToHistory('user', text);
    Chat.renderTyping();
    try {
      const raw = await API.sendMessage(Chat.getHistory(), buildSystemPrompt(currentScenario, currentLevel, currentTopicPrompt));
      Chat.removeTyping();
      const parsed = Chat.parseAIResponse(raw);
      Chat.addToHistory('assistant', raw);
      Chat.renderAIMessage(parsed);
      const turn = Chat.incrementTurn();
      Chat.addFeedback(text, parsed.feedback, turn);
      scheduleAutoSave();
    } catch(e) {
      Chat.removeTyping();
      if (e.message === 'NO_KEY' || e.message === 'INVALID_KEY') {
        document.getElementById('api-modal').classList.add('active');
      } else {
        Chat.renderAIMessage({ reply: '오류가 발생했어요. 다시 시도해주세요.', pronunciation: '', feedback: '' });
      }
    }
    isLoading = false;
    document.getElementById('send-btn').disabled = false;
    document.getElementById('send-btn').textContent = '보내기';
  }

  // ── Theme ──
  function setupTheme() {
    const saved = localStorage.getItem('speakup_theme') || 'dark';
    applyTheme(saved);
    document.querySelectorAll('.theme-dot').forEach(btn => {
      btn.addEventListener('click', () => {
        applyTheme(btn.dataset.theme);
        localStorage.setItem('speakup_theme', btn.dataset.theme);
      });
    });
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('.theme-dot').forEach(b => {
      b.classList.toggle('active', b.dataset.theme === theme);
    });
  }

  return { init, startConversation };
})();

// ── History Panel ──
const History = (() => {
  function refresh() {
    const list = document.getElementById('session-list');
    if (!list) return;
    const sessions = Storage.listSessions();
    if (sessions.length === 0) {
      list.innerHTML = '<p class="history__empty">저장된 세션이 없어요.<br>대화를 시작해보세요!</p>';
      return;
    }
    list.innerHTML = sessions.map(s => {
      const date = new Date(s.updatedAt);
      const dateStr = date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
      const timeStr = date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
      const levelLabel = { beginner: '초급', intermediate: '중급', advanced: '고급' }[s.level] || s.level;
      return `
        <div class="session-item" data-id="${s.id}">
          <div class="session-meta">${dateStr} ${timeStr} · ${levelLabel}</div>
          <div class="session-title">${s.scenarioLabel} &rsaquo; ${s.topicLabel}</div>
          <div class="session-turns">${s.turnCount}턴 완료</div>
          <div class="session-actions">
            <button class="sess-btn sess-resume" data-id="${s.id}">▶ 이어하기</button>
            <button class="sess-btn sess-review" data-id="${s.id}">📄 복습</button>
            <button class="sess-btn sess-delete" data-id="${s.id}">🗑</button>
          </div>
        </div>`;
    }).join('');

    list.querySelectorAll('.sess-resume').forEach(btn => {
      btn.addEventListener('click', () => {
        const session = Storage.loadSession(btn.dataset.id);
        if (session) {
          document.getElementById('sidebar').classList.remove('open');
          App.startConversation(session);
        }
      });
    });

    list.querySelectorAll('.sess-review').forEach(btn => {
      btn.addEventListener('click', () => {
        showReview(btn.dataset.id);
      });
    });

    list.querySelectorAll('.sess-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('이 세션을 삭제할까요?')) {
          Storage.deleteSession(btn.dataset.id);
          refresh();
        }
      });
    });
  }

  function showReview(id) {
    const session = Storage.loadSession(id);
    if (!session) return;
    const modal = document.getElementById('review-modal');
    const content = document.getElementById('review-content');

    const date = new Date(session.updatedAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
    const levelLabel = { beginner: '초급', intermediate: '중급', advanced: '고급' }[session.level] || session.level;

    let html = `<div class="review-header">
      <div class="review-title">${session.scenarioLabel} › ${session.topicLabel}</div>
      <div class="review-meta">${date} · ${levelLabel} · ${session.turnCount}턴</div>
    </div><div class="review-messages">`;

    session.messages.forEach(msg => {
      if (msg.role === 'user') {
        html += `<div class="rv-msg rv-user"><span class="rv-who">나</span><span class="rv-text">${esc(msg.content)}</span></div>`;
      } else {
        const parsed = parseForReview(msg.content);
        html += `<div class="rv-msg rv-ai">
          <span class="rv-who">AI</span>
          <div class="rv-inner">
            <div class="rv-text">${esc(parsed.reply)}</div>
            ${parsed.pronunciation && parsed.pronunciation !== '없음' ? `<div class="rv-pron">🔊 ${esc(parsed.pronunciation)}</div>` : ''}
            ${parsed.feedback ? `<div class="rv-fb">💬 ${esc(parsed.feedback)}</div>` : ''}
          </div>
        </div>`;
      }
    });

    html += '</div>';
    content.innerHTML = html;
    modal.classList.add('active');
  }

  function parseForReview(raw) {
    const rm = raw.match(/\[REPLY\]([\s\S]*?)(?=\[PRONUNCIATION\]|$)/);
    const pm = raw.match(/\[PRONUNCIATION\]([\s\S]*?)(?=\[REPLY\]|\[FEEDBACK\]|$)/);
    const fm = raw.match(/\[FEEDBACK\]([\s\S]*?)(?=\[REPLY\]|\[PRONUNCIATION\]|$)/);
    return {
      reply: rm ? rm[1].trim() : raw.trim(),
      pronunciation: pm ? pm[1].trim() : '',
      feedback: fm ? fm[1].trim() : ''
    };
  }

  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  return { refresh };
})();

document.addEventListener('DOMContentLoaded', () => {
  App.init();

  document.getElementById('review-close').addEventListener('click', () => {
    document.getElementById('review-modal').classList.remove('active');
  });
  document.getElementById('review-modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) e.currentTarget.classList.remove('active');
  });
});
