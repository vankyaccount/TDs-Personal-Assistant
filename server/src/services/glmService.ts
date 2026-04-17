import fetch from 'node-fetch';

const GLM_URL = process.env.GLM_API_URL || 'https://api.z.ai/api/paas/v4/chat/completions';
const GLM_KEY = process.env.GLM_API_KEY || '';
const GLM_MODEL = process.env.GLM_MODEL || 'glm-4.7';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function chatCompletion(messages: ChatMessage[], stream = false) {
  const response = await fetch(GLM_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GLM_KEY}`,
    },
    body: JSON.stringify({
      model: GLM_MODEL,
      messages,
      stream,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GLM API error ${response.status}: ${text}`);
  }

  if (stream) {
    return response;
  }

  const data = (await response.json()) as any;
  return data.choices?.[0]?.message?.content || '';
}

export async function streamChatCompletion(messages: ChatMessage[]) {
  const response = await fetch(GLM_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GLM_KEY}`,
    },
    body: JSON.stringify({
      model: GLM_MODEL,
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GLM API error ${response.status}: ${text}`);
  }

  return response.body;
}
