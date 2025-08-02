// Game board component for Gomoku

'use client';

import React from 'react';
import { Board, Player } from '@/types/game';
import { BOARD_SIZE } from '@/types/game';
import { cn } from '@/lib/utils';

interface GameBoardProps {
  board: Board;
  onCellClick: (row: number, col: number) => void;
  currentPlayer: Player;
  gameOver: boolean;
  isWinningPosition: (row: number, col: number) => boolean;
}

const GameBoard: React.FC<GameBoardProps> = ({
  board,
  onCellClick,
  currentPlayer,
  gameOver,
  isWinningPosition
}) => {
  const cellSize = 'w-8 h-8';
  const pieceSize = 'w-6 h-6';

  return (
    <div className="inline-block p-4 bg-amber-100 rounded-lg shadow-lg">
      <div 
        className="grid gap-0 bg-amber-800 p-2 rounded"
        style={{ 
          gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`
        }}
      >
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const isWinning = isWinningPosition(rowIndex, colIndex);
            const isEmpty = cell === null;
            
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={cn(
                  cellSize,
                  'relative flex items-center justify-center',
                  'border border-amber-900',
                  'transition-all duration-200',
                  !gameOver && isEmpty && 'hover:bg-amber-200 cursor-pointer',
                  gameOver && 'cursor-not-allowed'
                )}
                onClick={() => !gameOver && isEmpty && onCellClick(rowIndex, colIndex)}
              >
                <div className="absolute w-1 h-1 bg-amber-900 rounded-full" />
                
                {((rowIndex === 3 && colIndex === 3) ||
                  (rowIndex === 3 && colIndex === 11) ||
                  (rowIndex === 11 && colIndex === 3) ||
                  (rowIndex === 11 && colIndex === 11) ||
                  (rowIndex === 7 && colIndex === 7)) && (
                  <div className="absolute w-2 h-2 bg-amber-900 rounded-full" />
                )}
                
                {cell && (
                  <div
                    className={cn(
                      pieceSize,
                      'rounded-full border-2 transition-all duration-300',
                      cell === 'black' 
                        ? 'bg-gray-900 border-gray-700 shadow-md' 
                        : 'bg-white border-gray-300 shadow-md',
                      isWinning && 'ring-4 ring-yellow-400 ring-opacity-70 scale-110'
                    )}
                  />
                )}
                
                {!gameOver && isEmpty && (
                  <div
                    className={cn(
                      pieceSize,
                      'rounded-full opacity-0 hover:opacity-30 transition-opacity duration-200 absolute',
                      currentPlayer === 'black' 
                        ? 'bg-gray-900' 
                        : 'bg-white border border-gray-300'
                    )}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default GameBoard;