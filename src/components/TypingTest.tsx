import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, Trophy, Settings } from 'lucide-react';
import { TypingStats, CharacterState, SessionResult } from '../types';
import {  generateTextByDifficulty, generateTextByFocus, calculateWPM, calculateAccuracy } from '../ utils/textGenerator';
import Statistics from './Statistics';
import Results from './Results';
import Leaderboard from './Leaderboard';

const TypingTest: React.FC = () => {
  const [text, setText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [currentResult, setCurrentResult] = useState<SessionResult | null>(null);
  const [savedResults, setSavedResults] = useState<SessionResult[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [hasSavedResult, setHasSavedResult] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [focus, setFocus] = useState<'speed' | 'accuracy' | 'programming' | 'random'>('random');

  const inputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [stats, setStats] = useState<TypingStats>({
    wpm: 0,
    accuracy: 100,
    timeElapsed: 0,
    correctKeystrokes: 0,
    incorrectKeystrokes: 0,
    totalKeystrokes: 0,
  });

  // Load saved results from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('typingResults');
    if (saved) {
      setSavedResults(JSON.parse(saved));
    }
  }, []);
  console.log('saved results',savedResults)

  // Initialize with random text
  useEffect(() => {
    generateNewText();
  }, [difficulty, focus]);

  const generateNewText = () => {
    let newText = '';
    if (focus === 'random') {
      newText = generateTextByDifficulty(difficulty);
    } else {
      newText = generateTextByFocus(focus);
    }
    setText(newText);
  };

  // Timer effect
  useEffect(() => {
    if (isStarted && !isFinished && startTime) {
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
  }, [isStarted, isFinished, startTime]);

  // Calculate stats
  useEffect(() => {
    const correctChars = userInput.split('').reduce((acc, char, index) => {
      return acc + (char === text[index] ? 1 : 0);
    }, 0);

    const incorrectChars = userInput.length - correctChars;
    const wpm = calculateWPM(correctChars, timeElapsed);
    const accuracy = calculateAccuracy(correctChars, incorrectChars);

    setStats({
      wpm,
      accuracy,
      timeElapsed,
      correctKeystrokes: correctChars,
      incorrectKeystrokes: incorrectChars,
      totalKeystrokes: userInput.length,
    });
  }, [userInput, timeElapsed, text]);

  // Check if test is complete
  const hasSavedResultRef = useRef(false);
useEffect(() => {
  const testIsComplete = userInput.length === text.length && text.length > 0;

  if (testIsComplete && !hasSavedResultRef.current) {
    hasSavedResultRef.current = true;
    setIsFinished(true);
    setIsStarted(false);

    const result: SessionResult = {
      ...stats,
      id: Date.now().toString(),
      date: Date.now(),
      textLength: text.length,
    };
    setCurrentResult(result);
    setSavedResults((prevResults) => {
      const newResults = [...prevResults, result];
      localStorage.setItem('typingResults', JSON.stringify(newResults));
      return newResults;
    });

    setHasSavedResult(true);
    setTimeout(() => setShowResults(true), 500);
  }
}, [userInput, text, stats, hasSavedResult]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Prevent input beyond text length
    if (value.length > text.length) return;

    // Start timer on first keystroke
    if (!isStarted && value.length > 0) {
      setIsStarted(true);
      setStartTime(Date.now());
    }

    setUserInput(value);
    setCurrentIndex(value.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent common shortcuts that could interfere
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'v' || e.key === 'a' || e.key === 'c') {
        e.preventDefault();
      }
    }
  };

  const resetTest = useCallback(() => {
    hasSavedResultRef.current = false;
    setUserInput('');
    setCurrentIndex(0);
    setIsStarted(false);
    setIsFinished(false);
    setStartTime(null);
    setTimeElapsed(0);
    setShowResults(false);
    setCurrentResult(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const startNewTest = useCallback(() => {
    generateNewText();
    resetTest();
  }, [resetTest, difficulty, focus]);

  const getCharacterStates = (): CharacterState[] => {
    return text.split('').map((char, index) => {
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

  const personalBest = savedResults.length > 0 
    ? savedResults.reduce((best, current) => current.wpm > best.wpm ? current : best)
    : undefined;

  if (showResults && currentResult) {
    return (
      <Results
        result={currentResult}
        onRestart={resetTest}
        onNewTest={startNewTest}
        personalBest={personalBest}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Typing Speed Test</h1>
        <p className="text-gray-400">Test your typing speed and accuracy</p>
        
        <div className="flex justify-center gap-4 mt-4">
          <button
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showLeaderboard 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-gray-800 hover:bg-gray-700 text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            Leaderboard
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showSettings 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-gray-800 hover:bg-gray-700 text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="mb-8 bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-xl font-bold text-white mb-4">Text Generation Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-300 font-semibold mb-2">Difficulty Level</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="easy">Easy (150-250 chars)</option>
                <option value="medium">Medium (250-350 chars)</option>
                <option value="hard">Hard (350-500 chars)</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-300 font-semibold mb-2">Focus Area</label>
              <select
                value={focus}
                onChange={(e) => setFocus(e.target.value as 'speed' | 'accuracy' | 'programming' | 'random')}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="random">Random Topics</option>
                <option value="speed">Speed Training</option>
                <option value="accuracy">Accuracy Training</option>
                <option value="programming">Programming Terms</option>
              </select>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-400">
            <p><strong>Random Topics:</strong> Varied content including literature, science, business, and technology</p>
            <p><strong>Speed Training:</strong> Simple, repetitive patterns to build typing speed</p>
            <p><strong>Accuracy Training:</strong> Complex punctuation and challenging vocabulary</p>
            <p><strong>Programming Terms:</strong> Code-related vocabulary and technical terms</p>
          </div>
        </div>
      )}

      {showLeaderboard && (
        <div className="mb-8 bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-xl font-bold text-white mb-4">Top Scores</h2>
          <Leaderboard results={savedResults} />
        </div>
      )}

      {/* Statistics */}
      <Statistics stats={stats} />

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
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Play className="w-5 h-5 text-blue-400" />
          <span className="text-white font-semibold">
            {!isStarted && userInput.length === 0
              ? 'Start typing to begin the test'
              : isFinished
              ? 'Test completed!'
              : 'Keep typing...'}
          </span>
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
          autoFocus
        />
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        <button
          onClick={resetTest}
          className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
        <button
          onClick={startNewTest}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          <Play className="w-4 h-4" />
          New Test
        </button>
      </div>
    </div>
  );
};

export default TypingTest;