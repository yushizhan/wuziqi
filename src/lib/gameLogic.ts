// Game logic for Gomoku (Five in a Row)

import { Board, Player, Position, BOARD_SIZE, WIN_LENGTH, DIRECTIONS } from '@/types/game';

/**
 * Create an empty game board
 */
export function createEmptyBoard(): Board {
  return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
}

/**
 * Check if a position is valid on the board
 */
export function isValidPosition(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

/**
 * Check if a cell is empty
 */
export function isCellEmpty(board: Board, row: number, col: number): boolean {
  return isValidPosition(row, col) && board[row][col] === null;
}

/**
 * Place a piece on the board
 */
export function placePiece(board: Board, row: number, col: number, player: Player): Board {
  if (!isCellEmpty(board, row, col)) {
    return board;
  }

  const newBoard = board.map(boardRow => [...boardRow]);
  newBoard[row][col] = player;
  return newBoard;
}

/**
 * Check for five in a row starting from a position in a specific direction
 */
function checkDirection(
  board: Board,
  row: number,
  col: number,
  deltaRow: number,
  deltaCol: number,
  player: Player
): boolean {
  let count = 1; // Count the current piece

  // Check in the positive direction
  let r = row + deltaRow;
  let c = col + deltaCol;
  while (isValidPosition(r, c) && board[r][c] === player) {
    count++;
    r += deltaRow;
    c += deltaCol;
  }

  // Check in the negative direction
  r = row - deltaRow;
  c = col - deltaCol;
  while (isValidPosition(r, c) && board[r][c] === player) {
    count++;
    r -= deltaRow;
    c -= deltaCol;
  }

  return count >= WIN_LENGTH;
}

/**
 * Check if placing a piece at the given position results in a win
 */
export function checkWin(board: Board, row: number, col: number): boolean {
  const player = board[row][col];
  if (!player) return false;

  return DIRECTIONS.some(([deltaRow, deltaCol]) =>
    checkDirection(board, row, col, deltaRow, deltaCol, player)
  );
}

/**
 * Check if the board is full (draw condition)
 */
export function isBoardFull(board: Board): boolean {
  return board.every(row => row.every(cell => cell !== null));
}

/**
 * Get the next player
 */
export function getNextPlayer(currentPlayer: Player): Player {
  return currentPlayer === 'black' ? 'white' : 'black';
}

/**
 * Get all winning positions for a player
 */
export function getWinningPositions(board: Board, player: Player): Position[] {
  const winningPositions: Position[] = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] === player && checkWin(board, row, col)) {
        // Find all positions that contribute to this win
        for (const [deltaRow, deltaCol] of DIRECTIONS) {
          if (checkDirection(board, row, col, deltaRow, deltaCol, player)) {
            // Add positions in this winning line
            const positions = getPositionsInLine(board, row, col, deltaRow, deltaCol, player);
            winningPositions.push(...positions);
          }
        }
      }
    }
  }

  // Remove duplicates
  return winningPositions.filter((pos, index, arr) =>
    arr.findIndex(p => p.row === pos.row && p.col === pos.col) === index
  );
}

/**
 * Get all positions in a winning line
 */
function getPositionsInLine(
  board: Board,
  row: number,
  col: number,
  deltaRow: number,
  deltaCol: number,
  player: Player
): Position[] {
  const positions: Position[] = [];
  
  // Start from the beginning of the line
  let startRow = row;
  let startCol = col;
  while (isValidPosition(startRow - deltaRow, startCol - deltaCol) && 
         board[startRow - deltaRow][startCol - deltaCol] === player) {
    startRow -= deltaRow;
    startCol -= deltaCol;
  }

  // Collect all positions in the line
  let r = startRow;
  let c = startCol;
  while (isValidPosition(r, c) && board[r][c] === player) {
    positions.push({ row: r, col: c });
    r += deltaRow;
    c += deltaCol;
  }

  return positions.length >= WIN_LENGTH ? positions.slice(0, WIN_LENGTH) : [];
}