// Hook for managing Socket.IO multiplayer connections

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameMessage, SocketResponse, PlayerJoinedEvent, PlayerReadyUpdateEvent } from '@/types/multiplayer';
import { Player } from '@/types/game';

interface UseSocketIOProps {
  onMessage: (message: GameMessage) => void;
  onConnectionChange: (status: 'disconnected' | 'connecting' | 'connected' | 'error') => void;
}

export function useSocketIO({ onMessage, onConnectionChange }: UseSocketIOProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [socketId, setSocketId] = useState<string>('');
  const [roomId, setRoomId] = useState<string>('');
  const [isHost, setIsHost] = useState<boolean>(false);
  const [playerRole, setPlayerRole] = useState<Player | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [lastError, setLastError] = useState<string>('');
  const [hostReady, setHostReady] = useState<boolean>(false);
  const [guestReady, setGuestReady] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);

  const socketRef = useRef<Socket | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Socket.IO connection
  const initializeSocket = useCallback(() => {
    if (socketRef.current?.connected) {
      return socketRef.current;
    }

    const newSocket = io(process.env.NODE_ENV === 'production' 
      ? window.location.origin 
      : `http://localhost:${window.location.port || '3001'}`, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      timeout: 10000
    });

    newSocket.on('connect', () => {
      console.log('Socket.IO connected:', newSocket.id);
      setSocketId(newSocket.id || '');
      setConnectionStatus('connected');
      onConnectionChange('connected');
      setLastError('');
      setRetryCount(0);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
      setConnectionStatus('disconnected');
      onConnectionChange('disconnected');
      setSocketId('');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      setLastError(`Connection failed: ${error.message}`);
      setConnectionStatus('error');
      onConnectionChange('error');
    });

    newSocket.on('reconnect_failed', () => {
      console.error('Socket.IO reconnection failed');
      setLastError('Unable to reconnect to the server. Please refresh the page and try again.');
      setConnectionStatus('error');
      onConnectionChange('error');
    });

    // Game event listeners
    newSocket.on('player-joined', (data: PlayerJoinedEvent) => {
      console.log('Player joined room:', data);
      setGuestReady(false); // Reset guest ready state
    });

    newSocket.on('player-ready-update', (data: PlayerReadyUpdateEvent) => {
      console.log('Player ready update:', data);
      setHostReady(data.hostReady);
      setGuestReady(data.guestReady);
    });

    newSocket.on('game-start', () => {
      console.log('Game started');
      onMessage({
        type: 'startGame',
        data: {},
        timestamp: Date.now(),
        playerId: 'system'
      });
    });

    newSocket.on('game-message', (message: GameMessage) => {
      console.log('Received game message:', message.type, message.data, 'from sender:', message.senderId);
      onMessage(message);
    });

    newSocket.on('host-disconnected', () => {
      console.log('Host disconnected');
      setLastError('The host has disconnected. Please create a new room or join another one.');
      setConnectionStatus('error');
      onConnectionChange('error');
      handleDisconnect();
    });

    newSocket.on('guest-disconnected', () => {
      console.log('Guest disconnected');
      setGuestReady(false);
      // Don't set error state for host when guest leaves
    });

    socketRef.current = newSocket;
    setSocket(newSocket);
    return newSocket;
  }, [onMessage, onConnectionChange]);

  // Create room
  const createRoom = useCallback(() => {
    if (!socketRef.current?.connected) {
      setLastError('Not connected to server. Please wait for connection.');
      return;
    }

    setConnectionStatus('connecting');
    onConnectionChange('connecting');

    socketRef.current.emit('create-room', (response: SocketResponse) => {
      if (response.success && response.roomId) {
        console.log('Room created:', response.roomId);
        setRoomId(response.roomId);
        setIsHost(true);
        setPlayerRole('black');
        setHostReady(false);
        setGuestReady(false);
        setConnectionStatus('connected');
        onConnectionChange('connected');
        setLastError('');
      } else {
        console.error('Failed to create room:', response.error);
        setLastError(response.error || 'Failed to create room');
        setConnectionStatus('error');
        onConnectionChange('error');
      }
    });
  }, [onConnectionChange]);

  // Join room with retry mechanism
  const joinRoom = useCallback((roomNumber: string, currentRetryCount: number = 0) => {
    if (!socketRef.current?.connected) {
      setLastError('Not connected to server. Please wait for connection.');
      return false;
    }

    // Clear any existing retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    // Validate 6-digit room number
    if (!/^\d{6}$/.test(roomNumber)) {
      setLastError('Invalid room number format. Must be 6 digits.');
      setConnectionStatus('error');
      onConnectionChange('error');
      return false;
    }

    setConnectionStatus('connecting');
    onConnectionChange('connecting');
    setRetryCount(currentRetryCount);

    socketRef.current.emit('join-room', roomNumber, (response: SocketResponse) => {
      if (response.success && response.roomId) {
        console.log('Joined room:', response.roomId);
        setRoomId(response.roomId);
        setIsHost(false);
        setPlayerRole('white');
        setHostReady(false);
        setGuestReady(false);
        setConnectionStatus('connected');
        onConnectionChange('connected');
        setLastError('');
        setRetryCount(0);
      } else {
        console.error('Failed to join room:', response.error);
        
        // Retry for certain types of errors
        if (currentRetryCount < 3 && response.error?.includes('does not exist')) {
          const delay = 2000 * Math.pow(2, currentRetryCount); // Exponential backoff
          console.log(`Retrying join in ${delay}ms (attempt ${currentRetryCount + 1}/3)`);
          
          retryTimeoutRef.current = setTimeout(() => {
            joinRoom(roomNumber, currentRetryCount + 1);
          }, delay);
        } else {
          setLastError(response.error || 'Failed to join room');
          setConnectionStatus('error');
          onConnectionChange('error');
        }
      }
    });

    return true;
  }, [onConnectionChange]);

  // Send player ready signal
  const sendPlayerReady = useCallback(() => {
    if (!socketRef.current?.connected) {
      console.warn('Cannot send ready signal: not connected');
      return;
    }

    socketRef.current.emit('player-ready');
    
    // Update local ready state
    if (isHost) {
      setHostReady(true);
    } else {
      setGuestReady(true);
    }
  }, [isHost]);

  // Send game message
  const sendMessage = useCallback((message: Omit<GameMessage, 'timestamp' | 'playerId'>) => {
    if (!socketRef.current?.connected) {
      console.warn('Cannot send message: not connected');
      return false;
    }

    const fullMessage: GameMessage = {
      ...message,
      timestamp: Date.now(),
      playerId: socketId
    };

    console.log('Sending game message:', fullMessage.type, fullMessage.data);
    socketRef.current.emit('game-message', fullMessage);
    return true;
  }, [socketId]);

  // Disconnect and cleanup
  const disconnect = useCallback(() => {
    handleDisconnect();
  }, []);

  const handleDisconnect = useCallback(() => {
    // Clear retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    // Leave room if connected
    if (socketRef.current?.connected && roomId) {
      socketRef.current.emit('leave-room');
    }

    // Disconnect socket
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Reset all state
    setSocket(null);
    setSocketId('');
    setRoomId('');
    setIsHost(false);
    setPlayerRole(null);
    setHostReady(false);
    setGuestReady(false);
    setRetryCount(0);
    setLastError('');
    setConnectionStatus('disconnected');
    onConnectionChange('disconnected');

    // Reinitialize socket for future connections
    setTimeout(() => {
      initializeSocket();
    }, 1000);
  }, [roomId, onConnectionChange, initializeSocket]);

  // Initialize socket on mount
  useEffect(() => {
    initializeSocket();

    return () => {
      // Cleanup on unmount
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [initializeSocket]);

  return {
    socket,
    socketId,
    roomId,
    isHost,
    playerRole,
    connectionStatus,
    lastError,
    retryCount,
    hostReady,
    guestReady,
    isConnected: connectionStatus === 'connected',
    isRoomReady: roomId !== '',
    areBothPlayersReady: hostReady && guestReady,
    createRoom,
    joinRoom,
    sendMessage,
    sendPlayerReady,
    disconnect
  };
}