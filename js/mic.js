const Mic = (() => {
  let recognition = null;
  let isListening = false;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  function init() {
    const btn = document.getElementById('mic-btn');
    if (!btn) return;

    if (!SpeechRecognition) {
      // Firefox 등 완전 미지원
      btn.style.opacity = '0.35';
      btn.style.cursor = 'not-allowed';
      btn.addEventListener('click', () => {
        alert('이 브라우저는 음성 입력을 지원하지 않아요.\nChrome 또는 Safari를 사용해주세요.');
      });
      return;
    }

    btn.addEventListener('click', toggle);
  }

  function toggle() {
    if (isListening) stop();
    else start();
  }

  function start() {
    const input = document.getElementById('user-input');
    const btn = document.getElementById('mic-btn');

    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    let finalTranscript = '';

    recognition.onstart = () => {
      isListening = true;
      btn.classList.add('mic--active');
      btn.textContent = '⏹';
      btn.title = '탭해서 중지';
      input.placeholder = '듣고 있어요... 영어로 말해보세요';
      input.blur(); // 모바일 키보드 안 올라오게
    };

    recognition.onresult = (e) => {
      finalTranscript = '';
      let interim = '';
      for (let i = 0; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalTranscript += t;
        else interim += t;
      }
      input.value = finalTranscript || interim;
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    };

    recognition.onerror = (e) => {
      stop();
      if (e.error === 'not-allowed') {
        alert('마이크 권한이 필요해요.\n설정 > Safari > 마이크를 허용해주세요.');
      } else if (e.error === 'no-speech') {
        showMsg('음성이 감지되지 않았어요. 다시 시도해보세요.');
      } else if (e.error === 'network') {
        showMsg('네트워크 오류. 인터넷 연결을 확인해주세요.');
      } else {
        showMsg('음성 인식 오류. 텍스트로 입력해주세요.');
      }
    };

    recognition.onend = () => {
      const captured = finalTranscript.trim();
      stop();
      if (captured) {
        setTimeout(() => document.getElementById('send-btn').click(), 300);
      }
    };

    try {
      recognition.start();
    } catch(e) {
      stop();
      showMsg('마이크를 시작할 수 없어요. 다시 탭해보세요.');
    }
  }

  function stop() {
    const btn = document.getElementById('mic-btn');
    const input = document.getElementById('user-input');
    isListening = false;
    btn?.classList.remove('mic--active');
    if (btn) { btn.textContent = '🎤'; btn.title = '마이크로 말하기'; }
    input.placeholder = '영어로 입력하거나 🎤 눌러서 말하세요...';
    try { recognition?.abort(); } catch(e) {}
    recognition = null;
  }

  function showMsg(msg) {
    const input = document.getElementById('user-input');
    input.placeholder = msg;
    setTimeout(() => { input.placeholder = '영어로 입력하거나 🎤 눌러서 말하세요...'; }, 2800);
  }

  return { init };
})();
