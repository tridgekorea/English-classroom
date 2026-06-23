# SpeakUp — AI 영어 회화 연습 앱

Claude API를 활용한 AI 영어 회화 연습 웹앱입니다.

## 기능

- 🗣️ **AI 회화 연습** — 4가지 시나리오 (일상/비즈니스/여행/인터뷰)
- 🔊 **발음 가이드** — AI 답변 속 핵심 단어 발음 안내
- 💬 **실시간 피드백** — 매 턴마다 문법/자연스러움 피드백 (한국어)
- 📋 **피드백 히스토리** — 대화 중 받은 피드백 모아보기
- 💡 **힌트 기능** — 막힐 때 예시 답변 자동 생성
- 🎯 **3단계 레벨** — 초급/중급/고급 난이도 조절

## 파일 구조

```
english-chat-app/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── scenarios.js   # 시나리오 & 레벨 설정
│   ├── api.js         # Claude API 호출
│   ├── chat.js        # 채팅 UI & 히스토리
│   └── app.js         # 메인 앱 로직
└── README.md
```

## GitHub Pages 배포 방법

### 1. Repo 만들기
```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/english-chat-app.git
git push -u origin main
```

### 2. GitHub Pages 설정
1. GitHub repo 페이지 → **Settings** 탭
2. 왼쪽 메뉴 → **Pages**
3. Source: **Deploy from a branch**
4. Branch: **main** / **/ (root)** 선택 → Save
5. 1-2분 후 `https://YOUR_USERNAME.github.io/english-chat-app` 접속 가능

## 사용 방법

1. 앱 접속 시 Claude API 키 입력 창이 뜸
2. [Anthropic Console](https://console.anthropic.com)에서 API 키 발급
3. `sk-ant-...` 형태의 키를 입력하고 저장
4. 시나리오와 레벨 선택 후 영어로 대화 시작!

> API 키는 브라우저 localStorage에만 저장되며 외부로 전송되지 않습니다.
