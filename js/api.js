const API = (() => {
  function getKey() {
    return localStorage.getItem('claude_api_key') || '';
  }

  function saveKey(key) {
    localStorage.setItem('claude_api_key', key.trim());
  }

  function clearKey() {
    localStorage.removeItem('claude_api_key');
  }

  async function sendMessage(messages, systemPrompt) {
    const key = getKey();
    if (!key) throw new Error('NO_KEY');

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
        max_tokens: 1000,
        system: systemPrompt,
        messages
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (res.status === 401) throw new Error('INVALID_KEY');
      throw new Error(err.error?.message || 'API_ERROR');
    }

    const data = await res.json();
    return data.content?.[0]?.text || '';
  }

  async function getHint(lastAIMessage, level, scenario) {
    const key = getKey();
    if (!key) throw new Error('NO_KEY');

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
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `The AI coach said: "${lastAIMessage}" in a ${scenario} conversation. Write ONE example response a ${level} English learner could say. Just the sentence, nothing else.`
        }]
      })
    });

    const data = await res.json();
    return data.content?.[0]?.text?.trim() || '';
  }

  return { getKey, saveKey, clearKey, sendMessage, getHint };
})();
