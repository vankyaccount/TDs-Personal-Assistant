import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { chatCompletion } from '../services/glmService';

const router = Router();

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { topic, depth } = req.body;
    if (!topic) {
      res.status(400).json({ error: 'Topic required' });
      return;
    }

    const depthLabel = depth === 'deep' ? 'comprehensive and detailed' : 'concise and focused';

    const prompt = `Research the following topic and provide a ${depthLabel} analysis.

Topic: ${topic}

Structure your response as:
## Executive Summary
Brief overview (2-3 sentences)

## Key Findings
- Numbered list of main points

## Analysis
Detailed breakdown

## Recommendations
Actionable recommendations

## Sources & References
Relevant sources to explore further`;

    const content = (await chatCompletion([
      { role: 'system', content: 'You are a thorough research analyst helping a Business Analyst / Project Coordinator.' },
      { role: 'user', content: prompt },
    ])) as string;

    res.json({ topic, content, createdAt: new Date().toISOString() });
  } catch (err) {
    console.error('Research error:', err);
    res.status(500).json({ error: 'Research failed' });
  }
});

export default router;
