const DiaryTab = (() => {
  const SYSTEM = `You are an expert English writing coach for Korean learners.
The student has written an English diary entry. Your job:
1. Correct grammar, vocabulary, and naturalness
2. Point out more natural/frequent alternatives (언어의 경제성)
3. For similar expressions, explain nuance differences in Korean
4. Suggest how they can reuse expressions they likely already know

STRICTLY return JSON only:
{
  "overall": "2-3 sentence overall comment in Korean — warm, specific",
  "corrections": [
    {
      "original": "the student's original phrase",
      "corrected": "the corrected version",
      "reason": "explanation in Korean",
      "frequency_note": "if a more natural/frequent alternative exists, mention it here (in Korean)"
    }
  ],
  "highlight": "One thing the student did really well (in Korean)",
  "better_expressions": [
    {
      "used": "what they wrote",
      "suggest": "more natural alternative",
      "why": "why this is better in Korean"
    }
  ]
}
If the writing is already good, corrections array can be short. Always be encouraging.`;

  function init() {
    document.getElementById('diary-submit-btn').addEventListener('click', submit);
    // Update date
    const dateEl = document.getElementById('diary-date');
    if (dateEl) dateEl.textContent = new Date().toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric', weekday:'short' });
  }

  async function submit() {
    const text = document.getElementById('diary-input').value.trim();
    if (!text) return;
    const key = API.getKey();
    if (!key) { document.getElementById('api-modal').classList.add('active'); return; }

    const btn = document.getElementById('diary-submit-btn');
    const panel = document.getElementById('diary-feedback-panel');
    btn.disabled = true;
    btn.textContent = '첨삭 중...';
    panel.innerHTML = '<div class="diary-placeholder">첨삭하고 있어요...</div>';

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
          messages: [{ role: 'user', content: `Here is my English diary entry:\n\n${text}` }]
        })
      });
      const data = await res.json();
      const raw = data.content?.[0]?.text || '';
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('no json');
      const parsed = JSON.parse(jsonMatch[0]);
      renderFeedback(parsed);
    } catch(e) {
      panel.innerHTML = '<div class="diary-placeholder">오류 발생. 다시 시도해주세요.</div>';
    }
    btn.disabled = false;
    btn.textContent = '✏️ 첨삭받기';
  }

  function renderFeedback(data) {
    const panel = document.getElementById('diary-feedback-panel');
    let html = `<h4>✏️ 첨삭 결과</h4>`;

    if (data.overall) {
      html += `<div class="correction-card" style="background:var(--diary-bg);border-color:var(--diary-border)">
        <div style="font-size:13px;color:var(--text);line-height:1.6">${esc(data.overall)}</div>
      </div>`;
    }

    if (data.highlight) {
      html += `<div class="correction-card" style="border-color:var(--diary-border)">
        <div class="fixed">👍 잘한 점</div>
        <div class="why">${esc(data.highlight)}</div>
      </div>`;
    }

    if (data.corrections?.length) {
      html += `<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--diary);margin-top:4px">수정사항</div>`;
      html += data.corrections.map(c => `
        <div class="correction-card">
          <div class="orig">${esc(c.original)}</div>
          <div class="fixed">→ ${esc(c.corrected)}</div>
          <div class="why">${esc(c.reason)}</div>
          ${c.frequency_note ? `<div style="margin-top:4px;font-size:12px;color:var(--diary)">💡 ${esc(c.frequency_note)}</div>` : ''}
        </div>`).join('');
    }

    if (data.better_expressions?.length) {
      html += `<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--diary);margin-top:4px">더 자연스러운 표현</div>`;
      html += data.better_expressions.map(b => `
        <div class="correction-card">
          <div class="orig">${esc(b.used)}</div>
          <div class="fixed">→ ${esc(b.suggest)}</div>
          <div class="why">${esc(b.why)}</div>
        </div>`).join('');
    }

    panel.innerHTML = html;
  }

  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  return { init };
})();
