const SCENARIOS = {
  daily: {
    id: 'daily', label: 'Daily Chat', emoji: '☕',
    description: 'Casual everyday conversations',
    topics: [
      { id: 'weekend',  label: '주말 계획',   icon: '🗓️', prompt: 'weekend plans and free time activities' },
      { id: 'food',     label: '음식 추천',   icon: '🍜', prompt: 'recommending food and restaurants' },
      { id: 'hobby',    label: '취미 이야기', icon: '🎮', prompt: 'hobbies and personal interests' },
      { id: 'netflix',  label: 'OTT 추천',   icon: '🎬', prompt: 'recommending movies or shows' },
      { id: 'weather',  label: '날씨 잡담',   icon: '☀️', prompt: 'casual small talk about weather' },
      { id: 'custom',   label: '직접 입력',   icon: '✏️', prompt: null }
    ]
  },
  business: {
    id: 'business', label: 'Business', emoji: '💼',
    description: 'Professional workplace English',
    topics: [
      { id: 'meeting',   label: '회의 진행',      icon: '📋', prompt: 'running or participating in a business meeting' },
      { id: 'negotiate', label: '협상',            icon: '🤝', prompt: 'negotiating terms or a deal' },
      { id: 'email',     label: '이메일 작성',     icon: '📧', prompt: 'discussing and drafting professional emails' },
      { id: 'present',   label: '발표 Q&A',       icon: '📊', prompt: 'handling questions after a presentation' },
      { id: 'feedback',  label: '피드백 주고받기', icon: '💬', prompt: 'giving and receiving feedback professionally' },
      { id: 'custom',    label: '직접 입력',       icon: '✏️', prompt: null }
    ]
  },
  travel: {
    id: 'travel', label: 'Travel', emoji: '✈️',
    description: 'Airport, hotel, sightseeing',
    topics: [
      { id: 'airport',  label: '공항 체크인', icon: '🛫', prompt: 'checking in at an airport' },
      { id: 'hotel',    label: '호텔 체크인', icon: '🏨', prompt: 'checking into a hotel' },
      { id: 'order',    label: '식당 주문',   icon: '🍽️', prompt: 'ordering food at a restaurant abroad' },
      { id: 'lost',     label: '길 묻기',     icon: '🗺️', prompt: 'asking for directions when lost' },
      { id: 'shopping', label: '쇼핑',        icon: '🛍️', prompt: 'shopping at a market or store' },
      { id: 'custom',   label: '직접 입력',   icon: '✏️', prompt: null }
    ]
  },
  interview: {
    id: 'interview', label: 'Interview', emoji: '🎤',
    description: 'Job interviews & self-intro',
    topics: [
      { id: 'selfintro', label: '자기소개',   icon: '👤', prompt: 'introducing yourself in a job interview' },
      { id: 'strength',  label: '강점/약점',  icon: '💪', prompt: 'discussing strengths and weaknesses' },
      { id: 'exp',       label: '경험 말하기', icon: '📁', prompt: 'describing past work experience' },
      { id: 'why',       label: '지원 동기',  icon: '🎯', prompt: 'explaining why you applied' },
      { id: 'question',  label: '역질문',     icon: '❓', prompt: 'asking questions to the interviewer' },
      { id: 'custom',    label: '직접 입력',  icon: '✏️', prompt: null }
    ]
  },
  popculture: {
    id: 'popculture', label: 'Pop Culture', emoji: '🎭',
    description: 'Friends & Wimpy Kid expressions',
    topics: [
      { id: 'friends_cafe',   label: 'Central Perk', icon: '☕', prompt: 'casual cafe hangout like in Friends — banter, sarcasm, friendship talk' },
      { id: 'friends_date',   label: '데이트 이야기', icon: '💘', prompt: 'talking about dating and relationships like characters in Friends' },
      { id: 'friends_work',   label: '직장 고민',     icon: '😩', prompt: 'venting about work problems like in Friends' },
      { id: 'wimpy_school',   label: '학교생활',      icon: '📓', prompt: 'middle school daily life like in Diary of a Wimpy Kid — awkward, funny, relatable' },
      { id: 'wimpy_friend',   label: '친구 관계',     icon: '🤜', prompt: 'friendship drama and loyalty like Rowley and Greg in Wimpy Kid' },
      { id: 'custom',         label: '직접 입력',     icon: '✏️', prompt: null }
    ]
  },
  phrasal: {
    id: 'phrasal', label: 'Phrasal Verbs', emoji: '🔥',
    description: '구동사 집중 연습',
    topics: [
      { id: 'pv_input',  label: '구동사 직접 입력', icon: '✍️', prompt: null, isPhrasal: true },
      { id: 'pv_common', label: '자주 쓰는 구동사', icon: '⭐', prompt: 'give up, pick up, run into, look forward to, bring up, figure out, go through, come up with' },
      { id: 'pv_daily',  label: '일상 구동사',      icon: '🏠', prompt: 'wake up, get up, put on, take off, turn on, turn off, clean up, hang out' },
      { id: 'pv_social', label: '소셜 구동사',      icon: '👥', prompt: 'catch up, hang out, break up, make up, get along, fall out, show up, blow off' },
      { id: 'custom',    label: '기타 입력',        icon: '✏️', prompt: null }
    ]
  }
};

