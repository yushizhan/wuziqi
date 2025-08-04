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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50 flex items-center justify-center p-4 relative overflow-hidden">
        {/* 谭氏棋牌背景 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-6xl md:text-8xl lg:text-9xl font-bold text-purple-200/20 select-none rotate-12 transform scale-150">
            谭氏棋牌
          </div>
        </div>
        
        <Card className="w-full max-w-md relative z-10 backdrop-blur-sm bg-white/90">
          <CardHeader>
            <div className="flex flex-col items-center space-y-4">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-amber-200 shadow-lg">
                <img 
                  src="/avatar.jpg" 
                  alt="谭氏棋牌头像" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-center">
                <CardTitle className="text-2xl font-light text-slate-700">
                  五子棋
                </CardTitle>
                <p className="text-slate-500 text-xs font-light">谭氏棋牌</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Single Player Mode */}
            <Button 
              onClick={() => setGameMode('single')} 
              className="w-full h-14 text-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300" 
              variant="default"
            >
              🎯 单人游戏
            </Button>

            {/* Multiplayer Mode */}
            <Link href="/multiplayer">
              <Button className="w-full h-14 text-lg border-2 border-purple-400 text-purple-600 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-purple-50 shadow-lg hover:shadow-xl transition-all duration-300" variant="outline">
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50 flex items-center justify-center p-4">
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
