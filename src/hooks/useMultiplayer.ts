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
  const [isHost, setIsHost] = useState<boolean>(false);
  const [playerRole, setPlayerRole] = useState<Player | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');

  const connectionRef = useRef<DataConnection | null>(null);

  // Initialize PeerJS
  const initializePeer = useCallback(() => {
    const newPeer = new Peer({
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });

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
    });

    conn.on('data', (data) => {
      console.log('Received data:', data);
      onMessage(data as GameMessage);
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
  }, [onMessage, onConnectionChange]);

  // Connect to a room (join as guest)
  const joinRoom = useCallback((targetRoomId: string) => {
    if (!peer) {
      console.error('Peer not initialized');
      return false;
    }

    setRoomId(targetRoomId);
    setConnectionStatus('connecting');
    onConnectionChange('connecting');

    const conn = peer.connect(targetRoomId);
    
    conn.on('open', () => {
      console.log('Connected to room:', targetRoomId);
      setConnection(conn);
      connectionRef.current = conn;
      setConnectionStatus('connected');
      onConnectionChange('connected');
      setIsHost(false);
      setPlayerRole('white');
    });

    conn.on('data', (data) => {
      console.log('Received data:', data);
      onMessage(data as GameMessage);
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
    if (!peerId) {
      console.error('Peer ID not available');
      return null;
    }

    setRoomId(peerId);
    setIsHost(true);
    setPlayerRole('black'); // Host is always black (goes first)
    setConnectionStatus('disconnected'); // Waiting for guest
    return peerId;
  }, [peerId]);

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
    setConnection(null);
    connectionRef.current = null;
    setConnectionStatus('disconnected');
    onConnectionChange('disconnected');
    setRoomId('');
    setIsHost(false);
    setPlayerRole(null);
  }, [onConnectionChange]);

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
    roomId,
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