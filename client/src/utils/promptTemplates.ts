export const promptTemplates = {
  email: {
    client: 'Draft a professional email to a client regarding project updates, using a {tone} tone.',
    leadership: 'Draft an email to leadership summarizing project status and key decisions, using a {tone} tone.',
    team: 'Draft an email to the team about upcoming milestones and action items, using a {tone} tone.',
  },
  research: {
    deep: 'Provide a comprehensive and detailed research analysis on the topic.',
    quick: 'Provide a concise and focused research summary on the topic.',
  },
  meeting: 'Structure meeting notes into: summary, action items (with assignees and deadlines), decisions made, attendees, key topics discussed, and follow-ups required.',
};

export const toneLabels: Record<number, string> = {
  0: 'Very Formal',
  25: 'Formal',
  50: 'Professional',
  75: 'Friendly',
  100: 'Casual',
};

export const getToneLabel = (value: number): string => {
  return toneLabels[value] || toneLabels[50];
};
