import fetch from 'node-fetch';
import { Readable, Transform } from 'stream';

const GLM_URL = process.env.GLM_API_URL || 'https://api.z.ai/api/paas/v4/chat/completions';
const GLM_KEY = process.env.GLM_API_KEY || '';
const GLM_MODEL = process.env.GLM_MODEL || 'glm-4.7';
const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
// Try multiple Gemini models in order (in case one is rate-limited)
const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];
const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-4o-mini';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Convert OpenAI-format messages to Gemini format
function toGeminiPayload(messages: ChatMessage[]) {
  const systemMessages = messages.filter((m) => m.role === 'system');
  const chatMessages = messages.filter((m) => m.role !== 'system');

  const systemInstruction =
    systemMessages.length > 0
      ? { parts: [{ text: systemMessages.map((m) => m.content).join('\n') }] }
      : undefined;

  const contents = chatMessages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  return { systemInstruction, contents };
}

// Transform Gemini SSE chunks → OpenAI-compatible SSE chunks
class GeminiToOpenAITransform extends Transform {
  private buffer = '';
  private doneSent = false;

  _transform(chunk: Buffer, _encoding: string, callback: () => void) {
    this.buffer += chunk.toString();
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (!data) continue;
      try {
        const parsed = JSON.parse(data);
        const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const finishReason = parsed.candidates?.[0]?.finishReason;
        if (text) {
          this.push(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`);
        }
        if ((finishReason === 'STOP' || finishReason === 'MAX_TOKENS') && !this.doneSent) {
          this.push('data: [DONE]\n\n');
          this.doneSent = true;
        }
      } catch {}
    }
    callback();
  }

  _flush(callback: () => void) {
    if (this.buffer.startsWith('data: ')) {
      const data = this.buffer.slice(6).trim();
      try {
        const parsed = JSON.parse(data);
        const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (text) {
          this.push(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`);
        }
      } catch {}
    }
    if (!this.doneSent) {
      this.push('data: [DONE]\n\n');
    }
    callback();
  }
}

// Non-streaming: GLM → Gemini → OpenAI fallback
export async function chatCompletion(messages: ChatMessage[]): Promise<string> {
  // 1. Try GLM
  if (GLM_KEY) {
    try {
      const res = await fetch(GLM_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GLM_KEY}` },
        body: JSON.stringify({ model: GLM_MODEL, messages, stream: false, temperature: 0.7, max_tokens: 4096 }),
      });
      if (res.ok) {
        const data = (await res.json()) as any;
        const content = data.choices?.[0]?.message?.content;
        if (content) return content;
      } else {
        const text = await res.text();
        console.warn('[LLM] GLM failed, trying Gemini:', text.slice(0, 100));
      }
    } catch (err) {
      console.warn('[LLM] GLM error, trying Gemini:', err);
    }
  }

  // 2. Try Gemini (multiple models in case one is rate-limited)
  if (GEMINI_KEY) {
    const { systemInstruction, contents } = toGeminiPayload(messages);
    const body: any = { contents, generationConfig: { temperature: 0.7, maxOutputTokens: 4096 } };
    if (systemInstruction) body.systemInstruction = systemInstruction;

    for (const model of GEMINI_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const data = (await res.json()) as any;
          const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (content) return content;
        } else {
          const text = await res.text();
          console.warn(`[LLM] Gemini ${model} failed:`, text.slice(0, 80));
        }
      } catch (err) {
        console.warn(`[LLM] Gemini ${model} error:`, err);
      }
    }
    console.warn('[LLM] All Gemini models failed, trying OpenAI');
  }

  // 3. Try OpenAI
  if (OPENAI_KEY) {
    try {
      const res = await fetch(OPENAI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
        body: JSON.stringify({ model: OPENAI_MODEL, messages, temperature: 0.7, max_tokens: 4096 }),
      });
      if (res.ok) {
        const data = (await res.json()) as any;
        const content = data.choices?.[0]?.message?.content;
        if (content) return content;
      } else {
        const text = await res.text();
        console.warn('[LLM] OpenAI failed:', text.slice(0, 100));
      }
    } catch (err) {
      console.warn('[LLM] OpenAI error:', err);
    }
  }

  throw new Error('No AI provider available. Check API keys and balance.');
}

// Streaming: GLM → Gemini streaming → OpenAI streaming → simulated stream
export async function streamChatCompletion(messages: ChatMessage[]): Promise<NodeJS.ReadableStream> {
  // 1. Try GLM streaming
  if (GLM_KEY) {
    try {
      const res = await fetch(GLM_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GLM_KEY}` },
        body: JSON.stringify({ model: GLM_MODEL, messages, stream: true, temperature: 0.7, max_tokens: 4096 }),
      });
      if (res.ok && res.body) {
        return res.body as unknown as NodeJS.ReadableStream;
      }
      const text = await res.text();
      console.warn('[LLM] GLM streaming failed, trying Gemini:', text.slice(0, 100));
    } catch (err) {
      console.warn('[LLM] GLM streaming error, trying Gemini:', err);
    }
  }

  // 2. Try Gemini streaming SSE (multiple models)
  if (GEMINI_KEY) {
    const { systemInstruction, contents } = toGeminiPayload(messages);
    const body: any = { contents, generationConfig: { temperature: 0.7, maxOutputTokens: 4096 } };
    if (systemInstruction) body.systemInstruction = systemInstruction;

    for (const model of GEMINI_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${GEMINI_KEY}&alt=sse`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok && res.body) {
          const transform = new GeminiToOpenAITransform();
          (res.body as unknown as NodeJS.ReadableStream).pipe(transform);
          return transform;
        }
        const text = await res.text();
        console.warn(`[LLM] Gemini ${model} streaming failed:`, text.slice(0, 80));
      } catch (err) {
        console.warn(`[LLM] Gemini ${model} streaming error:`, err);
      }
    }
    console.warn('[LLM] All Gemini streaming models failed, trying OpenAI');
  }

  // 3. Try OpenAI streaming
  if (OPENAI_KEY) {
    try {
      const res = await fetch(OPENAI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
        body: JSON.stringify({ model: OPENAI_MODEL, messages, stream: true, temperature: 0.7, max_tokens: 4096 }),
      });
      if (res.ok && res.body) {
        return res.body as unknown as NodeJS.ReadableStream;
      }
      const text = await res.text();
      console.warn('[LLM] OpenAI streaming failed:', text.slice(0, 100));
    } catch (err) {
      console.warn('[LLM] OpenAI streaming error:', err);
    }
  }

  // 4. Last resort: non-streaming Gemini with simulated stream
  console.warn('[LLM] All streaming providers failed, using non-streaming with simulated stream');
  const content = await chatCompletion(messages);

  const readable = new Readable({ read() {} });
  const chunkSize = 8;
  for (let i = 0; i < content.length; i += chunkSize) {
    const chunk = content.slice(i, i + chunkSize);
    readable.push(`data: ${JSON.stringify({ choices: [{ delta: { content: chunk } }] })}\n\n`);
  }
  readable.push('data: [DONE]\n\n');
  readable.push(null);
  return readable;
}
