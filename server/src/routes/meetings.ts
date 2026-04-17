import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import fetch from 'node-fetch';
import * as fs from 'fs';
import { authenticate, AuthRequest } from '../middleware/auth';
import { chatCompletion } from '../services/glmService';

const router = Router();
const prisma = new PrismaClient();
const upload = multer({ dest: 'uploads/', limits: { fileSize: 25 * 1024 * 1024 } });

// Transcribe audio with Whisper
router.post('/transcribe', authenticate, upload.single('audio'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No audio file provided' });
      return;
    }

    const formData = new (require('form-data'))();
    formData.append('file', fs.createReadStream(req.file.path), {
      filename: req.file.originalname || 'audio.webm',
      contentType: req.file.mimetype,
    });
    formData.append('model', 'whisper-1');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: formData,
    });

    // Cleanup uploaded file
    fs.unlinkSync(req.file.path);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Whisper API error: ${text}`);
    }

    const data = (await response.json()) as any;
    res.json({ transcript: data.text });
  } catch (err) {
    console.error('Transcription error:', err);
    res.status(500).json({ error: 'Transcription failed' });
  }
});

// Structure meeting notes with GLM
router.post('/structure', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { title, transcript } = req.body;
    if (!transcript) {
      res.status(400).json({ error: 'Transcript required' });
      return;
    }

    const prompt = `Analyze this meeting transcript and create structured notes.

Transcript:
${transcript}

Return a JSON object with:
- summary: Brief meeting summary (2-3 sentences)
- actionItems: Array of { assignee, task, deadline }
- decisions: Array of strings
- attendees: Array of names mentioned
- keyTopics: Array of main discussion points
- followUps: Array of follow-up items`;

    const content = (await chatCompletion([
      { role: 'system', content: 'You are a meeting notes organizer. Return valid JSON only.' },
      { role: 'user', content: prompt },
    ])) as string;

    let structuredNotes;
    try {
      const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
      structuredNotes = JSON.parse(jsonStr);
    } catch {
      structuredNotes = { summary: content, actionItems: [], decisions: [], attendees: [], keyTopics: [], followUps: [] };
    }

    const note = await prisma.meetingNote.create({
      data: {
        title: title || 'Meeting Notes',
        transcript,
        structuredNotes,
        userId: req.userId!,
      },
    });

    res.json(note);
  } catch (err) {
    console.error('Structure error:', err);
    res.status(500).json({ error: 'Failed to structure notes' });
  }
});

// List meeting notes
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const notes = await prisma.meetingNote.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch meeting notes' });
  }
});

export default router;
