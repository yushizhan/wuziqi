'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import GameBoard from '@/components/GameBoard';
import GameControls from '@/components/GameControls';
import { useGame } from '@/hooks/useGame';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const [gameMode, setGameMode] = useState<'menu' | 'single'>('menu');
  
  const {
    gameState,
    makeMove,
    restartGame,
    undoMove,
    isWinningPosition,
  } = useGame();

  // Game mode selection menu
  if (gameMode === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4 relative overflow-hidden">
        {/* 谭氏棋牌背景 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-6xl md:text-8xl lg:text-9xl font-bold text-amber-200/20 select-none rotate-12 transform scale-150">
            谭氏棋牌
          </div>
        </div>
        
        <Card className="w-full max-w-md relative z-10 backdrop-blur-sm bg-white/90">
          <CardHeader>
            <CardTitle className="text-center text-3xl font-bold text-amber-800">
              五子棋
            </CardTitle>
            <p className="text-center text-amber-600 text-sm">谭氏棋牌</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Single Player Mode */}
            <Button 
              onClick={() => setGameMode('single')} 
              className="w-full h-14 text-lg bg-amber-600 hover:bg-amber-700 text-white" 
              variant="default"
            >
              🎯 单人游戏
            </Button>

            {/* Multiplayer Mode */}
            <Link href="/multiplayer">
              <Button className="w-full h-14 text-lg border-amber-600 text-amber-700 hover:bg-amber-50" variant="outline">
                🌐 多人对战
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Single player game
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <div className="flex flex-col xl:flex-row gap-4 sm:gap-8 items-center xl:items-start max-w-7xl w-full">
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
        <div className="flex-shrink-0 w-full max-w-sm xl:w-auto">
          <div className="space-y-4">
            {/* Mode Switch */}
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold mb-3">单人游戏</h3>
              <div className="space-y-2">
                <Button 
                  onClick={() => setGameMode('menu')} 
                  className="w-full" 
                  variant="outline"
                >
                  返回主菜单
                </Button>
                <Link href="/multiplayer" className="block">
                  <Button className="w-full" variant="outline">
                    切换到多人模式
                  </Button>
                </Link>
              </div>
            </div>

            {/* Standard Game Controls */}
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
    </div>
  );
}
