const BookShow = (() => {
  let currentSource = 'friends';

  const SYSTEM = `You are an expert on American English expressions from popular media.
Your job: give 3 authentic, high-frequency expressions from the specified source (Friends TV show or Diary of a Wimpy Kid book).

STRICTLY return JSON only — no markdown, no preamble:
{
  "expressions": [
    {
      "phrase": "the expression",
      "meaning": "Korean meaning + English explanation",
      "example": "A natural example sentence using the expression",
      "context": "Where/how it was used in Friends or Wimpy Kid",
      "frequency": "high/medium",
      "nuance": "Any nuance note vs similar expressions (if applicable)"
    }
  ]
}`;

  function init() {
    document.querySelectorAll('.source-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.source-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSource = btn.dataset.source;
      });
    });

    document.getElementById('bookshow-generate-btn').addEventListener('click', generate);
  }

  async function generate() {
    const btn = document.getElementById('bookshow-generate-btn');
    const body = document.getElementById('bookshow-body');
    const key = API.getKey();
    if (!key) { document.getElementById('api-modal').classList.add('active'); return; }

    btn.disabled = true;
    btn.textContent = '불러오는 중...';
    body.innerHTML = '<div class="diary-placeholder">표현을 불러오고 있어요...</div>';

    const sourceLabel = currentSource === 'friends' ? 'Friends (the TV show)' : 'Diary of a Wimpy Kid (the book series)';

    // 이미 본 표현 추적
    const seenKey = `speakup_seen_${currentSource}`;
    const seen = JSON.parse(localStorage.getItem(seenKey) || '[]');

    const categories = ['sarcasm & humor', 'daily social situations', 'expressing emotions', 'relationships', 'work & school stress', 'pop culture references', 'excuses & comebacks', 'friendship & loyalty'];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const avoidHint = seen.length > 0 ? ` Do NOT repeat these expressions: ${seen.slice(-9).join(', ')}.` : '';

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
          messages: [{ role: 'user', content: `Source: ${sourceLabel}. Category focus: "${randomCategory}". Give me 3 DIFFERENT authentic expressions useful for Korean learners.${avoidHint} Pick expressions that vary in type (idioms, phrasal verbs, set phrases).` }]
        })
      });
      const data = await res.json();
      const raw = data.content?.[0]?.text || '';
      const jsonMatch = raw.match(/\{[\s\S]*\}/); if (!jsonMatch) throw new Error('no json'); const parsed = JSON.parse(jsonMatch[0]);

      // 본 표현 저장
      const newPhrases = parsed.expressions.map(e => e.phrase);
      localStorage.setItem(seenKey, JSON.stringify([...seen, ...newPhrases].slice(-30)));

      renderExpressions(parsed.expressions, sourceLabel);
    } catch(e) {
      body.innerHTML = '<div class="diary-placeholder">오류가 발생했어요. 다시 시도해주세요.</div>';
    }
    btn.disabled = false;
    btn.textContent = `✨ 새 표현 불러오기`;
  }

  function renderExpressions(exprs, source) {
    const body = document.getElementById('bookshow-body');
    body.innerHTML = exprs.map(e => `
      <div class="expression-card">
        <div class="expr-source">📺 ${esc(source)}</div>
        <div class="expr-phrase">${esc(e.phrase)}</div>
        <div class="expr-meaning">${esc(e.meaning)}</div>
        <div class="expr-example">"${esc(e.example)}"</div>
        ${e.nuance ? `<div style="margin-top:8px;font-size:12px;color:var(--text2)">💡 ${esc(e.nuance)}</div>` : ''}
        <div class="expr-actions">
          <button class="expr-btn primary save-expr-btn"
            data-phrase="${esc(e.phrase)}"
            data-meaning="${esc(e.meaning)}"
            data-source="${currentSource === 'friends' ? 'Friends' : 'Wimpy Kid'}">
            📌 내 노트에 저장
          </button>
        </div>
      </div>`).join('');

    body.querySelectorAll('.save-expr-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        Notes.add(btn.dataset.phrase, btn.dataset.meaning, ['표현', btn.dataset.source], btn.dataset.source);
        btn.textContent = '✓ 저장됨';
        btn.disabled = true;
      });
    });
  }

  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  return { init };
})();
