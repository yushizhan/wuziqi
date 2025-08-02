// Multiplayer game types and constants

import { GameState, Move, Player } from './game';

export interface Room {
  id: string;
  players: Player[];
  host: string;
  guest?: string;
  status: 'waiting' | 'playing' | 'finished';
}

export interface MultiplayerGameState extends GameState {
  roomId: string;
  isMultiplayer: boolean;
  playerRole: Player | null; // Which color this player is playing
  opponent?: string; // Opponent's peer ID
  isHost: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
}

export interface GameMessage {
  type: 'move' | 'restart' | 'undo' | 'chat' | 'gameState';
  data: any;
  timestamp: number;
  playerId: string;
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