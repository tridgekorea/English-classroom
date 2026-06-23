const Storage = (() => {
  const PREFIX = 'speakup_session_';
  const INDEX_KEY = 'speakup_index';
  const MAX_SESSIONS = 30;

  function getIndex() {
    try { return JSON.parse(localStorage.getItem(INDEX_KEY) || '[]'); }
    catch { return []; }
  }

  function saveIndex(index) {
    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
  }

  // 세션 저장 (신규 or 덮어쓰기)
  function saveSession(session) {
    // session: { id, scenario, scenarioLabel, topicId, topicLabel, level, messages, feedbacks, turnCount, createdAt, updatedAt }
    const id = session.id || `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    session.id = id;
    session.updatedAt = new Date().toISOString();
    if (!session.createdAt) session.createdAt = session.updatedAt;

    localStorage.setItem(PREFIX + id, JSON.stringify(session));

    let index = getIndex();
    const existing = index.findIndex(s => s.id === id);
    const meta = {
      id,
      scenario: session.scenario,
      scenarioLabel: session.scenarioLabel,
      topicLabel: session.topicLabel,
      level: session.level,
      turnCount: session.turnCount,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    };
    if (existing >= 0) index[existing] = meta;
    else index.unshift(meta);

    // 최대 30개 유지
    if (index.length > MAX_SESSIONS) {
      const removed = index.splice(MAX_SESSIONS);
      removed.forEach(s => localStorage.removeItem(PREFIX + s.id));
    }
    saveIndex(index);
    return id;
  }

  function loadSession(id) {
    try { return JSON.parse(localStorage.getItem(PREFIX + id) || 'null'); }
    catch { return null; }
  }

  function deleteSession(id) {
    localStorage.removeItem(PREFIX + id);
    const index = getIndex().filter(s => s.id !== id);
    saveIndex(index);
  }

  function listSessions() {
    return getIndex();
  }

  function clearAll() {
    getIndex().forEach(s => localStorage.removeItem(PREFIX + s.id));
    localStorage.removeItem(INDEX_KEY);
  }

  return { saveSession, loadSession, deleteSession, listSessions, clearAll };
})();
