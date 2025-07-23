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