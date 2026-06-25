const QuestionTab = (() => {
  const SYSTEM = `You are a nuanced English teacher for Korean learners. 
When asked about an English expression:
1. Explain meaning and usage clearly
2. Compare with similar/confusable expressions (especially those with similar Korean translations)
3. Tell which is more FREQUENT in daily conversation
4. Give concrete situational examples
5. Flag if the student might be making a common Korean-speaker mistake

STRICTLY return JSON only:
{
  "expression": "the expression asked about",
  "main_explanation": "clear explanation in Korean",
  "frequency": "how common is this in daily speech (Korean)",
  "best_used_when": "specific situations (Korean)",
  "similar_expressions": [
    {
      "expr": "similar expression",
      "difference": "nuance difference in Korean",
      "more_frequent": true or false
    }
  ],
  "examples": [
    { "en": "English example", "ko": "Korean translation" }
  ],
  "common_mistake": "common mistake Korean speakers make (or null)",
  "save_suggestion": { "phrase": "expression to save", "meaning": "short meaning" }
}`;

  function init() {
    const btn = document.getElementById('question-submit-btn');
    const input = document.getElementById('question-input');
    btn.addEventListener('click', ask);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') ask(); });
  }

  async function ask() {
    const input = document.getElementById('question-input');
    const q = input.value.trim();
    if (!q) return;
    const key = API.getKey();
    if (!key) { document.getElementById('api-modal').classList.add('active'); return; }

    const btn = document.getElementById('question-submit-btn');
    const results = document.getElementById('question-results');
    btn.disabled = true;
    btn.textContent = '답변 중...';

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 2000,
          system: SYSTEM,
          messages: [{ role: 'user', content: q }]
        })
      });
      const data = await res.json();
      const raw = data.content?.[0]?.text || '';
      // JSON 추출 강화 - 중괄호 블록 찾기
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('no json');
      const parsed = JSON.parse(jsonMatch[0]);
      renderAnswer(q, parsed);
      input.value = '';
    } catch(e) {
      results.insertAdjacentHTML('afterbegin', '<div class="question-card"><div class="question-a">오류 발생. 다시 시도해주세요.</div></div>');
    }
    btn.disabled = false;
    btn.textContent = '질문하기';
  }

  function renderAnswer(q, d) {
    const results = document.getElementById('question-results');
    let similar = '';
    if (d.similar_expressions?.length) {
      similar = `<div class="nuance-box" style="margin-top:10px">
        <span class="nuance-label">🔀 유사 표현 비교</span>
        ${d.similar_expressions.map(s => `
          <div style="margin-bottom:6px;font-size:13px;border-bottom:1px solid var(--border);padding-bottom:6px">
            <strong>${esc(s.expr)}</strong>${s.more_frequent ? ' <span style="font-size:10px;background:var(--question-bg);color:var(--question);padding:1px 6px;border-radius:10px">더 자주 씀</span>' : ''}
            <div style="color:var(--text2);margin-top:2px">${esc(s.difference)}</div>
          </div>`).join('')}
      </div>`;
    }

    let examples = '';
    if (d.examples?.length) {
      examples = `<div style="margin-top:10px;display:flex;flex-direction:column;gap:4px">
        ${d.examples.map(e => `
          <div style="font-size:13px;background:var(--bg);border-radius:6px;padding:6px 10px">
            <div style="font-style:italic">${esc(e.en)}</div>
            <div style="color:var(--text2);font-size:12px">${esc(e.ko)}</div>
          </div>`).join('')}
      </div>`;
    }

    let mistake = '';
    if (d.common_mistake) {
      mistake = `<div style="margin-top:8px;background:#fef2f2;border:1.5px solid #fca5a5;border-radius:6px;padding:8px 10px;font-size:12px;color:#991b1b">
        ⚠️ ${esc(d.common_mistake)}
      </div>`;
    }

    const saveId = `save_${Date.now()}`;
    const card = document.createElement('div');
    card.className = 'question-card';
    card.innerHTML = `
      <div class="question-q">Q: ${esc(q)}</div>
      <div class="question-a">${esc(d.main_explanation)}</div>
      ${d.best_used_when ? `<div class="nuance-box"><span class="nuance-label">✅ 이럴 때 써요</span><span class="nuance-text">${esc(d.best_used_when)}</span></div>` : ''}
      ${similar}${examples}${mistake}
      ${d.save_suggestion ? `<button class="save-to-note-btn" id="${saveId}" data-phrase="${esc(d.save_suggestion.phrase)}" data-meaning="${esc(d.save_suggestion.meaning)}">📌 내 노트에 저장</button>` : ''}
    `;
    results.insertAdjacentElement('afterbegin', card);

    document.getElementById(saveId)?.addEventListener('click', function() {
      Notes.add(this.dataset.phrase, this.dataset.meaning, ['질문', '표현'], 'Question');
      this.textContent = '✓ 저장됨';
      this.disabled = true;
    });
  }

  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  return { init };
})();
