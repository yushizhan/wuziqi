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

  const connectionRef = useRef<DataConnection | null>(null);
  const roomMappingRef = useRef<Map<string, string>>(new Map()); // Map 6-digit ID to actual peer ID
  
  // Generate 6-digit room number
  const generateRoomNumber = useCallback((): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }, []);

  // Initialize PeerJS with custom ID for room creation
  const initializePeer = useCallback((customId?: string) => {
    const peerOptions: any = {
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
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
    });

    newPeer.on('connection', (conn) => {
      console.log('Incoming connection from:', conn.peer);
      acceptConnection(conn);
    });

    newPeer.on('error', (err) => {
      console.error('Peer error:', err);
      setConnectionStatus('error');
      onConnectionChange('error');
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
      setIsHost(false); // Guest
      setPlayerRole('white'); // Host is black, guest is white
      
      // Send room info to guest
      const roomNumber = displayRoomId || generateRoomNumber();
      if (!displayRoomId) {
        setDisplayRoomId(roomNumber);
      }
    });

    conn.on('data', (data) => {
      console.log('Received data:', data);
      const message = data as GameMessage;
      
      // Handle room info message
      if (message.type === 'roomInfo') {
        setDisplayRoomId(message.data.roomNumber);
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
      setConnectionStatus('error');
      onConnectionChange('error');
    });
  }, [onMessage, onConnectionChange, displayRoomId, generateRoomNumber]);

  // Connect to a room (join as guest)
  const joinRoom = useCallback((roomNumber: string) => {
    if (!peer) {
      console.error('Peer not initialized');
      return false;
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
    setConnectionStatus('connecting');
    onConnectionChange('connecting');

    const conn = peer.connect(targetPeerId);
    
    conn.on('open', () => {
      console.log('Connected to room:', roomNumber);
      setConnection(conn);
      connectionRef.current = conn;
      setConnectionStatus('connected');
      onConnectionChange('connected');
      setIsHost(false);
      setPlayerRole('white');
      
      // Send room info confirmation
      const roomInfoMessage: GameMessage = {
        type: 'roomInfo',
        data: { roomNumber },
        timestamp: Date.now(),
        playerId: 'guest'
      };
      conn.send(roomInfoMessage);
    });

    conn.on('data', (data) => {
      console.log('Received data:', data);
      const message = data as GameMessage;
      
      // Handle room info message
      if (message.type === 'roomInfo') {
        setDisplayRoomId(message.data.roomNumber);
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
      setConnectionStatus('error');
      onConnectionChange('error');
    });

    return true;
  }, [peer, onMessage, onConnectionChange]);

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
      setPeerId(id);
      setRoomId(id);
      setIsHost(true);
      setPlayerRole('black'); // Host is always black (goes first)
      setConnectionStatus('disconnected'); // Waiting for guest
    });
    
    newPeer.on('connection', (conn) => {
      console.log('Guest joining room:', roomNumber);
      acceptConnection(conn);
      
      // Send room info to guest
      conn.on('open', () => {
        const roomInfoMessage: GameMessage = {
          type: 'roomInfo',
          data: { roomNumber },
          timestamp: Date.now(),
          playerId: 'host'
        };
        conn.send(roomInfoMessage);
      });
    });

    newPeer.on('error', (err) => {
      console.error('Room creation error:', err);
      setConnectionStatus('error');
      onConnectionChange('error');
    });
    
    setPeer(newPeer);
    return roomNumber; // Return the 6-digit room number
  }, [peer, generateRoomNumber, initializePeer, acceptConnection, onConnectionChange]);

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
    isConnected: connectionStatus === 'connected',
    createRoom,
    joinRoom,
    sendMessage,
    disconnect
  };
}