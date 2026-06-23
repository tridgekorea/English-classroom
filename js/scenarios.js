const SCENARIOS = {
  daily: {
    id: 'daily',
    label: 'Daily Chat',
    emoji: '☕',
    description: 'Casual everyday conversations',
    topics: [
      { id: 'weekend', label: '주말 계획', icon: '🗓️', prompt: 'weekend plans and free time activities' },
      { id: 'food',    label: '음식 추천', icon: '🍜', prompt: 'recommending food and restaurants' },
      { id: 'hobby',   label: '취미 이야기', icon: '🎮', prompt: 'hobbies and personal interests' },
      { id: 'netflix', label: 'OTT 추천',   icon: '🎬', prompt: 'recommending movies or shows on Netflix' },
      { id: 'weather', label: '날씨 잡담',  icon: '☀️', prompt: 'casual small talk about weather and seasons' },
      { id: 'custom',  label: '직접 입력',  icon: '✏️', prompt: null }
    ]
  },
  business: {
    id: 'business',
    label: 'Business',
    emoji: '💼',
    description: 'Professional workplace English',
    topics: [
      { id: 'meeting',   label: '회의 진행',   icon: '📋', prompt: 'running or participating in a business meeting' },
      { id: 'negotiate', label: '협상',         icon: '🤝', prompt: 'negotiating terms or a deal with a business partner' },
      { id: 'email',     label: '이메일 작성',  icon: '📧', prompt: 'discussing and drafting professional emails' },
      { id: 'present',   label: '발표 Q&A',    icon: '📊', prompt: 'handling questions after a business presentation' },
      { id: 'feedback',  label: '피드백 주고받기', icon: '💬', prompt: 'giving and receiving feedback professionally' },
      { id: 'custom',    label: '직접 입력',    icon: '✏️', prompt: null }
    ]
  },
  travel: {
    id: 'travel',
    label: 'Travel',
    emoji: '✈️',
    description: 'Airport, hotel, sightseeing',
    topics: [
      { id: 'airport',  label: '공항 체크인',  icon: '🛫', prompt: 'checking in at an airport and going through security' },
      { id: 'hotel',    label: '호텔 체크인',  icon: '🏨', prompt: 'checking into a hotel and asking about amenities' },
      { id: 'order',    label: '식당 주문',    icon: '🍽️', prompt: 'ordering food at a restaurant abroad' },
      { id: 'lost',     label: '길 묻기',      icon: '🗺️', prompt: 'asking for and giving directions when lost' },
      { id: 'shopping', label: '쇼핑',         icon: '🛍️', prompt: 'shopping and bargaining at a market or store' },
      { id: 'custom',   label: '직접 입력',    icon: '✏️', prompt: null }
    ]
  },
  interview: {
    id: 'interview',
    label: 'Interview',
    emoji: '🎤',
    description: 'Job interviews & self-intro',
    topics: [
      { id: 'selfintro', label: '자기소개',     icon: '👤', prompt: 'introducing yourself professionally in a job interview' },
      { id: 'strength',  label: '강점/약점',    icon: '💪', prompt: 'discussing strengths and weaknesses in an interview' },
      { id: 'exp',       label: '경험 말하기',  icon: '📁', prompt: 'describing past work experience and achievements' },
      { id: 'why',       label: '지원 동기',    icon: '🎯', prompt: 'explaining why you applied for the position' },
      { id: 'question',  label: '역질문',       icon: '❓', prompt: 'asking thoughtful questions to the interviewer' },
      { id: 'custom',    label: '직접 입력',    icon: '✏️', prompt: null }
    ]
  }
};

const LEVELS = {
  beginner: {
    label: 'Beginner',
    description: 'Simple words & short sentences',
    instruction: 'Use very simple vocabulary and short sentences (under 10 words). Speak slowly and clearly.'
  },
  intermediate: {
    label: 'Intermediate',
    description: 'Natural everyday English',
    instruction: 'Use natural conversational English. Moderate complexity, common idioms are fine.'
  },
  advanced: {
    label: 'Advanced',
    description: 'Complex expressions & nuance',
    instruction: 'Use sophisticated vocabulary, complex sentence structures, idioms, and nuanced expressions.'
  }
};

function buildSystemPrompt(scenarioId, levelId, topicPrompt) {
  const scen = SCENARIOS[scenarioId];
  const lvl = LEVELS[levelId];
  const topicLine = topicPrompt
    ? `Conversation topic: ${topicPrompt}`
    : `Scenario: ${scen.label} (${scen.description})`;

  return `You are an encouraging English conversation coach. ${topicLine}.

Language level: ${lvl.label} — ${lvl.instruction}

Your response MUST follow this exact format — no exceptions:

[REPLY]
Your conversational reply here (2-3 sentences max, stay on topic).

[PRONUNCIATION]
Pick 1-2 key words or phrases from your reply. Format: word/phrase → /phonetic/ → tip
Example: "agenda" → /əˈdʒendə/ → stress the 2nd syllable: "a-JEN-da"
If nothing notable, write "없음".

[FEEDBACK]
One specific, constructive tip about the student's English (grammar, vocabulary, or naturalness). If perfect, say so. Write in Korean. Be warm and encouraging.

Stay in character. Keep the conversation flowing naturally. Never break the format.`;
}

function getTopicStarter(scenarioId, topicId, customText) {
  if (topicId === 'custom') return `Let's talk about: ${customText}. Ready? I'll start — ${customText} sounds interesting! What would you like to say first?`;
  const scen = SCENARIOS[scenarioId];
  const topic = scen.topics.find(t => t.id === topicId);
  const starters = {
    // daily
    weekend:  "So, do you have any fun plans for the weekend?",
    food:     "I'm starving! Do you know any good places to eat around here?",
    hobby:    "So what do you like to do in your free time?",
    netflix:  "I finished my last show and I have no idea what to watch next. Any recommendations?",
    weather:  "The weather's been so unpredictable lately, hasn't it?",
    // business
    meeting:  "Good morning everyone. Let's get started — could you give us a quick status update?",
    negotiate:"Thanks for meeting with us today. Shall we go over the key terms?",
    email:    "I need to send a follow-up email to our client. Can you help me draft it?",
    present:  "Great presentation! I have a few questions — what's the timeline on this project?",
    feedback: "I wanted to share some thoughts on your recent work. Do you have a moment?",
    // travel
    airport:  "Next, please! Passport and booking confirmation?",
    hotel:    "Welcome! Do you have a reservation with us?",
    order:    "Hi there, are you ready to order, or do you need a few more minutes?",
    lost:     "Excuse me, you look a bit lost — can I help you find something?",
    shopping: "Hi! Looking for anything in particular today?",
    // interview
    selfintro:"Great to meet you. Could you start by telling me a little about yourself?",
    strength: "So — what would you say is your greatest strength?",
    exp:      "Tell me about a project you're most proud of from your previous role.",
    why:      "What drew you to apply for this position specifically?",
    question: "That's all from my side. Do you have any questions for me?"
  };
  return starters[topicId] || `Let's practice: ${topic?.prompt || 'English conversation'}. Go ahead!`;
}
