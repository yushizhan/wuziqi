// Game types and constants for Gomoku (Five in a Row)

export type Player = "black" | "white";
export type CellState = Player | null;
export type Board = CellState[][];

export interface GameState {
  board: Board;
  currentPlayer: Player;
  winner: Player | null;
  gameOver: boolean;
  moveHistory: Move[];
}

export interface Move {
  row: number;
  col: number;
  player: Player;
}

export interface Position {
  row: number;
  col: number;
}

// Game constants
export const BOARD_SIZE = 15;
export const WIN_LENGTH = 5;

// Directions for checking win conditions
export const DIRECTIONS = [
  [0, 1],   // horizontal
  [1, 0],   // vertical
  [1, 1],   // diagonal /
  [1, -1],  // diagonal \
] as const;