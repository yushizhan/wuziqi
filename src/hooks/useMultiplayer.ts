// Hook for managing multiplayer P2P connections

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { GameMessage, MultiplayerGameState } from '@/types/multiplayer';
import { Player } from '@/types/game';

interface UseMultiplayerProps {
  onMessage: (message: GameMessage) => void;
  onConnectionChange: (status: 'disconnected' | 'connecting' | 'connected' | 'error') => void;
}

export function useMultiplayer({ onMessage, onConnectionChange }: UseMultiplayerProps) {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [connection, setConnection] = useState<DataConnection | null>(null);
  const [peerId, setPeerId] = useState<string>('');
  const [roomId, setRoomId] = useState<string>('');
  const [displayRoomId, setDisplayRoomId] = useState<string>(''); // 6-digit room number for display
  const [isHost, setIsHost] = useState<boolean>(false);
  const [playerRole, setPlayerRole] = useState<Player | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [lastError, setLastError] = useState<string>('');
  const [retryCount, setRetryCount] = useState<number>(0);

  const connectionRef = useRef<DataConnection | null>(null);
  const roomMappingRef = useRef<Map<string, string>>(new Map()); // Map 6-digit ID to actual peer ID
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Generate 6-digit room number
  const generateRoomNumber = useCallback((): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }, []);

  // Initialize PeerJS with custom ID for room creation
  const initializePeer = useCallback((customId?: string) => {
    const peerOptions: any = {
      host: '0.peerjs.com',
      port: 443,
      path: '/',
      secure: true,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' }
        ]
      },
      debug: 2
    };
    
    // If creating a room, use room number as peer ID
    if (customId) {
      peerOptions.id = `room-${customId}`;
    }
    
    const newPeer = new Peer(peerOptions);

    newPeer.on('open', (id) => {
      console.log('My peer ID is: ' + id);
      setPeerId(id);
      setConnectionStatus('disconnected');
      onConnectionChange('disconnected');
      console.log('Peer initialized successfully, ready for connections');
    });

    newPeer.on('connection', (conn) => {
      console.log('Incoming connection from:', conn.peer);
      acceptConnection(conn);
    });

    newPeer.on('error', (err) => {
      console.error('Peer error:', err);
      console.error('Error type:', err.type);
      console.error('Error message:', err.message);
      setLastError(`${err.type}: ${err.message}`);
      setConnectionStatus('error');
      onConnectionChange('error');
      
      // Try to reinitialize peer after error
      if (err.type === 'unavailable-id' || err.type === 'server-error') {
        console.log('Attempting to reinitialize peer...');
        setTimeout(() => {
          const retryPeer = initializePeer();
          setPeer(retryPeer);
        }, 2000);
      }
    });

    setPeer(newPeer);
    return newPeer;
  }, [onConnectionChange]);

  // Accept incoming connection
  const acceptConnection = useCallback((conn: DataConnection) => {
    setConnectionStatus('connecting');
    onConnectionChange('connecting');

    conn.on('open', () => {
      console.log('Connection established with:', conn.peer);
      setConnection(conn);
      connectionRef.current = conn;
      setConnectionStatus('connected');
      onConnectionChange('connected');
      
      // Check if this peer is the host based on current state
      // If we already have a room ID and displayRoomId, we are the host
      if (displayRoomId && isHost) {
        // We are the host, guest is connecting to us
        console.log('Guest connected to our room:', displayRoomId);
        
        // Send room info to guest
        const roomInfoMessage: GameMessage = {
          type: 'roomInfo',
          data: { roomNumber: displayRoomId },
          timestamp: Date.now(),
          playerId: 'host'
        };
        conn.send(roomInfoMessage);
      } else {
        // We are the guest
        setIsHost(false);
        setPlayerRole('white'); // Host is black, guest is white
      }
    });

    conn.on('data', (data) => {
      console.log('Received data:', data);
      const message = data as GameMessage;
      
      // Handle room info message
      if (message.type === 'roomInfo') {
        console.log('Received room info:', message.data.roomNumber);
        setDisplayRoomId(message.data.roomNumber);
        // If we received room info, we are the guest
        if (!isHost) {
          setPlayerRole('white');
        }
      } else {
        onMessage(message);
      }
    });

    conn.on('close', () => {
      console.log('Connection closed');
      setConnectionStatus('disconnected');
      onConnectionChange('disconnected');
      setConnection(null);
      connectionRef.current = null;
    });

    conn.on('error', (err) => {
      console.error('Connection error:', err);
      console.error('Error type:', err.type);
      setConnectionStatus('error');
      onConnectionChange('error');
    });
  }, [onMessage, onConnectionChange, displayRoomId, isHost]);

  // Retry connection with exponential backoff
  const retryConnection = useCallback((roomNumber: string, currentRetryCount: number = 0) => {
    const maxRetries = 3;
    const baseDelay = 2000; // 2 seconds
    
    if (currentRetryCount >= maxRetries) {
      setLastError(`Failed to connect to room ${roomNumber} after ${maxRetries} attempts. Please check the room number and ensure the host is online.`);
      setConnectionStatus('error');
      onConnectionChange('error');
      return;
    }
    
    const delay = baseDelay * Math.pow(2, currentRetryCount); // Exponential backoff
    console.log(`Retrying connection to room ${roomNumber} in ${delay}ms (attempt ${currentRetryCount + 1}/${maxRetries})`);
    
    retryTimeoutRef.current = setTimeout(() => {
      setRetryCount(currentRetryCount + 1);
      joinRoom(roomNumber, currentRetryCount + 1);
    }, delay);
  }, [onConnectionChange]);

  // Connect to a room (join as guest)
  const joinRoom = useCallback((roomNumber: string, currentRetryCount: number = 0) => {
    if (!peer || !peer.id) {
      console.error('Peer not initialized or no peer ID');
      return false;
    }

    // Clear any existing retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    // Validate 6-digit room number
    if (!/^\d{6}$/.test(roomNumber)) {
      console.error('Invalid room number format. Must be 6 digits.');
      setConnectionStatus('error');
      onConnectionChange('error');
      return false;
    }

    const targetPeerId = `room-${roomNumber}`;
    setRoomId(targetPeerId);
    setDisplayRoomId(roomNumber);
    setIsHost(false);
    setPlayerRole('white');
    setConnectionStatus('connecting');
    onConnectionChange('connecting');

    console.log('Attempting to connect to peer:', targetPeerId);
    console.log('My peer ID:', peer.id);
    
    // Add connection timeout
    const connectionTimeout = setTimeout(() => {
      console.error('Connection timeout - room may not exist or host disconnected');
      setLastError(`Connection timeout: Unable to connect to room ${roomNumber}. The room may not exist, the host may be offline, or there may be network issues. Please check the room number and try again.`);
      setConnectionStatus('error');
      onConnectionChange('error');
    }, 15000); // Increased to 15 seconds
    
    try {
      const conn = peer.connect(targetPeerId, {
        reliable: true,
        serialization: 'json',
        metadata: { joinTime: Date.now() }
      });
      
      if (!conn) {
        clearTimeout(connectionTimeout);
        console.error('Failed to create connection object');
        setConnectionStatus('error');
        onConnectionChange('error');
        return false;
      }
      
      let connectionEstablished = false;
      
      conn.on('open', () => {
        if (connectionEstablished) return;
        connectionEstablished = true;
        
        clearTimeout(connectionTimeout);
        console.log('Successfully connected to room:', roomNumber, 'peer:', targetPeerId);
        setConnection(conn);
        connectionRef.current = conn;
        setConnectionStatus('connected');
        onConnectionChange('connected');
      });

      conn.on('data', (data) => {
        console.log('Received data:', data);
        const message = data as GameMessage;
        
        // Handle room info message
        if (message.type === 'roomInfo') {
          console.log('Received room info confirmation:', message.data.roomNumber);
          setDisplayRoomId(message.data.roomNumber);
        } else {
          onMessage(message);
        }
      });

      conn.on('close', () => {
        clearTimeout(connectionTimeout);
        console.log('Connection closed');
        setConnectionStatus('disconnected');
        onConnectionChange('disconnected');
        setConnection(null);
        connectionRef.current = null;
      });

      conn.on('error', (err) => {
        clearTimeout(connectionTimeout);
        console.error('Connection error:', err);
        console.error('Error details:', {
          type: err.type,
          message: err.message,
          targetPeer: targetPeerId,
          myPeerId: peer.id
        });
        
        let errorMessage = '';
        
        // Provide specific error handling with user-friendly messages
        if (err.type === 'peer-unavailable') {
          console.error('Room does not exist or host is offline');
          if (currentRetryCount < 3) {
            console.log('Attempting to retry connection...');
            retryConnection(roomNumber, currentRetryCount);
            return; // Don't set error state immediately, let retry handle it
          } else {
            errorMessage = `Room ${roomNumber} does not exist or the host is offline. Please check the room number or ask the host to create the room again.`;
          }
        } else if (err.type === 'network') {
          console.error('Network connectivity issue');
          if (currentRetryCount < 3) {
            console.log('Network issue detected, attempting to retry...');
            retryConnection(roomNumber, currentRetryCount);
            return;
          } else {
            errorMessage = 'Network connectivity issue. Please check your internet connection and try again.';
          }
        } else if (err.type === 'disconnected') {
          errorMessage = 'Connection to the signaling server was lost. Please refresh the page and try again.';
          console.error('Disconnected from signaling server');
        } else if (err.type === 'server-error') {
          errorMessage = 'Server error occurred. Please try again in a few moments.';
          console.error('Server error');
        } else {
          errorMessage = `Connection failed: ${err.type} - ${err.message}`;
        }
        
        setLastError(errorMessage);
        setConnectionStatus('error');
        onConnectionChange('error');
      });
      
    } catch (error) {
      clearTimeout(connectionTimeout);
      console.error('Exception during connection attempt:', error);
      setLastError(`Connection exception: ${error}`);
      setConnectionStatus('error');
      onConnectionChange('error');
      return false;
    }

    return true;
  }, [peer, onMessage, onConnectionChange, retryConnection]);

  // Create a room (become host)
  const createRoom = useCallback(() => {
    // Generate a new 6-digit room number
    const roomNumber = generateRoomNumber();
    setDisplayRoomId(roomNumber);
    
    // Destroy existing peer if any
    if (peer) {
      peer.destroy();
    }
    
    // Create new peer with room number as ID
    const newPeer = initializePeer(roomNumber);
    
    // Wait for peer to be ready
    newPeer.on('open', (id) => {
      console.log('Room created with ID:', id, 'Room number:', roomNumber);
      console.log('Peer is ready to accept connections');
      setPeerId(id);
      setRoomId(id);
      setIsHost(true);
      setPlayerRole('black'); // Host is always black (goes first)
      setConnectionStatus('disconnected'); // Waiting for guest
      onConnectionChange('disconnected');
    });

    newPeer.on('connection', (conn) => {
      console.log('Guest attempting to connect:', conn.peer);
      acceptConnection(conn);
    });

    newPeer.on('error', (err) => {
      console.error('Room creation error:', err);
      console.error('Error details:', {
        type: err.type,
        message: err.message,
        roomNumber: roomNumber
      });
      
      // If room ID is taken, try a new one
      if (err.type === 'unavailable-id') {
        console.log('Room ID taken, generating new room...');
        setTimeout(() => {
          createRoom(); // Retry with new room number
        }, 1000);
        return;
      }
      
      setConnectionStatus('error');
      onConnectionChange('error');
    });
    
    setPeer(newPeer);
    return roomNumber; // Return the 6-digit room number
  }, [peer, generateRoomNumber, initializePeer, onConnectionChange, acceptConnection]);

  // Send message to opponent
  const sendMessage = useCallback((message: GameMessage) => {
    if (connectionRef.current && connectionRef.current.open) {
      console.log('Sending message:', message);
      connectionRef.current.send(message);
      return true;
    } else {
      console.warn('No active connection to send message');
      return false;
    }
  }, []);

  // Disconnect from current game
  const disconnect = useCallback(() => {
    // Clear any pending retry timeouts
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    if (connectionRef.current) {
      connectionRef.current.close();
    }
    if (peer) {
      peer.destroy();
    }
    setConnection(null);
    connectionRef.current = null;
    setConnectionStatus('disconnected');
    onConnectionChange('disconnected');
    setRoomId('');
    setDisplayRoomId('');
    setIsHost(false);
    setPlayerRole(null);
    setPeer(null);
    setPeerId('');
    setLastError('');
    setRetryCount(0);
    
    // Reinitialize peer for future connections
    setTimeout(() => {
      const newPeer = initializePeer();
      setPeer(newPeer);
    }, 1000);
  }, [onConnectionChange, peer, initializePeer]);

  // Initialize peer on mount
  useEffect(() => {
    const newPeer = initializePeer();
    return () => {
      // Cleanup on unmount
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (newPeer) {
        newPeer.destroy();
      }
    };
  }, [initializePeer]);

  return {
    peer,
    peerId,
    roomId: displayRoomId, // Return the 6-digit room number instead of full peer ID
    isHost,
    playerRole,
    connectionStatus,
    lastError,
    retryCount,
    isConnected: connectionStatus === 'connected',
    createRoom,
    joinRoom,
    sendMessage,
    disconnect
  };
}