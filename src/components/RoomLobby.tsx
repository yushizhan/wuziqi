// Room lobby component for multiplayer matching

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RoomLobbyProps {
  peerId: string;
  roomId: string;
  isHost: boolean;
  playerRole: 'black' | 'white' | null;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  hostReady?: boolean;
  guestReady?: boolean;
  lastError?: string;
  retryCount?: number;
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string) => void;
  onStartGame: () => void;
  onDisconnect: () => void;
}

const RoomLobby: React.FC<RoomLobbyProps> = ({
  peerId,
  roomId,
  isHost,
  playerRole,
  connectionStatus,
  hostReady = false,
  guestReady = false,
  lastError,
  retryCount = 0,
  onCreateRoom,
  onJoinRoom,
  onStartGame,
  onDisconnect
}) => {
  const [inputRoomId, setInputRoomId] = useState('');

  const handleJoinRoom = () => {
    if (inputRoomId.trim()) {
      onJoinRoom(inputRoomId.trim());
    }
  };

  const handleRetry = () => {
    onDisconnect();
    setInputRoomId('');
  };

  const getErrorMessage = () => {
    if (connectionStatus !== 'error') return '';
    
    if (lastError?.includes('peer-unavailable') || lastError?.includes('Could not connect')) {
      return '房间不存在或房主已离开';
    } else if (lastError?.includes('network')) {
      return '网络连接问题';
    } else if (lastError?.includes('timeout')) {
      return '连接超时，房间可能不存在';
    } else {
      return '连接失败，请重试';
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return '已连接';
      case 'connecting': return '连接中...';
      case 'error': return '连接错误';
      default: return '未连接';
    }
  };

  const getRoleDisplay = (role: 'black' | 'white' | null) => {
    if (!role) return '';
    return role === 'black' ? '黑子 (先手)' : '白子 (后手)';
  };

  const getRoleIcon = (role: 'black' | 'white' | null) => {
    if (!role) return null;
    return (
      <div
        className={cn(
          'w-6 h-6 rounded-full border-2 inline-block mr-2',
          role === 'black' 
            ? 'bg-gray-900 border-gray-700' 
            : 'bg-white border-gray-300'
        )}
      />
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="relative">
          {/* 右上角状态图标 */}
          <div className="absolute top-4 right-4 flex items-center space-x-2">
            <div className={cn('w-3 h-3 rounded-full', getStatusColor())} />
            <Link href="/">
              <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
                ←
              </Button>
            </Link>
          </div>
          
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-amber-200 shadow-lg">
              <img 
                src="/avatar.jpg" 
                alt="谭氏棋牌头像" 
                className="w-full h-full object-cover"
              />
            </div>
            <CardTitle className="text-center text-2xl font-bold text-amber-800">
              五子棋 - 多人对战
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">



          {/* Current Room Info */}
          {roomId && (
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">房间号:</div>
              <div className="text-2xl font-mono font-bold text-center bg-white p-3 rounded border mb-2 tracking-wider">
                {roomId}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Badge variant={isHost ? "default" : "secondary"}>
                    {isHost ? "房主" : "客人"}
                  </Badge>
                  {playerRole && (
                    <div className="flex items-center ml-2">
                      {getRoleIcon(playerRole)}
                      <span className="text-sm">{getRoleDisplay(playerRole)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!roomId && (
            <>
              {connectionStatus !== 'connected' && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                  <div className="text-yellow-600 text-sm">
                    {connectionStatus === 'connecting' && '正在连接服务器...'}
                    {connectionStatus === 'disconnected' && '服务器连接断开'}
                    {connectionStatus === 'error' && '服务器连接失败'}
                  </div>
                </div>
              )}
              
              {/* Create Room */}
              <div className="space-y-2">
                <Button 
                  onClick={onCreateRoom} 
                  className="w-full h-12 text-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300" 
                  variant="default"
                  disabled={connectionStatus !== 'connected'}
                >
                  创建房间
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  创建房间后，分享6位房间号给朋友加入
                </p>
              </div>

              <div className="flex items-center">
                <div className="flex-1 border-t border-gray-300"></div>
                <div className="px-4 text-sm text-gray-500">或</div>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              {/* Join Room */}
              <div className="space-y-3">
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="输入6位房间号"
                    value={inputRoomId}
                    onChange={(e) => {
                      // Only allow 6 digits
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setInputRoomId(value);
                    }}
                    className="flex-1 px-3 py-2 border border-purple-200 rounded-md text-lg font-mono text-center tracking-wider focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 bg-white/80 backdrop-blur-sm"
                    onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
                    maxLength={6}
                  />
                  <Button 
                    onClick={handleJoinRoom} 
                    disabled={inputRoomId.length !== 6 || connectionStatus !== 'connected'}
                    variant="outline"
                    className="px-6 border-2 border-cyan-400 text-cyan-600 hover:bg-cyan-50 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    加入
                  </Button>
                </div>
              </div>
            </>
          )}

          {connectionStatus === 'connecting' && (
            <div className="text-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">正在连接...</p>
            </div>
          )}

          {connectionStatus === 'connected' && isHost && (
            <div className="space-y-2">
              {guestReady && (
                <div className="p-2 bg-green-50 border border-green-200 rounded-lg text-center">
                  <span className="text-green-600 text-sm">✅ 对方已准备就绪</span>
                </div>
              )}
              {hostReady ? (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                  <span className="text-blue-600 font-medium">✅ 已准备就绪</span>
                  <p className="text-xs text-gray-500 mt-1">
                    {guestReady ? '双方已准备，等待游戏开始...' : '等待客人准备...'}
                  </p>
                </div>
              ) : (
                <>
                  <Button onClick={onStartGame} className="w-full" variant="default">
                    准备就绪
                  </Button>
                  <p className="text-xs text-gray-500 text-center">
                    点击准备就绪，等待客人加入并准备
                  </p>
                </>
              )}
            </div>
          )}

          {connectionStatus === 'connected' && !isHost && (
            <div className="space-y-2">
              {hostReady && (
                <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-center">
                  <span className="text-blue-600 text-sm">✅ 房主已准备就绪</span>
                </div>
              )}
              {guestReady ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                  <span className="text-green-600 font-medium">✅ 已准备就绪</span>
                  <p className="text-xs text-gray-500 mt-1">
                    {hostReady ? '双方已准备，等待游戏开始...' : '等待房主准备...'}
                  </p>
                </div>
              ) : (
                <>
                  <Button onClick={onStartGame} className="w-full" variant="default">
                    准备就绪
                  </Button>
                  <p className="text-xs text-gray-500 text-center">
                    已连接到房间，点击准备就绪
                  </p>
                </>
              )}
            </div>
          )}

          {connectionStatus === 'error' && (
            <div className="space-y-3">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                  <p className="text-sm text-red-600 font-medium">
                    {getErrorMessage()}
                  </p>
                </div>
                {retryCount > 0 && (
                  <p className="text-xs text-red-500 mb-2">
                    已尝试 {retryCount} 次
                  </p>
                )}
                <div className="text-xs text-red-500 space-y-1">
                  <p>• 请确认房间号正确（6位数字）</p>
                  <p>• 确保房主已创建房间并在线</p>
                  <p>• 检查网络连接状态</p>
                  {retryCount >= 3 && (
                    <p className="font-medium">• 建议尝试创建新房间</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleRetry} className="flex-1" variant="outline">
                  重新开始
                </Button>
                {retryCount < 3 && inputRoomId && (
                  <Button onClick={handleJoinRoom} className="flex-1" variant="default">
                    重试连接
                  </Button>
                )}
              </div>
            </div>
          )}

          {roomId && (
            <Button onClick={onDisconnect} className="w-full" variant="outline">
              离开房间
            </Button>
          )}


        </CardContent>
      </Card>
    </div>
  );
};

export default RoomLobby;