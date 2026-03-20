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
  Users,
} from "lucide-react";
import { RaceRoom } from "../types";
import { FirebaseService } from "../services/firebaseService";
import { generateText } from "../utils/textGenerator";
import { Copy } from "lucide-react";
import { useState } from "react";

interface RaceResultsProps {
  room: RaceRoom;
  currentPlayerId: string;
  onNewRace: () => void;
  onBackToMenu: () => void;
}

const RaceResults: React.FC<RaceResultsProps> = ({
  room,
  currentPlayerId,
  onBackToMenu,
}) => {
  const [linkCopied, setLinkCopied] = useState(false);

  const copyInviteLink = async () => {
    try {
      const inviteLink = `${window.location.origin}${window.location.pathname}?room=${room.id}`;
      await navigator.clipboard.writeText(inviteLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy invite link:", err);
    }
  };

  const players = Object.values(room.players)
    .filter((p) => p.isFinished)
    .sort((a, b) => {
      if (a.finishTime && b.finishTime) {
        return a.finishTime - b.finishTime;
      }
      return b.wpm - a.wpm;
    });

  const allPlayers = Object.values(room.players).sort((a, b) => {
    // Sort by finished first, then by progress
    if (a.isFinished && !b.isFinished) return -1;
    if (!a.isFinished && b.isFinished) return 1;
    return b.progress - a.progress;
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

    // Generate a new text for the new race
    const newText = generateText(
      (room.difficulty || 'easy') as 'easy' | 'medium' | 'hard',
      (room.focus || 'general') as 'speed' | 'accuracy' | 'programming' | 'general'
    );
    await FirebaseService.restartRace(room.id, newText);
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
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          Race Complete!
        </h1>
        <p className="text-gray-400">Final results and rankings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Summary & Rankings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Player Summary */}
          {currentPlayer && (
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                {getRankIcon(currentPlayerRank - 1)}
              </div>
              
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-700 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg ring-4 ring-blue-500/20">
                    {currentPlayerRank > 0 ? `#${currentPlayerRank}` : "?"}
                  </div>
                </div>
                
                <div className="flex-grow text-center md:text-left">
                  <h2 className="text-2xl font-bold text-white mb-1">
                    {currentPlayerRank === 1 ? "Victory!" : "Great Effort!"}
                  </h2>
                  <p className="text-gray-400 mb-4 max-w-md">
                    {currentPlayerRank > 0 
                      ? getPerformanceMessage(currentPlayerRank, players.length)
                      : "Waiting for other players to finish..."}
                  </p>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/50">
                      <div className="text-xl font-bold text-blue-400">{currentPlayer.wpm}</div>
                      <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">WPM</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/50">
                      <div className="text-xl font-bold text-green-400">{currentPlayer.accuracy}%</div>
                      <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">ACC</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/50">
                      <div className="text-xl font-bold text-purple-400">{formatTime(currentPlayer.finishTime)}</div>
                      <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">TIME</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Final Leaderboard */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Final Rankings
              </h2>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                {players.length} Players Finished
              </span>
            </div>

            <div className="max-h-[500px] overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {players.length > 0 ? (
                players.map((player, index) => (
                  <div
                    key={player.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${getRankColor(
                      index
                    )} ${
                      player.id === currentPlayerId 
                        ? "ring-2 ring-blue-500 shadow-lg shadow-blue-500/10 scale-[1.02]" 
                        : "hover:border-gray-600"
                    }`}
                  >
                    <div className="flex-shrink-0">{getRankIcon(index)}</div>

                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                      {player.name ? player.name.charAt(0).toUpperCase() : "?"}
                    </div>

                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-bold">
                          {player.name || "Unknown Player"}
                        </span>
                        {player.id === currentPlayerId && (
                          <span className="bg-blue-500/20 text-blue-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                            YOU
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-blue-400 font-semibold flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {player.wpm} WPM
                        </span>
                        <span className="text-green-400 font-semibold flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {player.accuracy}%
                        </span>
                        <span className="text-purple-400 font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(player.finishTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500 italic">
                  Waiting for players to finish...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Status & Statistics */}
        <div className="space-y-6">
          {/* Action Button Section */}
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">Game Control</h2>
            <div className="space-y-4">
              {isCreator ? (
                <button
                  onClick={handleStartNewRace}
                  disabled={!allMembersReady}
                  className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-bold transition-all transform active:scale-95 ${
                    allMembersReady
                      ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-900/20"
                      : "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700"
                  }`}
                >
                  <RotateCcw className={`w-5 h-5 ${allMembersReady ? "animate-spin-slow" : ""}`} />
                  {allMembersReady ? "START NEXT RACE" : "WAITING FOR PLAYERS"}
                </button>
              ) : (
                <button
                  onClick={handleGetReady}
                  disabled={currentPlayer?.isReady}
                  className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-bold transition-all transform active:scale-95 ${
                    currentPlayer?.isReady
                      ? "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-900/20"
                  }`}
                >
                  <RotateCcw className="w-5 h-5" />
                  {currentPlayer?.isReady ? "READY FOR NEXT" : "I'M READY!"}
                </button>
              )}
              
              <button
                onClick={onBackToMenu}
                className="w-full flex items-center justify-center gap-3 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white px-6 py-3 rounded-xl font-bold border border-red-900/30 transition-all group"
              >
                <Home className="w-4 h-4 group-hover:scale-110 transition-transform" />
                LEAVE ROOM
              </button>
            </div>
          </div>

          {/* Ready Status Panel */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-800 bg-gray-900/50">
              <h2 className="text-md font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                Player Status
              </h2>
            </div>
            <div className="max-h-[300px] overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {allPlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 bg-gray-800/30 rounded-xl border border-gray-700/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-gray-700 rounded-full flex items-center justify-center text-white font-bold text-xs">
                      {player.name ? player.name.charAt(0).toUpperCase() : "?"}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-white font-medium truncate max-w-[100px]">{player.name}</span>
                      {player.id === room.creatorId && (
                        <span className="text-[9px] text-yellow-500 font-bold uppercase tracking-tighter">Host</span>
                      )}
                    </div>
                  </div>
                  <div>
                    {player.id === room.creatorId ? (
                      <span className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-1 rounded-lg border border-blue-500/20">HOSTING</span>
                    ) : player.isReady ? (
                      <span className="bg-green-500/10 text-green-400 text-[10px] px-2 py-1 rounded-lg border border-green-500/20 font-bold">READY</span>
                    ) : (
                      <span className="bg-gray-800 text-gray-500 text-[10px] px-2 py-1 rounded-lg border border-gray-700 font-bold">WAITING</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Race Statistics */}
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">Room Stats</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-800/30 rounded-xl border border-gray-700/30">
                <div className="text-xl font-bold text-blue-400">{players.length || 0}</div>
                <div className="text-[10px] text-gray-500 font-bold uppercase">Finished</div>
              </div>
              <div className="text-center p-3 bg-gray-800/30 rounded-xl border border-gray-700/30">
                <div className="text-xl font-bold text-green-400">
                  {players.length > 0 
                    ? Math.round(players.reduce((sum, p) => sum + p.wpm, 0) / players.length)
                    : 0}
                </div>
                <div className="text-[10px] text-gray-500 font-bold uppercase">Avg WPM</div>
              </div>
              <div className="text-center p-3 bg-gray-800/30 rounded-xl border border-gray-700/30">
                <div className="text-xl font-bold text-purple-400">
                  {players.length > 0
                    ? Math.round(players.reduce((sum, p) => sum + p.accuracy, 0) / players.length)
                    : 0}%
                </div>
                <div className="text-[10px] text-gray-500 font-bold uppercase">Avg Acc</div>
              </div>
              <div className="text-center p-3 bg-gray-800/30 rounded-xl border border-gray-700/30">
                <div className="text-xl font-bold text-orange-400">{room.text.length}</div>
                <div className="text-[10px] text-gray-500 font-bold uppercase">Chars</div>
              </div>
            </div>

            <div className="mt-6 border-t border-gray-800 pt-6">
              <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Invite Link</label>
              <div className="flex items-center gap-2">
                <code className="bg-blue-900/10 px-3 py-2 rounded text-blue-400 font-mono text-[10px] flex-grow truncate border border-blue-900/30">
                  {window.location.origin}?room={room.id}
                </code>
                <button
                  onClick={copyInviteLink}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-all flex items-center justify-center shadow-lg shadow-blue-900/20 active:scale-90"
                  title="Copy Invite Link"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
              {linkCopied && (
                <p className="text-blue-400 text-[10px] mt-1 font-bold animate-pulse">Link copied to clipboard!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RaceResults;