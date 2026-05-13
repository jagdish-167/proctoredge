export type Screen = 'overview' | 'analytics' | 'flagged' | 'setup' | 'triage' | 'admin' | 'proctoring' | 'settings' | 'documentation' | 'support';

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface Exam {
  id: string;
  title: string;
  sourceType: 'file' | 'link' | 'none' | 'ai-quiz';
  examLink?: string;
  fileName?: string;
  aiContext?: string;
  questions?: Question[];
  duration: number;
  creatorId: string;
  creatorEmail: string;
  institution: string;
  createdAt: string;
}

export interface Incident {
  id: string;
  examId: string;
  studentId: string;
  studentEmail: string;
  timestamp: string;
  type: string;
  description: string;
  imageUrl: string;
  audioSnippet?: boolean;
  confidence: number;
  severity: 'MINIMAL' | 'MODERATE' | 'CRITICAL';
  status: 'review' | 'cleared' | 'flagged';
}

export interface FlaggedEvent {
  id: string;
  candidate: string;
  exam: string;
  reason: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
  thumbnailUrl: string;
}

export interface DepartmentStats {
  name: string;
  code: string;
  volume: number;
  passRate: number;
  integrityPass: 'EXCEPTIONAL' | 'CALCULATING' | 'GOOD';
}

export interface Session {
  id: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentEmail: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  violations: number;
  score?: number;
  totalQuestions?: number;
  institution: string;
}
