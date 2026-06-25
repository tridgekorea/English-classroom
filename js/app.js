const App = (() => {
  let currentScenario = 'daily';
  let currentLevel = 'intermediate';
  let currentTopicId = null;
  let currentTopicPrompt = null;
  let currentTopicLabel = '';
  let currentSessionId = null;
  let phrasalVerbs = '';
  let autoSaveTimer = null;
  let isLoading = false;

  function init() {
    setupAPIKey();
    setupScenarios();
    setupLevel();
    setupInput();
    setupHint();
    setupSidebar();
    Tabs.init();
    BookShow.init();
    DiaryTab.init();
    QuestionTab.init();
    PracticeTab.init();
    setupNoteInput();
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
    document.getElementById('change-key-btn').addEventListener('click', () => { modal.classList.add('active'); keyInput.focus(); });
  }

  // ── Scenarios ──
  function setupScenarios() {
    document.querySelectorAll('.scenario-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (isLoading) return;
        document.querySelectorAll('.scenario-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentScenario = btn.dataset.scenario;
        currentTopicId = null; currentTopicPrompt = null; phrasalVerbs = '';
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
        <div><div class="tp-title">${scen.label}</div><div class="tp-sub">${scen.description}</div></div>
      </div>
      <div class="tp-grid">
        ${scen.topics.map(t => `
          <button class="tp-btn" data-id="${t.id}" data-prompt="${t.prompt||''}" ${t.isPhrasal?'data-phrasal="true"':''}>
            <span class="tp-icon">${t.icon}</span>
            <span class="tp-label">${t.label}</span>
          </button>`).join('')}
      </div>
      <div class="tp-custom" id="custom-area" style="display:none">
        <input type="text" id="custom-topic-input" placeholder="주제를 입력하세요..." maxlength="100"/>
        <button class="tp-start-btn" id="custom-start-btn">시작</button>
      </div>
      <div class="tp-custom" id="phrasal-area" style="display:none">
        <input type="text" id="phrasal-input" placeholder="구동사 입력 (예: give up, look forward to)" maxlength="200"/>
        <button class="tp-start-btn" id="phrasal-start-btn">연습 시작</button>
      </div>`;

    picker.querySelectorAll('.tp-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        picker.querySelectorAll('.tp-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        document.getElementById('custom-area').style.display = 'none';
        document.getElementById('phrasal-area').style.display = 'none';
        if (id === 'pv_input') {
          document.getElementById('phrasal-area').style.display = 'flex';
          document.getElementById('phrasal-input').focus();
        } else if (id === 'custom') {
          document.getElementById('custom-area').style.display = 'flex';
          document.getElementById('custom-topic-input').focus();
        } else {
          currentTopicId = id;
          currentTopicPrompt = btn.dataset.prompt;
          currentTopicLabel = btn.querySelector('.tp-label').textContent;
          phrasalVerbs = btn.dataset.prompt || '';
          startConversation(null);
        }
      });
    });

    document.getElementById('custom-start-btn')?.addEventListener('click', () => {
      const val = document.getElementById('custom-topic-input').value.trim();
      if (!val) return;
      currentTopicId = 'custom'; currentTopicPrompt = val; currentTopicLabel = val;
      startConversation(null);
    });
    document.getElementById('phrasal-start-btn')?.addEventListener('click', () => {
      const val = document.getElementById('phrasal-input').value.trim();
      if (!val) return;
      currentTopicId = 'pv_input'; currentTopicPrompt = val;
      currentTopicLabel = `구동사: ${val}`; phrasalVerbs = val;
      startConversation(null);
    });
    document.getElementById('custom-topic-input')?.addEventListener('keydown', e => { if(e.key==='Enter') document.getElementById('custom-start-btn').click(); });
    document.getElementById('phrasal-input')?.addEventListener('keydown', e => { if(e.key==='Enter') document.getElementById('phrasal-start-btn').click(); });
  }

  // ── Start / Resume Conversation ──
  function startConversation(resumeSession) {
    document.getElementById('topic-picker').style.display = 'none';
    const chatArea = document.getElementById('chat-area');
    chatArea.style.display = 'flex';
    Chat.reset();

    if (resumeSession) {
      currentScenario = resumeSession.scenario;
      currentLevel = resumeSession.level;
      currentTopicId = resumeSession.topicId;
      currentTopicPrompt = resumeSession.topicPrompt;
      currentTopicLabel = resumeSession.topicLabel;
      currentSessionId = resumeSession.id;
      phrasalVerbs = resumeSession.phrasalVerbs || '';
      resumeSession.messages.forEach(msg => {
        Chat.addToHistory(msg.role, msg.content);
        if (msg.role === 'assistant') Chat.renderAIMessage(Chat.parseAIResponse(msg.content));
        else Chat.renderUserMessage(msg.content);
      });
      if (resumeSession.feedbacks) { resumeSession.feedbacks.forEach(f => Chat.addFeedbackDirect(f)); Chat.renderFeedbackHistory(); }
      Chat.setTurnCount(resumeSession.turnCount || 0);
      Chat.renderSystemMessage(`이전 세션 ${resumeSession.turnCount}턴부터 이어갑니다!`);
    } else {
      currentSessionId = null;
      const starter = getTopicStarter(currentScenario, currentTopicId, currentTopicPrompt);
      Chat.addToHistory('assistant', `[REPLY]\n${starter}\n\n[SUGGESTIONS]\n\n[PRONUNCIATION]\n없음\n\n[FEEDBACK]\n`);
      Chat.renderAIMessage({ reply: starter, suggestions: '', pronunciation: '', feedback: '', expression: '' });
    }

    const scen = SCENARIOS[currentScenario];
    document.getElementById('scenario-label').textContent = `${scen.emoji} ${currentTopicLabel}`;
    updateSaveStatus('');
    scheduleAutoSave();
  }

  function scheduleAutoSave() { clearTimeout(autoSaveTimer); autoSaveTimer = setTimeout(() => doSave(true), 3000); }

  function doSave(auto = false) {
    if (Chat.getTurnCount() === 0) return;
    const scen = SCENARIOS[currentScenario];
    const session = {
      id: currentSessionId, scenario: currentScenario,
      scenarioLabel: `${scen.emoji} ${scen.label}`,
      topicId: currentTopicId, topicLabel: currentTopicLabel, topicPrompt: currentTopicPrompt,
      level: currentLevel, messages: Chat.getHistory(),
      feedbacks: Chat.getFeedbackHistory(), turnCount: Chat.getTurnCount(), phrasalVerbs
    };
    currentSessionId = Storage.saveSession(session);
    updateSaveStatus(auto ? '자동저장됨' : '저장 ✓');
    ConvHistory.refresh();
  }

  function updateSaveStatus(t) { const el = document.getElementById('save-status'); if(el) el.textContent = t; }

  // ── Input ──
  function setupInput() {
    const input = document.getElementById('user-input');
    document.getElementById('send-btn').addEventListener('click', handleSend);
    input.addEventListener('keydown', e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSend();} });
    input.addEventListener('input', () => { input.style.height='auto'; input.style.height=Math.min(input.scrollHeight,120)+'px'; });
    document.getElementById('change-topic-btn').addEventListener('click', () => { if(!isLoading) showTopicPicker(); });
    document.getElementById('save-btn').addEventListener('click', () => doSave(false));
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
      } catch(e) { if(e.message==='NO_KEY') document.getElementById('api-modal').classList.add('active'); }
    });
  }

  // ── Sidebar ──
  function setupSidebar() {
    document.getElementById('history-toggle').addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      sidebar.classList.toggle('open');
      document.getElementById('history-toggle').classList.toggle('active');
      if (sidebar.classList.contains('open')) ConvHistory.refresh();
    });
    document.querySelectorAll('.stab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.stab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.stab-panel').forEach(p => p.classList.remove('active'));
        document.getElementById('stab-' + btn.dataset.tab).classList.add('active');
        if (btn.dataset.tab === 'history') ConvHistory.refresh();
      });
    });
  }

  // ── My Note input ──
  function setupNoteInput() {
    document.getElementById('note-add-btn')?.addEventListener('click', async () => {
      const input = document.getElementById('note-input');
      const phrase = input.value.trim();
      if (!phrase) return;
      const key = API.getKey();
      if (!key) { document.getElementById('api-modal').classList.add('active'); return; }

      input.disabled = true;
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-6', max_tokens: 300,
            messages: [{ role: 'user', content: `Explain "${phrase}" in 1 Korean sentence (meaning + typical usage). Reply only with the Korean explanation, nothing else.` }]
          })
        });
        const data = await res.json();
        const meaning = data.content?.[0]?.text?.trim() || '';
        Notes.add(phrase, meaning, ['표현'], 'My Note');
        Notes.render();
        input.value = '';
      } catch(e) {}
      input.disabled = false;
    });

    document.getElementById('note-input')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('note-add-btn').click();
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
      const raw = await API.sendMessage(Chat.getHistory(), buildSystemPrompt(currentScenario, currentLevel, currentTopicPrompt, phrasalVerbs));
      Chat.removeTyping();
      const parsed = Chat.parseAIResponse(raw);
      Chat.addToHistory('assistant', raw);
      Chat.renderAIMessage(parsed);
      const turn = Chat.incrementTurn();
      Chat.addFeedback(text, parsed.feedback, turn);
      scheduleAutoSave();
    } catch(e) {
      Chat.removeTyping();
      if (e.message === 'NO_KEY' || e.message === 'INVALID_KEY') document.getElementById('api-modal').classList.add('active');
      else Chat.renderAIMessage({ reply: '오류가 발생했어요. 다시 시도해주세요.', suggestions:'', pronunciation:'', feedback:'', expression:'' });
    }
    isLoading = false;
    document.getElementById('send-btn').disabled = false;
    document.getElementById('send-btn').textContent = '보내기';
  }

  return { init, startConversation };
})();

// ── Conversation History Panel ──
const ConvHistory = (() => {
  function refresh() {
    const list = document.getElementById('session-list');
    if (!list) return;
    const sessions = Storage.listSessions();
    if (!sessions.length) { list.innerHTML = '<p class="history__empty">저장된 세션이 없어요.</p>'; return; }
    list.innerHTML = sessions.map(s => {
      const d = new Date(s.updatedAt);
      const ds = d.toLocaleDateString('ko-KR',{month:'short',day:'numeric'});
      const ts = d.toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'});
      const ll = {beginner:'초급',intermediate:'중급',advanced:'고급'}[s.level]||s.level;
      return `<div class="session-item">
        <div class="session-meta">${ds} ${ts} · ${ll}</div>
        <div class="session-title">${s.scenarioLabel} › ${s.topicLabel}</div>
        <div class="session-turns">${s.turnCount}턴</div>
        <div class="session-actions">
          <button class="sess-btn sess-resume" data-id="${s.id}">▶ 이어하기</button>
          <button class="sess-btn sess-delete" data-id="${s.id}">🗑</button>
        </div>
      </div>`;
    }).join('');
    list.querySelectorAll('.sess-resume').forEach(btn => {
      btn.addEventListener('click', () => {
        const session = Storage.loadSession(btn.dataset.id);
        if (session) { document.getElementById('sidebar').classList.remove('open'); Tabs.switchTo('conversation'); App.startConversation(session); }
      });
    });
    list.querySelectorAll('.sess-delete').forEach(btn => {
      btn.addEventListener('click', () => { if(confirm('삭제할까요?')){ Storage.deleteSession(btn.dataset.id); refresh(); } });
    });
  }
  return { refresh };
})();

document.addEventListener('DOMContentLoaded', App.init);
