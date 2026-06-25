# SpeakUp v2 — AI 영어 학습 앱

## 파일 구조
```
speakup-v2/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── scenarios.js   # 시나리오/레벨/시스템 프롬프트
│   ├── api.js         # Claude API
│   ├── storage.js     # 세션 저장
│   ├── chat.js        # 채팅 UI
│   ├── mic.js         # 마이크
│   ├── notes.js       # My Note CRUD
│   ├── tabs.js        # 탭 전환
│   ├── bookshow.js    # Book&Show 탭
│   ├── diary.js       # Diary 첨삭 탭
│   ├── question.js    # Question 탭
│   ├── practice.js    # Practice 3단계
│   └── app.js         # 메인 앱
└── README.md
```

## 탭 기능
- 💬 **Conversation** — AI 회화 연습, 발음/피드백/표현 제안
- 🎭 **Book&Show** — Friends / Wimpy Kid 실제 표현 학습
- 📔 **Diary** — 영어 일기 AI 첨삭
- ❓ **Question** — 표현 질문, 뉘앙스 비교
- 📌 **My Note** — 표현 저장 노트
- 🔥 **Practice** — 한국어→영어 3단계 연습

## GitHub Pages 배포
```bash
git init
git add .
git commit -m "SpeakUp v2"
git branch -M main
git remote add origin https://github.com/아이디/english-chat-app.git
git push -u origin main --force
```
Settings → Pages → Branch: main → Save
