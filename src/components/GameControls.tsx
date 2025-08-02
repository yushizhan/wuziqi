// Game controls and status component for Gomoku

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Player } from '@/types/game';
import { cn } from '@/lib/utils';

interface GameControlsProps {
  currentPlayer: Player;
  winner: Player | null;
  gameOver: boolean;
  moveCount: number;
  onRestart: () => void;
  onUndo: () => void;
  canUndo: boolean;
}

const GameControls: React.FC<GameControlsProps> = ({
  currentPlayer,
  winner,
  gameOver,
  moveCount,
  onRestart,
  onUndo,
  canUndo
}) => {
  const getPlayerDisplay = (player: Player) => {
    return player === 'black' ? '黑子' : '白子';
  };

  const getPlayerIcon = (player: Player) => {
    return (
      <div
        className={cn(
          'w-6 h-6 rounded-full border-2 inline-block mr-2',
          player === 'black' 
            ? 'bg-gray-900 border-gray-700' 
            : 'bg-white border-gray-300'
        )}
      />
    );
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold">
          五子棋 (Gomoku)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          {winner ? (
            <div className="space-y-2">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                 游戏结束
              </Badge>
              <div className="flex items-center justify-center text-xl font-semibold">
                {getPlayerIcon(winner)}
                <span>{getPlayerDisplay(winner)} 获胜！</span>
              </div>
            </div>
          ) : gameOver ? (
            <Badge variant="outline" className="text-lg px-4 py-2">
              平局 - 棋盘已满
            </Badge>
          ) : (
            <div className="space-y-2">
              <Badge variant="default" className="text-base px-3 py-1">
                当前回合
              </Badge>
              <div className="flex items-center justify-center text-lg font-medium">
                {getPlayerIcon(currentPlayer)}
                <span>{getPlayerDisplay(currentPlayer)} 的回合</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-600">步数:</span>
          <Badge variant="outline">{moveCount}</Badge>
        </div>

        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
          <div className="font-semibold mb-1">游戏规则:</div>
          <ul className="space-y-1">
            <li> 黑子先手</li>
            <li> 连续五子获胜</li>
            <li> 横、竖、斜均可</li>
          </ul>
        </div>

        <div className="space-y-2">
          <Button onClick={onRestart} className="w-full" variant="default">
             重新开始
          </Button>
          <Button onClick={onUndo} disabled={!canUndo} className="w-full" variant="outline">
             悔棋
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className={cn(
            'p-3 rounded-lg border-2 transition-all duration-200',
            currentPlayer === 'black' && !gameOver ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
          )}>
            <div className="flex items-center">
              {getPlayerIcon('black')}
              <span className="text-sm font-medium">黑子</span>
            </div>
            {winner === 'black' && (
              <div className="text-xs text-green-600 font-semibold mt-1">胜利!</div>
            )}
          </div>
          
          <div className={cn(
            'p-3 rounded-lg border-2 transition-all duration-200',
            currentPlayer === 'white' && !gameOver ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
          )}>
            <div className="flex items-center">
              {getPlayerIcon('white')}
              <span className="text-sm font-medium">白子</span>
            </div>
            {winner === 'white' && (
              <div className="text-xs text-green-600 font-semibold mt-1">胜利!</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GameControls;