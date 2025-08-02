// Custom hook for managing Gomoku game state

import { useState, useCallback } from 'react';
import { GameState, Player, Move, Position } from '@/types/game';
import {
  createEmptyBoard,
  placePiece,
  checkWin,
  isBoardFull,
  getNextPlayer,
  isCellEmpty,
  getWinningPositions
} from '@/lib/gameLogic';

export function useGame() {
  const [gameState, setGameState] = useState<GameState>(() => ({
    board: createEmptyBoard(),
    currentPlayer: 'black' as Player,
    winner: null,
    gameOver: false,
    moveHistory: [],
  }));

  const [winningPositions, setWinningPositions] = useState<Position[]>([]);

  // Make a move on the board
  const makeMove = useCallback((row: number, col: number): boolean => {
    if (gameState.gameOver || !isCellEmpty(gameState.board, row, col)) {
      return false;
    }

    const newBoard = placePiece(gameState.board, row, col, gameState.currentPlayer);
    const move: Move = {
      row,
      col,
      player: gameState.currentPlayer,
    };

    const isWin = checkWin(newBoard, row, col);
    const isDraw = !isWin && isBoardFull(newBoard);
    
    let winPositions: Position[] = [];
    if (isWin) {
      winPositions = getWinningPositions(newBoard, gameState.currentPlayer);
    }

    setGameState(prev => ({
      ...prev,
      board: newBoard,
      currentPlayer: isWin || isDraw ? prev.currentPlayer : getNextPlayer(prev.currentPlayer),
      winner: isWin ? prev.currentPlayer : null,
      gameOver: isWin || isDraw,
      moveHistory: [...prev.moveHistory, move],
    }));

    setWinningPositions(winPositions);
    return true;
  }, [gameState]);

  // Restart the game
  const restartGame = useCallback(() => {
    setGameState({
      board: createEmptyBoard(),
      currentPlayer: 'black',
      winner: null,
      gameOver: false,
      moveHistory: [],
    });
    setWinningPositions([]);
  }, []);

  // Undo the last move
  const undoMove = useCallback(() => {
    if (gameState.moveHistory.length === 0) return false;

    const newHistory = [...gameState.moveHistory];
    const lastMove = newHistory.pop()!;
    
    const newBoard = createEmptyBoard();
    newHistory.forEach(move => {
      newBoard[move.row][move.col] = move.player;
    });

    setGameState({
      board: newBoard,
      currentPlayer: newHistory.length % 2 === 0 ? 'black' : 'white',
      winner: null,
      gameOver: false,
      moveHistory: newHistory,
    });

    setWinningPositions([]);
    return true;
  }, [gameState.moveHistory]);

  // Check if a position is a winning position
  const isWinningPosition = useCallback((row: number, col: number): boolean => {
    return winningPositions.some(pos => pos.row === row && pos.col === col);
  }, [winningPositions]);

  return {
    gameState,
    winningPositions,
    makeMove,
    restartGame,
    undoMove,
    isWinningPosition,
  };
}