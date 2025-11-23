import React, { useState } from 'react';
import { Users, Plus, LogIn, ArrowLeft } from 'lucide-react';

interface MultiplayerMenuProps {
  onCreateRoom: (playerName: string) => void;
  onJoinRoom: (roomId: string, playerName: string) => void;
  onBackToSinglePlayer: () => void;
  isLoading?: boolean;
  error?: string;
}

const MultiplayerMenu: React.FC<MultiplayerMenuProps> = ({
  onCreateRoom,
  onJoinRoom,
  onBackToSinglePlayer,
  isLoading = false,
  error
}) => {
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      onCreateRoom(playerName.trim());
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
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Room Settings
                </h3>
                <ul className="text-gray-400 text-sm space-y-1">
                  <li>• Maximum 6 players per room</li>
                  <li>• Random text will be generated for the race</li>
                  <li>• You'll be the room host and can start the race</li>
                  <li>• Share the room ID with friends to invite them</li>
                </ul>
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