import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { chatCompletion } from '../services/glmService';

const router = Router();
const prisma = new PrismaClient();

router.post('/draft', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { template, tone, context, recipient } = req.body;

    const toneLabel =
      tone <= 25 ? 'very formal' : tone <= 50 ? 'professional' : tone <= 75 ? 'friendly' : 'casual';

    const prompt = `You are a professional email drafter for a Business Analyst / Project Coordinator.
Draft an email using the "${template}" template with a ${toneLabel} tone.

Context: ${context || 'General communication'}
Recipient type: ${recipient || template}

Return the email with clear Subject and Body sections. Format as:
Subject: [subject line]

[email body]`;

    const content = (await chatCompletion([
      { role: 'system', content: 'You are a professional email writing assistant.' },
      { role: 'user', content: prompt },
    ])) as string;

    // Parse subject and body
    const subjectMatch = content.match(/Subject:\s*(.+?)(?:\n|$)/);
    const subject = subjectMatch?.[1]?.trim() || 'Draft Email';
    const body = content.replace(/Subject:\s*.+?\n/, '').trim();

    const draft = await prisma.emailDraft.create({
      data: {
        subject,
        body,
        template: template || 'general',
        tone: tone || 50,
        context,
        userId: req.userId!,
      },
    });

    res.json(draft);
  } catch (err) {
    console.error('Email draft error:', err);
    res.status(500).json({ error: 'Failed to generate email draft' });
  }
});

router.get('/drafts', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const drafts = await prisma.emailDraft.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json(drafts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch drafts' });
  }
});

export default router;
