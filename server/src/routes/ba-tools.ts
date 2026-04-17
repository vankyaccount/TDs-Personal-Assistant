import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { chatCompletion } from '../services/glmService';

const router = Router();

const toolPrompts: Record<string, string> = {
  'status-report': `You are a project status report generator. Create a professional status report including:
- Executive Summary
- Accomplishments This Period
- Work in Progress
- Upcoming Items
- Risks/Issues
- Decisions Needed`,

  'user-story': `You are a user story writer. Create well-structured user stories including:
- User Story title
- As a [role]
- I want [feature]
- So that [benefit]
- Acceptance Criteria
- Story Points estimate`,

  'raci': `You are a RACI matrix generator. Create a RACI matrix showing:
- Tasks/Activities
- Roles (Responsible, Accountable, Consulted, Informed)
- Clear designation of who does what`,

  'risk-register': `You are a risk register specialist. Create a risk register with:
- Risk ID
- Risk Description
- Probability (High/Medium/Low)
- Impact (High/Medium/Low)
- Risk Score
- Mitigation Strategy
- Owner`,

  'requirements': `You are a requirements tracker. Structure requirements with:
- Requirement ID
- Category
- Description
- Priority
- Status
- Acceptance Criteria
- Dependencies`,

  'decision-log': `You are a decision log recorder. Create a decision log entry with:
- Decision ID
- Date
- Decision Title
- Context/Background
- Options Considered
- Decision Made
- Rationale
- Impact
- Owner`,
};

router.post('/:tool', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const tool = String(req.params.tool) as keyof typeof toolPrompts;
    const { input } = req.body;

    const systemPrompt = toolPrompts[tool];
    if (!systemPrompt) {
      res.status(400).json({ error: 'Unknown tool' });
      return;
    }

    if (!input) {
      res.status(400).json({ error: 'Input required' });
      return;
    }

    const content = (await chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: input },
    ])) as string;

    res.json({ tool, input, content, createdAt: new Date().toISOString() });
  } catch (err) {
    console.error('BA Tool error:', err);
    res.status(500).json({ error: 'Tool generation failed' });
  }
});

export default router;
