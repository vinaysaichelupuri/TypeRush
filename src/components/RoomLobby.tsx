import React, { useState, useEffect } from 'react';
import { Users, Play, Copy, Crown, Clock, UserPlus } from 'lucide-react';
import { RaceRoom, Player } from '../types';
import { FirebaseService } from '../services/firebaseService';

interface RoomLobbyProps {
  room: RaceRoom;
  currentPlayerId: string;
  onStartRace: () => void;
  onLeaveRoom: () => void;
}

const RoomLobby: React.FC<RoomLobbyProps> = ({ 
  room, 
  currentPlayerId, 
  onStartRace, 
  onLeaveRoom 
}) => {
  const [copied, setCopied] = useState(false);

  const isCreator = room.creatorId === currentPlayerId;
  const players = Object.values(room.players);
  const playerCount = players.length;

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(room.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy room ID:', err);
    }
  };

const handleStartRace = async () => {
  if (!isCreator || playerCount < 2) return;

  try {
    await FirebaseService.startCountdown(room.id, currentPlayerId);
  } catch (error) {
    console.error('Failed to start countdown:', error);
  }
};


  const getPlayerStatus = (player: Player) => {
    if (player.id === room.creatorId) {
      return (
        <span title="Room Creator">
          <Crown className="w-4 h-4 text-yellow-400" />
        </span>
      );
    }
    return null;
  };

  // Calculate countdown from room data
  const getCountdown = (): number | null => {
    if (room.status === 'countdown' && room.countdownStartedAt) {
      const elapsed = Math.floor((Date.now() - room.countdownStartedAt) / 1000);
      const remaining = 3 - elapsed;
      return remaining > 0 ? remaining : null;
    }
    return null;
  };

  const [countdown, setCountdown] = useState<number | null>(null);

  // Update countdown every second
  useEffect(() => {
    let countdownInterval: NodeJS.Timeout | null = null;
    
    if (room.status === 'countdown' && room.countdownStartedAt) {
      const updateCountdown = () => {
        const elapsed = Math.floor((Date.now() - room.countdownStartedAt!) / 1000);
        const remaining = 3 - elapsed;
        
        if (remaining > 0) {
          setCountdown(remaining);
        } else {
          setCountdown(null);
          // Start the race when countdown ends
          if (isCreator) {
            FirebaseService.startRace(room.id).catch(console.error);
          }
        }
      };
      
      // Update immediately
      updateCountdown();
      
      // Then update every 100ms for smooth countdown
      countdownInterval = setInterval(updateCountdown, 100);
    } else {
      setCountdown(null);
    }
    
    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [room.status, room.countdownStartedAt, room.id, isCreator]);

  // Auto-start race when countdown ends
  useEffect(() => {
    if (room.status === 'racing') {
      console.log('Room status changed to racing, transitioning...');
      onStartRace();
    }
  }, [room.status, onStartRace]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Race Lobby</h1>
        <p className="text-gray-400">Waiting for players to join...</p>
      </div>

      {countdown && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="text-8xl font-bold text-white mb-4">{countdown}</div>
            <div className="text-xl text-gray-400">Race starting...</div>
          </div>
        </div>
      )}

      {/* Room Info */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Room Details</h2>
          <div className="flex items-center gap-2 text-gray-400">
            <Users className="w-4 h-4" />
            <span>{playerCount}/{room.maxPlayers}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Room ID</label>
            <div className="flex items-center gap-2">
              <code className="bg-gray-800 px-3 py-2 rounded text-white font-mono text-sm flex-grow break-all">
                {room.id}
              </code>
              <button
                onClick={copyRoomId}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded transition-colors"
                title="Copy Room ID"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            {copied && (
              <p className="text-green-400 text-sm mt-1">Room ID copied!</p>
            )}
          </div>
          
          <div>
            <label className="block text-gray-400 text-sm mb-1">Text Preview</label>
            <div className="bg-gray-800 px-3 py-2 rounded text-white text-sm max-h-20 overflow-hidden">
              {room.text.substring(0, 100)}...
            </div>
          </div>
        </div>
      </div>

      {/* Players List */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Players ({playerCount})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {players.map((player) => (
            <div
              key={player.id}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                player.id === currentPlayerId
                  ? 'bg-blue-900/30 border-blue-600/50'
                  : 'bg-gray-800/50 border-gray-700'
              }`}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {player.name ? player.name.charAt(0).toUpperCase() : '?'}
              </div>
              <div className="flex-grow">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{player.name || 'Unknown Player'}</span>
                  {getPlayerStatus(player)}
                  {player.id === currentPlayerId && (
                    <span className="text-blue-400 text-sm">(You)</span>
                  )}
                </div>
                <div className="text-gray-400 text-sm">
                  Joined {player.joinedAt ? new Date(player.joinedAt).toLocaleTimeString() : 'Unknown time'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {playerCount < room.maxPlayers && (
          <div className="mt-4 p-4 border-2 border-dashed border-gray-700 rounded-lg text-center">
            <UserPlus className="w-8 h-8 text-gray-500 mx-auto mb-2" />
            <p className="text-gray-400">Waiting for more players...</p>
            <p className="text-gray-500 text-sm">Share the room ID with friends</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        <button
          onClick={onLeaveRoom}
          className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          Leave Room
        </button>
        
        {isCreator && (
          <button
            onClick={handleStartRace}
            disabled={playerCount < 2 || countdown !== null}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
              playerCount >= 2 && countdown === null
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Play className="w-4 h-4" />
            {countdown ? `Starting in ${countdown}...` : 'Start Race'}
          </button>
        )}
        
        {!isCreator && (
          <div className="flex items-center gap-2 text-gray-400">
            <Clock className="w-4 h-4" />
            <span>Waiting for host to start...</span>
          </div>
        )}
      </div>

      {playerCount < 2 && isCreator && (
        <div className="mt-4 text-center">
          <p className="text-yellow-400 text-sm">
            ⚠️ Need at least 2 players to start the race
          </p>
        </div>
      )}
    </div>
  );
};

export default RoomLobby;