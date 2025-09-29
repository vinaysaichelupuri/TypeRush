export interface TypingStats {
  wpm: number;
  accuracy: number;
  timeElapsed: number;
  correctKeystrokes: number;
  incorrectKeystrokes: number;
  totalKeystrokes: number;
}

export interface SessionResult extends TypingStats {
  id: string;
  date: number;
  textLength: number;
}

export interface CharacterState {
  char: string;
  status: 'untyped' | 'correct' | 'incorrect' | 'current';
}

export interface Player {
  id: string;
  name: string;
  progress: number; // characters typed correctly
  wpm: number;
  accuracy: number;
  isFinished: boolean;
  finishTime?: number;
  joinedAt: number;
  isReady?: boolean; 
}

export interface RaceRoom {
  id: string;
  creatorId: string;
  text: string;
  status: 'waiting' | 'countdown' | 'racing' | 'finished' | 'restart';
  players: { [playerId: string]: Player };
  createdAt: number;
  countdownStartedAt?: number;
  startedAt?: number;
  maxPlayers: number;
  selectedText?: string;
}

export interface RaceProgress {
  playerId: string;
  progress: number;
  wpm: number;
  accuracy: number;
  isFinished: boolean;
  timestamp: number;
}