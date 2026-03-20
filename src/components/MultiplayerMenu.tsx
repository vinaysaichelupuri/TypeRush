import React, { useState } from 'react';
import { Users, Plus, LogIn, ArrowLeft } from 'lucide-react';

interface MultiplayerMenuProps {
  onCreateRoom: (playerName: string, difficulty: 'easy'|'medium'|'hard', focus: 'random'|'speed'|'accuracy'|'programming') => void;
  onJoinRoom: (roomId: string, playerName: string) => void;
  onBackToSinglePlayer: () => void;
  isLoading?: boolean;
  error?: string;
  initialRoomId?: string;
}

const MultiplayerMenu: React.FC<MultiplayerMenuProps> = ({
  onCreateRoom,
  onJoinRoom,
  onBackToSinglePlayer,
  isLoading = false,
  error,
  initialRoomId = ''
}) => {
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState(initialRoomId);
  const [activeTab, setActiveTab] = useState<'create' | 'join'>(initialRoomId ? 'join' : 'create');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [focus, setFocus] = useState<'random' | 'speed' | 'accuracy' | 'programming'>('random');

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      onCreateRoom(playerName.trim(), difficulty, focus);
    }
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim() && roomId.trim()) {
      // Remove any extra whitespace and ensure proper formatting
      const cleanRoomId = roomId.trim().replace(/\s+/g, '');
      console.log('Joining room with ID:', cleanRoomId);
      onJoinRoom(cleanRoomId, playerName.trim());
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Multiplayer Racing</h1>
        <p className="text-gray-400">Compete with friends in real-time typing races</p>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-600/50 rounded-lg p-4 mb-6">
          <p className="text-red-400 text-center">{error}</p>
        </div>
      )}

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-800">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 px-6 py-4 text-center font-semibold transition-colors ${
              activeTab === 'create'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Plus className="w-4 h-4 inline-block mr-2" />
            Create Room
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 px-6 py-4 text-center font-semibold transition-colors ${
              activeTab === 'join'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <LogIn className="w-4 h-4 inline-block mr-2" />
            Join Room
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'create' ? (
            <form onSubmit={handleCreateRoom} className="space-y-6">
              <div>
                <label className="block text-gray-300 font-semibold mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter your display name"
                  required
                  maxLength={20}
                  disabled={isLoading}
                />
                <p className="text-gray-500 text-sm mt-1">
                  This name will be visible to other players
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Race Settings
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block tracking-wider">
                      Difficulty Level
                    </label>
                    <div className="bg-[#161b22] rounded-lg p-1 border border-gray-800 flex">
                      {(['easy', 'medium', 'hard'] as const).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDifficulty(d)}
                          className={`flex-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                            difficulty === d
                              ? "bg-blue-600 text-white shadow-lg"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          {d.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block tracking-wider">
                      Text Category
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['random', 'speed', 'accuracy', 'programming'] as const).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setFocus(f)}
                          className={`px-3 py-2 rounded-lg border text-xs font-bold transition-all text-left ${
                            focus === f
                              ? "bg-blue-600/10 border-blue-500/50 text-blue-400"
                              : "bg-[#161b22] border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
                          }`}
                        >
                          {f.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-700/50">
                  <ul className="text-gray-500 text-xs space-y-1.5">
                    <li className="flex items-center gap-2">• <span className="text-gray-400">Max 6 players</span> per room</li>
                    <li className="flex items-center gap-2">• <span className="text-gray-400">Host controls</span> the race start</li>
                    <li className="flex items-center gap-2">• <span className="text-gray-400">Share ID</span> to invite friends</li>
                  </ul>
                </div>
              </div>

              <button
                type="submit"
                disabled={!playerName.trim() || isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating Room...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Race Room
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoinRoom} className="space-y-6">
              <div>
                <label className="block text-gray-300 font-semibold mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter your display name"
                  required
                  maxLength={20}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-2">
                  Room ID
                </label>
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter the room ID"
                  required
                  disabled={isLoading}
                />
                <p className="text-gray-500 text-sm mt-1">
                  Get this from the room creator
                </p>
              </div>

              <button
                type="submit"
                disabled={!playerName.trim() || !roomId.trim() || isLoading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Joining Room...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Join Race Room
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="text-center mt-6">
        <button
          onClick={onBackToSinglePlayer}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mx-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Single Player
        </button>
      </div>
    </div>
  );
};

export default MultiplayerMenu;