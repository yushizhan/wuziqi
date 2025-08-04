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
  // 响应式格子大小 - 移动端更大，桌面端适中
  const cellSize = 'w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10';
  const pieceSize = 'w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8';

  return (
    <div className="inline-block p-3 sm:p-6 max-w-full overflow-hidden">
      {/* 外层科幻边框 */}
      <div className="relative p-4 bg-gradient-to-br from-purple-100/80 to-pink-100/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/30">
        {/* 装饰性光晕 */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-200/20 via-purple-200/20 to-pink-200/20 rounded-3xl animate-pulse"></div>
        
        {/* 棋盘主体 */}
        <div 
          className="relative grid gap-0 bg-gradient-to-br from-indigo-50/90 to-purple-50/90 backdrop-blur-sm p-2 sm:p-3 rounded-2xl shadow-inner border border-white/50 touch-manipulation"
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
                  'border border-slate-200/50',
                  'transition-all duration-300 ease-out',
                  'touch-manipulation',
                  'backdrop-blur-sm',
                  !gameOver && isEmpty && 'hover:bg-gradient-to-br hover:from-cyan-100/60 hover:to-purple-100/60 hover:shadow-lg hover:border-cyan-300/60 cursor-pointer transform hover:scale-105',
                  !gameOver && isEmpty && 'active:bg-gradient-to-br active:from-purple-200/70 active:to-pink-200/70',
                  gameOver && 'cursor-not-allowed'
                )}
                onClick={() => !gameOver && isEmpty && onCellClick(rowIndex, colIndex)}
              >
                {/* 网格线交点 */}
                <div className="absolute w-0.5 h-0.5 bg-slate-300/60 rounded-full" />
                
                {/* 星位 - 科幻风格 */}
                {((rowIndex === 3 && colIndex === 3) ||
                  (rowIndex === 3 && colIndex === 11) ||
                  (rowIndex === 11 && colIndex === 3) ||
                  (rowIndex === 11 && colIndex === 11) ||
                  (rowIndex === 7 && colIndex === 7)) && (
                  <div className="absolute w-1.5 h-1.5 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full shadow-lg animate-pulse" />
                )}
                
                {cell && (
                  <div
                    className={cn(
                      pieceSize,
                      'rounded-full transition-all duration-500 ease-out transform',
                      'shadow-2xl backdrop-blur-sm',
                      cell === 'black' 
                        ? 'bg-gradient-to-br from-slate-800 via-purple-900 to-indigo-900 border-2 border-purple-400/50 shadow-purple-500/30' 
                        : 'bg-gradient-to-br from-white via-pink-50 to-cyan-50 border-2 border-pink-200/80 shadow-pink-300/40',
                      isWinning && 'ring-4 ring-cyan-400 scale-125 animate-bounce shadow-cyan-400/50',
                      !isWinning && 'hover:scale-105'
                    )}
                  />
                )}
                
                {!gameOver && isEmpty && (
                  <div
                    className={cn(
                      pieceSize,
                      'rounded-full opacity-0 hover:opacity-50 transition-all duration-300 absolute transform hover:scale-110',
                      'shadow-xl backdrop-blur-sm',
                      currentPlayer === 'black' 
                        ? 'bg-gradient-to-br from-slate-700/70 via-purple-800/70 to-indigo-800/70 border border-purple-400/40' 
                        : 'bg-gradient-to-br from-white/80 via-pink-50/80 to-cyan-50/80 border border-pink-200/60'
                    )}
                  />
                )}
              </div>
            );
          })
        )}
        </div>
      </div>
    </div>
  );
};

export default GameBoard;