import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { streamChatCompletion, chatCompletion } from '../services/glmService';

const router = Router();
const prisma = new PrismaClient();

// Stream chat
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { messages, conversationId, persona, title } = req.body;
    const userId = req.userId!;

    // Create or get conversation
    let convo: any;
    if (conversationId) {
      convo = await prisma.conversation.findFirst({ where: { id: conversationId, userId } });
    }
    if (!convo) {
      convo = await prisma.conversation.create({
        data: { title: title || 'New Chat', persona, userId },
      });
    }

    // Save user message
    const userMsg = messages[messages.length - 1];
    await prisma.message.create({
      data: { role: 'user', content: userMsg.content, conversationId: convo.id },
    });

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Conversation-Id', convo.id);

    // Stream from GLM
    const stream = await streamChatCompletion(messages);
    if (!stream) {
      res.write(`data: ${JSON.stringify({ error: 'No stream' })}\n\n`);
      res.end();
      return;
    }

    let fullResponse = '';
    const decoder = new TextDecoder();

    stream.on('data', (chunk: Buffer) => {
      const text = decoder.decode(chunk, { stream: true });
      const lines = text.split('\n').filter((l) => l.startsWith('data: '));

      for (const line of lines) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') {
          res.write(`data: [DONE]\n\n`);
          return;
        }
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content || '';
          if (content) {
            fullResponse += content;
            res.write(`data: ${JSON.stringify({ content, conversationId: convo.id })}\n\n`);
          }
        } catch {}
      }
    });

    stream.on('end', async () => {
      // Save assistant message
      if (fullResponse) {
        await prisma.message.create({
          data: { role: 'assistant', content: fullResponse, conversationId: convo.id },
        });
        // Update title from first message if default
        if (convo.title === 'New Chat' && userMsg.content) {
          const shortTitle = userMsg.content.slice(0, 50) + (userMsg.content.length > 50 ? '...' : '');
          await prisma.conversation.update({ where: { id: convo.id }, data: { title: shortTitle } });
        }
      }
      res.end();
    });

    stream.on('error', (err: Error) => {
      console.error('Stream error:', err);
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    });
  } catch (err) {
    console.error('Chat error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Chat failed' });
    }
  }
});

// List conversations
router.get('/conversations', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: { userId: req.userId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, persona: true, updatedAt: true },
    });
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get conversation with messages
router.get('/conversations/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const conversation = await prisma.conversation.findFirst({
      where: { id, userId: req.userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conversation) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json(conversation);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Delete conversation
router.delete('/conversations/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    await prisma.conversation.deleteMany({ where: { id, userId: req.userId } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

export default router;
