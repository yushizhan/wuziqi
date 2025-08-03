// Multiplayer game types and constants

import { GameState, Move, Player } from './game';

export interface Room {
  id: string;
  host: string;
  guest?: string;
  hostReady: boolean;
  guestReady: boolean;
  gameStarted: boolean;
  createdAt: number;
}

export interface MultiplayerGameState extends GameState {
  roomId: string;
  isMultiplayer: boolean;
  playerRole: Player | null; // Which color this player is playing
  opponent?: string; // Opponent's socket ID
  isHost: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
}

export interface GameMessage {
  type: 'move' | 'restart' | 'undo' | 'chat' | 'gameState' | 'roomInfo' | 'startGame' | 'playerReady';
  data: any;
  timestamp: number;
  playerId: string;
  senderId?: string; // Added by server when forwarding messages
}

export interface MoveMessage extends GameMessage {
  type: 'move';
  data: {
    row: number;
    col: number;
    player: Player;
  };
}

export interface GameStateMessage extends GameMessage {
  type: 'gameState';
  data: {
    gameState: GameState;
  };
}

export interface RestartMessage extends GameMessage {
  type: 'restart';
  data: {};
}

export interface UndoMessage extends GameMessage {
  type: 'undo';
  data: {};
}

export interface RoomInfoMessage extends GameMessage {
  type: 'roomInfo';
  data: {
    roomNumber: string;
  };
}

export interface StartGameMessage extends GameMessage {
  type: 'startGame';
  data: {};
}

export interface PlayerReadyMessage extends GameMessage {
  type: 'playerReady';
  data: {};
}

// Socket.IO specific types
export interface SocketResponse {
  success: boolean;
  roomId?: string;
  isHost?: boolean;
  playerRole?: Player;
  error?: string;
}

export interface PlayerJoinedEvent {
  guestId: string;
  roomId: string;
}

export interface PlayerReadyUpdateEvent {
  hostReady: boolean;
  guestReady: boolean;
}