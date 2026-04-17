export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  persona?: string;
  updatedAt: string;
  messages?: Message[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  quadrant: 1 | 2 | 3 | 4;
  status: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailDraft {
  id: string;
  subject: string;
  body: string;
  template: string;
  tone: number;
  context?: string;
  createdAt: string;
}

export interface MeetingNote {
  id: string;
  title: string;
  transcript?: string;
  structuredNotes?: {
    summary?: string;
    actionItems?: Array<{ assignee?: string; task?: string; deadline?: string }>;
    decisions?: string[];
    attendees?: string[];
    keyTopics?: string[];
    followUps?: string[];
  };
  audioUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BTSMember {
  id: string;
  name: string;
  fullName: string;
  role: string;
  avatar: string;
  systemPrompt: string;
}

export interface NewsArticle {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

export type BAToolType = 'status-report' | 'user-story' | 'raci' | 'risk-register' | 'requirements' | 'decision-log';
