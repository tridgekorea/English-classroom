const PracticeTab = (() => {
  let currentPhrase = null;
  let currentSteps = null;
  let source = 'note'; // 'note' | 'custom'

  const SYSTEM = `You are an English practice coach. Given a phrasal verb or expression, create a 3-step Korean→English practice exercise.

STRICTLY return JSON only:
{
  "phrase": "the expression",
  "meaning": "Korean meaning",
  "steps": [
    {
      "level": 1,
      "title": "기본 문장",
      "description": "배운 표현을 활용한 간단한 문장",
      "korean": "Korean sentence to translate",
      "answer": "English answer",
      "hint": "short hint in Korean"
    },
    {
      "level": 2,
      "title": "시제/서법 변화",
      "description": "시제나 서법을 바꿔서",
      "korean": "Korean sentence (with tense/mood change)",
      "answer": "English answer",
      "hint": "short hint"
    },
    {
      "level": 3,
      "title": "전치사/접속사 확장",
      "description": "자주 쓰이는 전치사나 접속사 붙이기",
      "korean": "Korean sentence with preposition/conjunction",
      "answer": "English answer",
      "hint": "short hint"
    }
  ]
}`;

  function onEnter() {
    const notes = Notes.getAll();
    const fromNoteBtn = document.getElementById('practice-from-note');
    if (fromNoteBtn) {
      fromNoteBtn.disabled = notes.length === 0;
      fromNoteBtn.title = notes.length === 0 ? '노트에 표현을 먼저 저장해주세요' : '';
    }
    // Show start screen if no active practice
    if (!currentPhrase) {
      document.getElementById('practice-start-screen').style.display = 'block';
      document.getElementById('practice-exercise').style.display = 'none';
    }
  }

  function init() {
    document.querySelectorAll('.practice-source-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.practice-source-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        source = btn.dataset.src;
        document.getElementById('practice-custom-row').style.display = source === 'custom' ? 'flex' : 'none';
      });
    });

    document.getElementById('practice-start-btn').addEventListener('click', startPractice);
  }

  async function startPractice() {
    const key = API.getKey();
    if (!key) { document.getElementById('api-modal').classList.add('active'); return; }

    let phrase = '';
    if (source === 'note') {
      const random = Notes.getRandom(1);
      if (!random.length) { alert('노트에 저장된 표현이 없어요!'); return; }
      phrase = random[0].phrase;
    } else {
      phrase = document.getElementById('practice-custom-input').value.trim();
      if (!phrase) { alert('표현을 입력해주세요!'); return; }
    }

    const btn = document.getElementById('practice-start-btn');
    btn.textContent = '문제 만드는 중...';
    btn.disabled = true;

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
          messages: [{ role: 'user', content: `Expression: ${phrase}` }]
        })
      });
      const data = await res.json();
      const raw = data.content?.[0]?.text || '';
      const jsonMatch = raw.match(/\{[\s\S]*\}/); if (!jsonMatch) throw new Error('no json'); const parsed = JSON.parse(jsonMatch[0]);
      currentPhrase = parsed;
      currentSteps = parsed.steps;
      renderExercise(parsed);
    } catch(e) {
      alert('오류 발생. 다시 시도해주세요.');
    }
    btn.textContent = '🎲 새 문제 시작';
    btn.disabled = false;
  }

  function renderExercise(data) {
    document.getElementById('practice-start-screen').style.display = 'none';
    const ex = document.getElementById('practice-exercise');
    ex.style.display = 'flex';

    document.getElementById('practice-phrase-main').textContent = data.phrase;
    document.getElementById('practice-phrase-meaning').textContent = data.meaning;

    const stepsEl = document.getElementById('practice-steps-list');
    stepsEl.innerHTML = data.steps.map((step, i) => `
      <div class="practice-step" id="step-${i}">
        <div class="step-header">
          <div class="step-num">${step.level}</div>
          <div class="step-title">${esc(step.title)} — <span style="font-weight:400;color:var(--text2)">${esc(step.description)}</span></div>
        </div>
        <div class="step-korean">${esc(step.korean)}</div>
        <div class="step-input-row">
          <input class="step-input" type="text" placeholder="영어로 써보세요..." data-answer="${esc(step.answer)}" data-hint="${esc(step.hint)}" />
          <button class="step-check-btn" onclick="PracticeTab.check(this, ${i})">확인</button>
        </div>
        <div class="step-result" id="step-result-${i}"></div>
      </div>`).join('');
  }

  function check(btn, idx) {
    const input = btn.previousElementSibling;
    const answer = input.dataset.answer.toLowerCase().trim();
    const hint = input.dataset.hint;
    const userAnswer = input.value.toLowerCase().trim();
    const resultEl = document.getElementById(`step-result-${idx}`);

    const isCorrect = userAnswer === answer ||
      answer.includes(userAnswer) ||
      userAnswer.includes(answer.split(' ').slice(0,3).join(' '));

    resultEl.style.display = 'block';
    if (isCorrect) {
      resultEl.className = 'step-result correct';
      resultEl.textContent = `✓ 정답! 모범 답안: ${currentSteps[idx].answer}`;
    } else {
      resultEl.className = 'step-result incorrect';
      resultEl.textContent = `힌트: ${hint} | 모범 답안: ${currentSteps[idx].answer}`;
    }
  }

  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  return { init, onEnter, check };
})();
