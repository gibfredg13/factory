import { ReactNode } from 'react';

export type Language = 'en' | 'nl';

export interface TranslationContent {
  title: string;
  subtitle?: string;
  badge?: string;
  description: string;
}

export interface CommandTab {
  label: string;
  command: string;
}

export interface TerminalStep {
  label?: string;
  command?: string;
  tabs?: CommandTab[];
  output?: string;
  context?: string;
}

export interface Hint {
  title: string;
  content: string;
  type: 'info' | 'setup' | 'command' | 'solution' | 'ing';
}

export interface ChallengeData {
  id: number;
  title: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  theory: {
    title: string;
    content: string; // Supports basic HTML/Markdown-like structure
    analogy?: string;
    visual?: ReactNode;
  };
  realWorld?: {
    title: string;
    description: string;
    scenario: string;
  };
  task: {
    title: string;
    steps: TerminalStep[];
  };
  hints: Hint[];
}

export interface AppContent {
  header: {
    title: string;
    subtitle: string;
    badge: string;
  };
  challenges: ChallengeData[];
  completion: {
    title: string;
    badge: string;
    learnedTitle: string;
    learnedPoints: string[];
    applyTitle: string;
    applyPoints: string[];
  };
}