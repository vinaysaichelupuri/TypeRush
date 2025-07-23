import React from 'react';
import { Clock, Target, Zap, CheckCircle } from 'lucide-react';
import { TypingStats } from '../types';

interface StatisticsProps {
  stats: TypingStats;
}

const Statistics: React.FC<StatisticsProps> = ({ stats }) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-blue-400" />
          <span className="text-gray-400 text-sm">WPM</span>
        </div>
        <div className="text-2xl font-bold text-white">{stats.wpm}</div>
      </div>
      
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4 text-blue-400" />
          <span className="text-gray-400 text-sm">Accuracy</span>
        </div>
        <div className="text-2xl font-bold text-white">{stats.accuracy}%</div>
      </div>
      
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-blue-400" />
          <span className="text-gray-400 text-sm">Time</span>
        </div>
        <div className="text-2xl font-bold text-white">{formatTime(stats.timeElapsed)}</div>
      </div>
      
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-4 h-4 text-blue-400" />
          <span className="text-gray-400 text-sm">Keystrokes</span>
        </div>
        <div className="text-2xl font-bold text-white">{stats.totalKeystrokes}</div>
      </div>
    </div>
  );
};

export default Statistics;