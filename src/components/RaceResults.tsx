import React from "react";
import {
  Trophy,
  Medal,
  Award,
  Clock,
  Zap,
  Target,
  RotateCcw,
  Home,
} from "lucide-react";
import { RaceRoom, Player } from "../types";
import { FirebaseService } from "../services/firebaseService";

interface RaceResultsProps {
  room: RaceRoom;
  currentPlayerId: string;
  onNewRace: () => void;
  onBackToMenu: () => void;
}

const RaceResults: React.FC<RaceResultsProps> = ({
  room,
  currentPlayerId,
  onNewRace,
  onBackToMenu,
}) => {
  const players = Object.values(room.players)
    .filter((p) => p.isFinished)
    .sort((a, b) => {
      if (a.finishTime && b.finishTime) {
        return a.finishTime - b.finishTime;
      }
      return b.wpm - a.wpm;
    });

  const isCreator = room.creatorId === currentPlayerId;
  const allMembersReady = Object.values(room.players)
    .filter((p) => p.id !== room.creatorId)
    .every((p) => p.isReady);

  const handleGetReady = async () => {
    await FirebaseService.setPlayerReady(room.id, currentPlayerId, true);
  };

  const handleStartNewRace = async () => {
    // Only creator can start, and only when all other players are ready
    if (!isCreator || !allMembersReady) return;
    
    const selectedText = room.selectedText || room.text;
    await FirebaseService.restartRace(room.id, selectedText);
    // Don't call onNewRace() here - let the Firebase listener handle the transition
  };

  const currentPlayer = room.players[currentPlayerId];
  const currentPlayerRank =
    players.findIndex((p) => p.id === currentPlayerId) + 1;

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-6 h-6 text-yellow-400" />;
      case 1:
        return <Medal className="w-6 h-6 text-gray-300" />;
      case 2:
        return <Award className="w-6 h-6 text-orange-400" />;
      default:
        return (
          <div className="w-6 h-6 flex items-center justify-center text-gray-400 font-bold text-lg">
            {index + 1}
          </div>
        );
    }
  };

  const getRankColor = (index: number) => {
    switch (index) {
      case 0:
        return "bg-yellow-500/10 border-yellow-500/30";
      case 1:
        return "bg-gray-500/10 border-gray-500/30";
      case 2:
        return "bg-orange-500/10 border-orange-500/30";
      default:
        return "bg-gray-800/50 border-gray-700";
    }
  };

  const formatTime = (timestamp?: number): string => {
    if (!timestamp || !room.startedAt) return "--:--";
    const seconds = Math.floor((timestamp - room.startedAt) / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getPerformanceMessage = (
    rank: number,
    totalPlayers: number
  ): string => {
    const percentage = (rank / totalPlayers) * 100;
    if (rank === 1) return "🏆 Champion! Outstanding performance!";
    if (percentage <= 25) return "🥇 Excellent! Top 25% finish!";
    if (percentage <= 50) return "🥈 Great job! Above average performance!";
    if (percentage <= 75) return "🥉 Good effort! Room for improvement!";
    return "💪 Keep practicing! You'll get better!";
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Race Complete!</h1>
        <p className="text-gray-400">Final results and rankings</p>
      </div>

      {/* Current Player Summary */}
      {currentPlayer && currentPlayerRank > 0 && (
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6">
          <div className="text-center mb-4">
            <div className="flex justify-center mb-3">
              {getRankIcon(currentPlayerRank - 1)}
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {currentPlayerRank === 1
                ? "Victory!"
                : `${currentPlayerRank}${
                    currentPlayerRank === 2
                      ? "nd"
                      : currentPlayerRank === 3
                      ? "rd"
                      : "th"
                  } Place`}
            </h2>
            <p className="text-gray-400">
              {getPerformanceMessage(currentPlayerRank, players.length)}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400 mb-1">
                {currentPlayer.wpm}
              </div>
              <div className="text-gray-400 text-sm">Words/Min</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">
                {currentPlayer.accuracy}%
              </div>
              <div className="text-gray-400 text-sm">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400 mb-1">
                {formatTime(currentPlayer.finishTime)}
              </div>
              <div className="text-gray-400 text-sm">Finish Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400 mb-1">
                #{currentPlayerRank}
              </div>
              <div className="text-gray-400 text-sm">Final Rank</div>
            </div>
          </div>
        </div>
      )}

      {/* Ready Status Panel */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Ready for Next Race</h2>
        <div className="space-y-2">
          {Object.values(room.players).map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {player.name ? player.name.charAt(0).toUpperCase() : "?"}
                </div>
                <span className="text-white">{player.name}</span>
                {player.id === room.creatorId && (
                  <span className="text-yellow-400 text-sm">(Host)</span>
                )}
              </div>
              <div>
                {player.id === room.creatorId ? (
                  <span className="text-blue-400 text-sm">Waiting to start...</span>
                ) : player.isReady ? (
                  <span className="text-green-400 text-sm">✓ Ready</span>
                ) : (
                  <span className="text-gray-400 text-sm">Not ready</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-center gap-4 mb-6">
        {isCreator ? (
          <button
            onClick={handleStartNewRace}
            disabled={!allMembersReady}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
              allMembersReady
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-gray-600 text-gray-400 cursor-not-allowed"
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            {allMembersReady ? "Start New Race" : "Waiting for players..."}
          </button>
        ) : (
          <button
            onClick={handleGetReady}
            disabled={currentPlayer?.isReady}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
              currentPlayer?.isReady
                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            {currentPlayer?.isReady ? "Ready! Waiting for host..." : "I'm Ready!"}
          </button>
        )}
      </div>

      {/* Final Leaderboard */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          Final Rankings
        </h2>

        <div className="space-y-3">
          {players.map((player, index) => (
            <div
              key={player.id}
              className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${getRankColor(
                index
              )} ${
                player.id === currentPlayerId ? "ring-2 ring-blue-500/50" : ""
              }`}
            >
              <div className="flex-shrink-0">{getRankIcon(index)}</div>

              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                {player.name ? player.name.charAt(0).toUpperCase() : "?"}
              </div>

              <div className="flex-grow">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-semibold">
                    {player.name || "Unknown Player"}
                  </span>
                  {player.id === currentPlayerId && (
                    <span className="text-blue-400 text-sm">(You)</span>
                  )}
                  {index === 0 && (
                    <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded font-bold">
                      WINNER
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <span className="text-blue-400 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {player.wpm} WPM
                  </span>
                  <span className="text-green-400 flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    {player.accuracy}%
                  </span>
                  <span className="text-purple-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(player.finishTime)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Race Statistics */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Race Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-400 mb-1">
              {players.length}
            </div>
            <div className="text-gray-400 text-sm">Total Racers</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400 mb-1">
              {Math.round(
                players.reduce((sum, p) => sum + p.wpm, 0) / players.length
              )}
            </div>
            <div className="text-gray-400 text-sm">Avg WPM</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-400 mb-1">
              {Math.round(
                players.reduce((sum, p) => sum + p.accuracy, 0) / players.length
              )}
              %
            </div>
            <div className="text-gray-400 text-sm">Avg Accuracy</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-400 mb-1">
              {room.text.length}
            </div>
            <div className="text-gray-400 text-sm">Characters</div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex justify-center gap-4">
        <button
          onClick={onBackToMenu}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          <Home className="w-4 h-4" />
          Leave Room
        </button>
      </div>
    </div>
  );
};

export default RaceResults;