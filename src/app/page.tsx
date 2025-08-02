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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-3xl font-bold">
              五子棋 (Gomoku)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-gray-600 mb-6">
              选择游戏模式
            </div>

            {/* Single Player Mode */}
            <Button 
              onClick={() => setGameMode('single')} 
              className="w-full h-12 text-lg" 
              variant="default"
            >
              🎯 单人游戏
            </Button>
            <p className="text-xs text-gray-500 text-center -mt-2">
              在本地进行游戏，支持悔棋功能
            </p>

            {/* Multiplayer Mode */}
            <Link href="/multiplayer">
              <Button className="w-full h-12 text-lg" variant="outline">
                🌐 多人对战
              </Button>
            </Link>
            <p className="text-xs text-gray-500 text-center -mt-2">
              通过房间ID与朋友在线对战
            </p>

            {/* Game Rules */}
            <div className="text-xs text-gray-500 bg-blue-50 p-4 rounded-lg mt-6">
              <div className="font-semibold mb-2">游戏规则:</div>
              <ul className="space-y-1">
                <li>• 黑子先手，白子后手</li>
                <li>• 横、竖、斜任意方向连成五子获胜</li>
                <li>• 棋盘大小为 15×15</li>
                <li>• 多人模式中房主执黑子</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Single player game
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