const LEVELS = {
  beginner:     { label: 'Beginner',     description: 'Simple words & short sentences', instruction: 'Use very simple vocabulary and short sentences. Speak slowly and clearly.' },
  intermediate: { label: 'Intermediate', description: 'Natural everyday English',       instruction: 'Use natural conversational English. Common idioms are fine.' },
  advanced:     { label: 'Advanced',     description: 'Complex expressions & nuance',   instruction: 'Use sophisticated vocabulary, complex structures, idioms, and nuanced expressions.' }
};

function buildSystemPrompt(scenarioId, levelId, topicPrompt, phrasalVerbs) {
  const scen = SCENARIOS[scenarioId];
  const lvl = LEVELS[levelId];

  // 구동사 모드
  if (scenarioId === 'phrasal' && phrasalVerbs) {
    return `You are a fun, encouraging English conversation coach specializing in phrasal verbs.
Target phrasal verbs to practice: ${phrasalVerbs}

Language level: ${lvl.label} — ${lvl.instruction}

Your job:
1. Have a NATURAL, flowing conversation with the student. Do NOT stop after one exchange — keep asking follow-up questions, react to what they say, and steer the conversation so they have MORE chances to use the target phrasal verbs naturally.
2. When the student uses a target phrasal verb correctly, react naturally and enthusiastically in the conversation.
3. Occasionally (not every turn) weave the target phrasal verbs into YOUR replies as natural examples.

STRICTLY follow this response format:

[REPLY]
Your conversational reply (2-4 sentences). End with a follow-up question to keep the conversation going.

[SUGGESTIONS]
2-3 short example sentences the student could say next, each using one of the target phrasal verbs naturally. Label them A/B/C.

[FEEDBACK]
One tip about the student's use of phrasal verbs or general English. In Korean. Be specific and warm.`;
  }

  // 팝컬처 모드
  if (scenarioId === 'popculture') {
    const isFriends = topicPrompt && topicPrompt.includes('Friends');
    const isWimpy = topicPrompt && (topicPrompt.includes('Wimpy') || topicPrompt.includes('Greg') || topicPrompt.includes('middle school'));
    const styleGuide = isFriends
      ? `Speak like a Friends character — use sarcasm, wit, "Oh my God", "How you doin'?", "Could this BE any more...", "We were on a break!", self-deprecating humor, pop culture references from the 90s/2000s. Reference the coffee shop, Monica's apartment, Central Perk.`
      : isWimpy
      ? `Speak like a middle schooler from Diary of a Wimpy Kid — use casual, slightly self-absorbed but funny tone. Reference school hallways, the cheese touch, Rowley, the cafeteria, class rankings. Greg's dry humor and survival-mode thinking.`
      : `Use casual, witty American English with pop culture references.`;

    return `You are a conversation partner who loves American pop culture. Context: ${topicPrompt}.

${styleGuide}

Language level: ${lvl.label} — ${lvl.instruction}

IMPORTANT: Keep the conversation GOING. After each reply, always ask a follow-up question or react in a way that invites more dialogue. Don't let the conversation die.

STRICTLY follow this format:

[REPLY]
Your reply in character (2-4 sentences). End with a question or reaction that keeps the conversation alive.

[EXPRESSION]
1-2 authentic expressions from Friends or Wimpy Kid that fit this conversation moment. Format: "expression" → meaning → when to use it

[FEEDBACK]
One tip about the student's English in Korean. Be warm and specific.`;
  }

  // 일반 모드
  const topicLine = topicPrompt ? `Conversation topic: ${topicPrompt}` : `Scenario: ${scen.label}`;

  return `You are an encouraging English conversation coach. ${topicLine}.

Language level: ${lvl.label} — ${lvl.instruction}

CRITICAL: You MUST keep the conversation going. Never give a closed answer. Always end your reply with a follow-up question, a reaction that invites response, or introduce a new angle on the topic. The conversation should feel like talking to a real person, not a Q&A bot.

Also, based on the flow of the conversation, suggest 2-3 natural expressions the student could use next — not generic, but specifically relevant to what's being discussed right now.

STRICTLY follow this format — no exceptions:

[REPLY]
Your conversational reply (2-4 sentences). MUST end with a follow-up question or open invitation to continue.

[SUGGESTIONS]
2-3 expressions or sentences the student could say next, relevant to THIS conversation moment. Label A/B/C. Keep them natural and varied in difficulty.

[PRONUNCIATION]
1-2 key words from your reply: word → /phonetic/ → tip. If nothing notable, write "없음".

[FEEDBACK]
One specific tip about the student's English. In Korean. Warm and encouraging.`;
}

