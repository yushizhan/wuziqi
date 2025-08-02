'use client';

import React from 'react';
import GameBoard from '@/components/GameBoard';
import GameControls from '@/components/GameControls';
import { useGame } from '@/hooks/useGame';

export default function Home() {
  const {
    gameState,
    makeMove,
    restartGame,
    undoMove,
    isWinningPosition,
  } = useGame();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
        {/* Game Board */}
        <div className="flex-shrink-0">
          <GameBoard
            board={gameState.board}
            onCellClick={makeMove}
            currentPlayer={gameState.currentPlayer}
            gameOver={gameState.gameOver}
            isWinningPosition={isWinningPosition}
          />
        </div>

        {/* Game Controls */}
        <div className="flex-shrink-0 w-full lg:w-auto">
          <GameControls
            currentPlayer={gameState.currentPlayer}
            winner={gameState.winner}
            gameOver={gameState.gameOver}
            moveCount={gameState.moveHistory.length}
            onRestart={restartGame}
            onUndo={undoMove}
            canUndo={gameState.moveHistory.length > 0}
          />
        </div>
      </div>
    </div>
  );
}
