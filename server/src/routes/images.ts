import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { generateImage } from '../services/geminiService';

const router = Router();
const prisma = new PrismaClient();

router.post('/generate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { prompt, context } = req.body;
    if (!prompt) {
      res.status(400).json({ error: 'Prompt required' });
      return;
    }

    const imageData = await generateImage(prompt);
    if (!imageData) {
      res.status(500).json({ error: 'Image generation failed' });
      return;
    }

    const btsImage = await prisma.bTSImage.create({
      data: {
        prompt,
        imageData,
        context: context || 'general',
        userId: req.userId!,
      },
    });

    res.json({ id: btsImage.id, imageData: btsImage.imageData });
  } catch (err) {
    console.error('Image generation error:', err);
    res.status(500).json({ error: 'Image generation failed' });
  }
});

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const images = await prisma.bTSImage.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, prompt: true, context: true, imageData: true, createdAt: true },
    });
    res.json(images);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

export default router;