function getTopicStarter(scenarioId, topicId, customText) {
  if (topicId === 'custom' || topicId === 'pv_input') {
    return `Let's get started! I'll kick things off — what's been on your mind lately?`;
  }

  const starters = {
    // daily
    weekend:  "So, do you have any fun plans for the weekend?",
    food:     "I'm starving! Do you know any good places to eat around here?",
    hobby:    "So what do you like to do in your free time?",
    netflix:  "I just finished a show and I have no idea what to watch next. Any recommendations?",
    weather:  "The weather's been so unpredictable lately, hasn't it?",
    // business
    meeting:  "Good morning everyone. Let's get started — could you give us a quick status update?",
    negotiate:"Thanks for meeting with us today. Shall we go over the key terms?",
    email:    "I need to send a follow-up email to our client. Can you help me think through it?",
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
    question: "That's all from my side. Do you have any questions for me?",
    // pop culture
    friends_cafe:  "Oh my GOD, you will not believe what just happened to me. Can I grab a seat? I need to tell someone this right now.",
    friends_date:  "Okay so I have to ask — are you seeing anyone? Because my friend is TOTALLY available and perfect for you.",
    friends_work:  "Ugh, worst day ever. My boss is driving me absolutely crazy. Please tell me your day was better than mine.",
    wimpy_school:  "Okay so you're new here, right? First piece of advice — whatever you do, do NOT touch the Cheese.",
    wimpy_friend:  "So here's the thing about best friends. They're supposed to have your back, right? Mine totally just bailed on me.",
    // phrasal
    pv_common: "Hey! So I wanted to practice some phrasal verbs today. Let's just have a natural conversation — I'll try to use them and you try too. What's going on with you lately?",
    pv_daily:  "Morning! So I just woke up and my whole routine is off today. What does your morning routine look like?",
    pv_social:  "So I finally caught up with an old friend last week. Haven't seen them in ages! Do you have any friends you've lost touch with?"
  };

  return starters[topicId] || `Let's start! What's on your mind today?`;
}
