import type { Square as ChessJsSquare } from 'chess.js';

export type Square = ChessJsSquare;
export type PlayerColor = 'w' | 'b';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameMode = 'ai' | 'friend';

export enum GameState {
  SETTINGS,
  PLAYING,
  GAME_OVER
}

export interface Move {
  from: Square;
  to: Square;
}

export interface GameOver {
  title: string;
  message: string;
}
