import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Trophy, Users, Zap, Target } from 'lucide-react';
import { RaceRoom, Player, CharacterState, RaceProgress } from '../types';
import { FirebaseService } from '../services/firebaseService';
import { calculateWPM, calculateAccuracy } from '../ utils/textGenerator';

interface MultiplayerRaceProps {
  room: RaceRoom;
  currentPlayerId: string;
  onRaceComplete: () => void;
}

const MultiplayerRace: React.FC<MultiplayerRaceProps> = ({ 
  room, 
  currentPlayerId, 
  onRaceComplete 
}) => {
  const [userInput, setUserInput] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const currentPlayer = room.players[currentPlayerId];
  const players = Object.values(room.players).sort((a, b) => b.progress - a.progress);
  const finishedPlayers = players.filter(p => p.isFinished);

  // Timer effect
  useEffect(() => {
    if (startTime && !isFinished) {
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setTimeElapsed(elapsed);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [startTime, isFinished]);

  // Update progress to Firebase
  const updateProgress = useCallback(async (input: string, finished: boolean = false) => {
    const correctChars = input.split('').reduce((acc, char, index) => {
      return acc + (char === room.text[index] ? 1 : 0);
    }, 0);

    const incorrectChars = input.length - correctChars;
    const wpm = calculateWPM(correctChars, timeElapsed);
    const accuracy = calculateAccuracy(correctChars, incorrectChars);

    const progress: RaceProgress = {
      playerId: currentPlayerId,
      progress: correctChars,
      wpm,
      accuracy,
      isFinished: finished,
      timestamp: Date.now()
    };

    // Throttle updates to avoid too many Firebase calls
    const now = Date.now();
    if (now - lastUpdateRef.current > 500 || finished) { // Update every 500ms or when finished
      lastUpdateRef.current = now;
      try {
        await FirebaseService.updateProgress(room.id, currentPlayerId, progress);
      } catch (error) {
        console.error('Failed to update progress:', error);
      }
    }
  }, [room.id, room.text, currentPlayerId, timeElapsed]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Prevent input beyond text length
    if (value.length > room.text.length) return;

    // Start timer on first keystroke
    if (!startTime && value.length > 0) {
      setStartTime(Date.now());
    }

    setUserInput(value);
    setCurrentIndex(value.length);

    // Check if race is complete
    if (value.length === room.text.length && !isFinished) {
      setIsFinished(true);
      updateProgress(value, true);
      setTimeout(() => onRaceComplete(), 2000);
    } else {
      updateProgress(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent common shortcuts that could interfere
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'v' || e.key === 'a' || e.key === 'c') {
        e.preventDefault();
      }
    }
  };

  const getCharacterStates = (): CharacterState[] => {
    return room.text.split('').map((char, index) => {
      if (index < userInput.length) {
        return {
          char,
          status: userInput[index] === char ? 'correct' : 'incorrect',
        };
      } else if (index === currentIndex) {
        return {
          char,
          status: 'current',
        };
      } else {
        return {
          char,
          status: 'untyped',
        };
      }
    });
  };

  const getProgressPercentage = (player: Player): number => {
    return Math.round((player.progress / room.text.length) * 100);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Auto-focus input
  useEffect(() => {
    if (inputRef.current && !isFinished) {
      inputRef.current.focus();
    }
  }, [isFinished]);

  // Set start time when race actually begins
  useEffect(() => {
    console.log('Race effect - Room status:', room.status, 'Started at:', room.startedAt, 'Current start time:', startTime);
    
    if (room.status === 'racing' && room.startedAt && !startTime) {
      console.log('Setting start time:', room.startedAt);
      setStartTime(room.startedAt);
    }
  }, [room.status, room.startedAt, startTime]);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Race Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Race in Progress</h1>
        <div className="flex items-center justify-center gap-6 text-gray-400">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>{players.length} racers</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            <span>{finishedPlayers.length} finished</span>
          </div>
          <div className="text-white font-mono">
            {formatTime(timeElapsed)}
          </div>
        </div>
      </div>

      {/* Live Leaderboard */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-6">
        <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          Live Rankings
        </h2>
        <div className="space-y-2">
          {players.map((player, index) => (
            <div
              key={player.id}
              className={`flex items-center gap-3 p-3 rounded-lg ${
                player.id === currentPlayerId
                  ? 'bg-blue-900/30 border border-blue-600/50'
                  : 'bg-gray-800/50'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                index === 0 ? 'bg-yellow-500 text-black' :
                index === 1 ? 'bg-gray-400 text-black' :
                index === 2 ? 'bg-orange-500 text-black' :
                'bg-gray-600 text-white'
              }`}>
                {index + 1}
              </div>
              
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {player.name ? player.name.charAt(0).toUpperCase() : '?'}
              </div>
              
              <div className="flex-grow">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{player.name || 'Unknown Player'}</span>
                  {player.id === currentPlayerId && (
                    <span className="text-blue-400 text-sm">(You)</span>
                  )}
                  {player.isFinished && (
                    <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">
                      FINISHED
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex-grow bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        player.isFinished ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${getProgressPercentage(player)}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-blue-400 flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {player.wpm} WPM
                    </span>
                    <span className="text-green-400 flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {player.accuracy}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Text Display */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6 min-h-[200px]">
        <div className="text-lg leading-relaxed font-mono">
          {getCharacterStates().map((charState, index) => (
            <span
              key={index}
              className={`${
                charState.status === 'correct'
                  ? 'text-gray-400 bg-green-900/30'
                  : charState.status === 'incorrect'
                  ? 'text-white bg-red-600/60'
                  : charState.status === 'current'
                  ? 'text-white bg-blue-600 animate-pulse'
                  : 'text-gray-500'
              } ${charState.status === 'current' ? 'border-l-2 border-blue-400' : ''}`}
            >
              {charState.char}
            </span>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isFinished ? 'bg-green-500' : 'bg-blue-500 animate-pulse'}`} />
            <span className="text-white font-semibold">
              {isFinished ? 'Race completed!' : 'Keep typing...'}
            </span>
          </div>
          <div className="text-gray-400">
            Progress: {Math.round((userInput.length / room.text.length) * 100)}%
          </div>
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={userInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          placeholder="Type the text above here..."
          disabled={isFinished}
          autoComplete="off"
          spellCheck="false"
        />
      </div>
    </div>
  );
};

export default MultiplayerRace;