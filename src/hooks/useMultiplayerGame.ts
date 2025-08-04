// Enhanced game hook with multiplayer support

'use client';

import { useState, useCallback, useEffect } from 'react';
import { GameState, Player, Move, Position } from '@/types/game';
import { GameMessage, MoveMessage, RestartMessage, UndoMessage, StartGameMessage, PlayerReadyMessage } from '@/types/multiplayer';
import {
  createEmptyBoard,
  placePiece,
  checkWin,
  isBoardFull,
  getNextPlayer,
  isCellEmpty,
  getWinningPositions
} from '@/lib/gameLogic';

interface UseMultiplayerGameProps {
  isMultiplayer: boolean;
  playerRole: Player | null;
  isHost: boolean;
  onSendMessage?: (message: GameMessage) => boolean;
  onGameStart?: () => void;
}

export function useMultiplayerGame({ 
  isMultiplayer, 
  playerRole, 
  isHost,
  onSendMessage,
  onGameStart
}: UseMultiplayerGameProps) {
  const [gameState, setGameState] = useState<GameState>(() => ({
    board: createEmptyBoard(),
    currentPlayer: 'black' as Player,
    winner: null,
    gameOver: false,
    moveHistory: [],
  }));

  const [winningPositions, setWinningPositions] = useState<Position[]>([]);
  const [isMyTurn, setIsMyTurn] = useState<boolean>(false);

  // Update turn status when game state or player role changes
  useEffect(() => {
    if (isMultiplayer && playerRole) {
      setIsMyTurn(gameState.currentPlayer === playerRole && !gameState.gameOver);
    } else {
      setIsMyTurn(true); // Single player mode - always player's turn
    }
  }, [gameState.currentPlayer, playerRole, isMultiplayer, gameState.gameOver]);

  // Handle incoming messages from opponent
  const handleOpponentMessage = useCallback((message: GameMessage) => {
    console.log('Handling opponent message:', message);

    switch (message.type) {
      case 'move':
        const moveMsg = message as MoveMessage;
        const { row, col, player } = moveMsg.data;
        
        setGameState(prev => {
          // Validate move using previous state
          if (!isCellEmpty(prev.board, row, col)) {
            console.warn('Invalid move received - cell not empty');
            return prev; // Return unchanged state
          }

          const newBoard = placePiece(prev.board, row, col, player);
          const move: Move = { row, col, player };
          const isWin = checkWin(newBoard, row, col);
          const isDraw = !isWin && isBoardFull(newBoard);
          
          let winPositions: Position[] = [];
          if (isWin) {
            winPositions = getWinningPositions(newBoard, player);
            setWinningPositions(winPositions);
          } else {
            setWinningPositions([]);
          }

          return {
            ...prev,
            board: newBoard,
            currentPlayer: isWin || isDraw ? prev.currentPlayer : getNextPlayer(prev.currentPlayer),
            winner: isWin ? player : null,
            gameOver: isWin || isDraw,
            moveHistory: [...prev.moveHistory, move],
          };
        });
        break;

      case 'restart':
        setGameState({
          board: createEmptyBoard(),
          currentPlayer: 'black',
          winner: null,
          gameOver: false,
          moveHistory: [],
        });
        setWinningPositions([]);
        break;

      case 'undo':
        setGameState(prev => {
          if (prev.moveHistory.length >= 2) { // Undo last 2 moves (both players)
            const newHistory = [...prev.moveHistory];
            newHistory.pop(); // Remove last move
            newHistory.pop(); // Remove second to last move
            
            const newBoard = createEmptyBoard();
            newHistory.forEach(move => {
              newBoard[move.row][move.col] = move.player;
            });

            setWinningPositions([]);
            
            return {
              board: newBoard,
              currentPlayer: newHistory.length % 2 === 0 ? 'black' : 'white',
              winner: null,
              gameOver: false,
              moveHistory: newHistory,
            };
          }
          return prev; // Return unchanged state if can't undo
        });
        break;

      case 'startGame':
        // Handle game start message
        console.log('Game started by opponent');
        if (onGameStart) {
          onGameStart();
        }
        break;

      case 'playerReady':
        // Handle player ready message
        console.log('Opponent is ready');
        break;
    }
  }, [onGameStart]); // Remove gameState dependencies

  // Make a move on the board
  const makeMove = useCallback((row: number, col: number): boolean => {
    // In multiplayer mode, check if it's player's turn
    if (isMultiplayer && !isMyTurn) {
      console.warn('Not your turn');
      return false;
    }

    let moveSuccess = false;

    setGameState(prev => {
      if (prev.gameOver || !isCellEmpty(prev.board, row, col)) {
        return prev; // Return unchanged state
      }

      const currentPlayerToMove = isMultiplayer ? playerRole : prev.currentPlayer;
      if (!currentPlayerToMove) return prev;

      const newBoard = placePiece(prev.board, row, col, currentPlayerToMove);
      const move: Move = {
        row,
        col,
        player: currentPlayerToMove,
      };

      const isWin = checkWin(newBoard, row, col);
      const isDraw = !isWin && isBoardFull(newBoard);
      
      let winPositions: Position[] = [];
      if (isWin) {
        winPositions = getWinningPositions(newBoard, currentPlayerToMove);
      }

      setWinningPositions(winPositions);

      // Send move to opponent in multiplayer mode
      if (isMultiplayer && onSendMessage) {
        const moveMessage: MoveMessage = {
          type: 'move',
          data: { row, col, player: currentPlayerToMove },
          timestamp: Date.now(),
          playerId: 'self'
        };
        onSendMessage(moveMessage);
      }

      moveSuccess = true;

      return {
        ...prev,
        board: newBoard,
        currentPlayer: isWin || isDraw ? prev.currentPlayer : getNextPlayer(prev.currentPlayer),
        winner: isWin ? currentPlayerToMove : null,
        gameOver: isWin || isDraw,
        moveHistory: [...prev.moveHistory, move],
      };
    });

    return moveSuccess;
  }, [isMultiplayer, isMyTurn, playerRole, onSendMessage]); // Remove gameState dependency

  // Restart the game
  const restartGame = useCallback(() => {
    const newGameState = {
      board: createEmptyBoard(),
      currentPlayer: 'black' as Player,
      winner: null,
      gameOver: false,
      moveHistory: [],
    };

    setGameState(newGameState);
    setWinningPositions([]);

    // Send restart message in multiplayer mode
    if (isMultiplayer && onSendMessage) {
      const restartMessage: RestartMessage = {
        type: 'restart',
        data: {},
        timestamp: Date.now(),
        playerId: 'self'
      };
      onSendMessage(restartMessage);
    }
  }, [isMultiplayer, onSendMessage]);

  // Undo the last move (in multiplayer, undo last 2 moves)
  const undoMove = useCallback(() => {
    let undoSuccess = false;

    setGameState(prev => {
      if (isMultiplayer) {
        // In multiplayer, only host can initiate undo and it undoes 2 moves
        if (!isHost || prev.moveHistory.length < 2) return prev;

        const newHistory = [...prev.moveHistory];
        newHistory.pop(); // Remove last move
        newHistory.pop(); // Remove second to last move
        
        const newBoard = createEmptyBoard();
        newHistory.forEach(move => {
          newBoard[move.row][move.col] = move.player;
        });

        setWinningPositions([]);

        // Send undo message to opponent
        if (onSendMessage) {
          const undoMessage: UndoMessage = {
            type: 'undo',
            data: {},
            timestamp: Date.now(),
            playerId: 'self'
          };
          onSendMessage(undoMessage);
        }

        undoSuccess = true;

        return {
          board: newBoard,
          currentPlayer: newHistory.length % 2 === 0 ? 'black' : 'white',
          winner: null,
          gameOver: false,
          moveHistory: newHistory,
        };
      } else {
        // Single player mode - undo single move
        if (prev.moveHistory.length === 0) return prev;

        const newHistory = [...prev.moveHistory];
        newHistory.pop();
        
        const newBoard = createEmptyBoard();
        newHistory.forEach(move => {
          newBoard[move.row][move.col] = move.player;
        });

        setWinningPositions([]);
        undoSuccess = true;

        return {
          board: newBoard,
          currentPlayer: newHistory.length % 2 === 0 ? 'black' : 'white',
          winner: null,
          gameOver: false,
          moveHistory: newHistory,
        };
      }
    });

    return undoSuccess;
  }, [isMultiplayer, isHost, onSendMessage]); // Remove gameState dependency

  // Check if a position is a winning position
  const isWinningPosition = useCallback((row: number, col: number): boolean => {
    return winningPositions.some(pos => pos.row === row && pos.col === col);
  }, [winningPositions]);

  return {
    gameState,
    winningPositions,
    isMyTurn,
    makeMove,
    restartGame,
    undoMove,
    isWinningPosition,
    handleOpponentMessage,
  };
}