import React from 'react';
import { Trophy, RefreshCw, Home, Calendar } from 'lucide-react';
import { SessionResult } from '../types';

interface ResultsProps {
  result: SessionResult;
  onRestart: () => void;
  onNewTest: () => void;
  personalBest?: SessionResult;
}

const Results: React.FC<ResultsProps> = ({ result, onRestart, onNewTest, personalBest }) => {
  const isNewRecord = personalBest ? result.wpm > personalBest.wpm : true;
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPerformanceLevel = (wpm: number): { level: string; color: string } => {
    if (wpm >= 80) return { level: 'Expert', color: 'text-yellow-400' };
    if (wpm >= 60) return { level: 'Advanced', color: 'text-green-400' };
    if (wpm >= 40) return { level: 'Intermediate', color: 'text-blue-400' };
    if (wpm >= 20) return { level: 'Beginner', color: 'text-purple-400' };
    return { level: 'Novice', color: 'text-gray-400' };
  };

  const performance = getPerformanceLevel(result.wpm);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Trophy className={`w-16 h-16 ${isNewRecord ? 'text-yellow-400' : 'text-blue-400'}`} />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Test Complete!</h2>
        {isNewRecord && (
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg p-3 mb-4">
            <p className="text-yellow-400 font-semibold">🎉 New Personal Best!</p>
          </div>
        )}
        <p className={`text-lg ${performance.color} font-semibold`}>{performance.level} Level</p>
      </div>

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-1">{result.wpm}</div>
            <div className="text-gray-400 text-sm">Words/Min</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-1">{result.accuracy}%</div>
            <div className="text-gray-400 text-sm">Accuracy</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400 mb-1">{formatTime(result.timeElapsed)}</div>
            <div className="text-gray-400 text-sm">Time</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-400 mb-1">{result.totalKeystrokes}</div>
            <div className="text-gray-400 text-sm">Keystrokes</div>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-800">
          <div className="flex justify-between text-sm text-gray-400">
            <span>Correct: <span className="text-green-400">{result.correctKeystrokes}</span></span>
            <span>Incorrect: <span className="text-red-400">{result.incorrectKeystrokes}</span></span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(result.date).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {personalBest && !isNewRecord && (
        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800 mb-6">
          <h3 className="text-white font-semibold mb-2">Personal Best</h3>
          <div className="flex justify-between text-sm text-gray-300">
            <span>WPM: <span className="text-blue-400">{personalBest.wpm}</span></span>
            <span>Accuracy: <span className="text-green-400">{personalBest.accuracy}%</span></span>
            <span>Date: {new Date(personalBest.date).toLocaleDateString()}</span>
          </div>
        </div>
      )}

      <div className="flex gap-4 justify-center">
        <button
          onClick={onRestart}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Same Text
        </button>
        <button
          onClick={onNewTest}
          className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          <Home className="w-4 h-4" />
          New Test
        </button>
      </div>
    </div>
  );
};

export default Results;