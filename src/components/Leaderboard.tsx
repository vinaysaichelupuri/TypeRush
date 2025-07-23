import React from 'react';
import { Trophy, Medal, Award } from 'lucide-react';
import { SessionResult } from '../types';

interface LeaderboardProps {
  results: SessionResult[];
}

const Leaderboard: React.FC<LeaderboardProps> = ({ results }) => {
  const topResults = results
    .sort((a, b) => b.wpm - a.wpm)
    .slice(0, 10);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-5 h-5 text-yellow-400" />;
      case 1:
        return <Medal className="w-5 h-5 text-gray-300" />;
      case 2:
        return <Award className="w-5 h-5 text-orange-400" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-gray-400 font-bold">{index + 1}</span>;
    }
  };

  if (topResults.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No results yet. Complete a typing test to see your scores!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {topResults.map((result, index) => (
        <div
          key={result.id}
          className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
            index === 0
              ? 'bg-yellow-500/10 border-yellow-500/30'
              : index === 1
              ? 'bg-gray-500/10 border-gray-500/30'
              : index === 2
              ? 'bg-orange-500/10 border-orange-500/30'
              : 'bg-gray-800/50 border-gray-700'
          }`}
        >
          <div className="flex-shrink-0">
            {getRankIcon(index)}
          </div>
          
          <div className="flex-grow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-white font-semibold">{result.wpm} WPM</div>
                  <div className="text-gray-400 text-sm">{result.accuracy}% accuracy</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-gray-400 text-sm">
                  {new Date(result.date).toLocaleDateString()}
                </div>
                <div className="text-gray-500 text-xs">
                  {Math.floor(result.timeElapsed / 60)}:{(result.timeElapsed % 60).toString().padStart(2, '0')}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Leaderboard;