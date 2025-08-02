// Multiplayer game page

'use client';

import React, { useState, useCallback } from 'react';
import RoomLobby from '@/components/RoomLobby';
import GameBoard from '@/components/GameBoard';
import GameControls from '@/components/GameControls';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { useMultiplayerGame } from '@/hooks/useMultiplayerGame';
import { GameMessage } from '@/types/multiplayer';
import { Button } from '@/components/ui/button';

export default function MultiplayerPage() {
  const [gameStarted, setGameStarted] = useState(false);

  // Handle incoming P2P messages
  const handleMessage = useCallback((message: GameMessage) => {
    console.log('Received message:', message);
    if (message.type === 'gameState' && message.data.started) {
      setGameStarted(true);
    }
    handleOpponentMessage(message);
  }, []);

  // Handle connection status changes
  const handleConnectionChange = useCallback((status: 'disconnected' | 'connecting' | 'connected' | 'error') => {
    if (status === 'disconnected') {
      setGameStarted(false);
    }
  }, []);

  // Initialize multiplayer connection
  const {
    peerId,
    roomId,
    isHost,
    playerRole,
    connectionStatus,
    isConnected,
    createRoom,
    joinRoom,
    sendMessage,
    disconnect
  } = useMultiplayer({
    onMessage: handleMessage,
    onConnectionChange: handleConnectionChange
  });

  // Initialize game with multiplayer support
  const {
    gameState,
    isMyTurn,
    makeMove,
    restartGame,
    undoMove,
    isWinningPosition,
    handleOpponentMessage,
  } = useMultiplayerGame({
    isMultiplayer: true,
    playerRole,
    isHost,
    onSendMessage: sendMessage
  });

  const handleCreateRoom = useCallback(() => {
    const newRoomId = createRoom();
    if (newRoomId) {
      console.log('Room created:', newRoomId);
    }
  }, [createRoom]);

  const handleJoinRoom = useCallback((targetRoomId: string) => {
    const success = joinRoom(targetRoomId);
    if (success) {
      console.log('Joining room:', targetRoomId);
    }
  }, [joinRoom]);

  const handleStartGame = useCallback(() => {
    setGameStarted(true);
    // Notify opponent that game has started
    const startMessage: GameMessage = {
      type: 'gameState',
      data: { started: true },
      timestamp: Date.now(),
      playerId: 'self'
    };
    sendMessage(startMessage);
  }, [sendMessage]);

  const handleDisconnect = useCallback(() => {
    disconnect();
    setGameStarted(false);
  }, [disconnect]);

  const handleBackToLobby = useCallback(() => {
    setGameStarted(false);
  }, []);

  // Show room lobby if no room created/joined OR game not started
  if (!roomId || !gameStarted) {
    return (
      <RoomLobby
        peerId={peerId}
        roomId={roomId}
        isHost={isHost}
        playerRole={playerRole}
        connectionStatus={connectionStatus}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onStartGame={handleStartGame}
        onDisconnect={handleDisconnect}
      />
    );
  }

  // Show game interface
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
            {/* Multiplayer Game Controls */}
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold mb-3">多人对战</h3>
              
              {/* Room Info */}
              <div className="text-sm space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">房间号:</span>
                  <span className="font-mono text-lg font-bold">{roomId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">身份:</span>
                  <span>{isHost ? '房主' : '客人'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">执子:</span>
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full border mr-1 ${
                      playerRole === 'black' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'
                    }`} />
                    <span>{playerRole === 'black' ? '黑子' : '白子'}</span>
                  </div>
                </div>
              </div>

              {/* Turn Indicator */}
              <div className={`p-3 rounded-lg mb-4 ${isMyTurn ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                <div className="text-center">
                  {isMyTurn ? (
                    <span className="text-green-700 font-medium">🟢 轮到您了</span>
                  ) : (
                    <span className="text-gray-600">⏳ 等待对方下棋</span>
                  )}
                </div>
              </div>

              {/* Control Buttons */}
              <div className="space-y-2">
                <Button 
                  onClick={restartGame} 
                  className="w-full" 
                  variant="default"
                  disabled={!isHost} // Only host can restart
                >
                  重新开始 {!isHost && '(仅房主)'}
                </Button>
                <Button 
                  onClick={undoMove} 
                  disabled={gameState.moveHistory.length < 2 || !isHost} 
                  className="w-full" 
                  variant="outline"
                >
                  悔棋 {!isHost && '(仅房主)'}
                </Button>
                <Button 
                  onClick={handleBackToLobby} 
                  className="w-full" 
                  variant="outline"
                >
                  返回大厅
                </Button>
                <Button 
                  onClick={handleDisconnect} 
                  className="w-full" 
                  variant="destructive"
                >
                  离开游戏
                </Button>
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
              canUndo={gameState.moveHistory.length >= 2 && isHost}
            />
          </div>
        </div>
      </div>
    </div>
  );
}