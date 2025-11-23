import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, RotateCcw, Trophy, Settings, Users } from "lucide-react";
import { TypingStats, CharacterState, SessionResult } from "../types";
import {
  generateRandomText,
  generateTextByDifficulty,
  generateTextByFocus,
  calculateWPM,
  calculateAccuracy,
} from "../ utils/textGenerator";
import Statistics from "./Statistics";
import Results from "./Results";
import Leaderboard from "./Leaderboard";
import MultiplayerMenu from "./MultiplayerMenu";
import RoomLobby from "./RoomLobby";
import MultiplayerRace from "./MultiplayerRace";
import RaceResults from "./RaceResults";
import { FirebaseService } from "../services/firebaseService";
import { RaceRoom } from "../types";

const TypingTest: React.FC = () => {
  const [text, setText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [currentResult, setCurrentResult] = useState<SessionResult | null>(
    null
  );
  const [savedResults, setSavedResults] = useState<SessionResult[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium"
  );
  const [focus, setFocus] = useState<
    "speed" | "accuracy" | "programming" | "random"
  >("random");

  // Multiplayer states
  const [gameMode, setGameMode] = useState<"single" | "multiplayer">("single");
  const [multiplayerState, setMultiplayerState] = useState<
    "menu" | "lobby" | "racing" | "results"
  >("menu");
  const [currentRoom, setCurrentRoom] = useState<RaceRoom | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>("");
  const [multiplayerError, setMultiplayerError] = useState<string>("");
  const [isMultiplayerLoading, setIsMultiplayerLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

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
    const saved = localStorage.getItem("typingResults");
    if (saved) {
      setSavedResults(JSON.parse(saved));
    }
  }, []);

  // Cleanup Firebase listener on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Initialize with random text
  useEffect(() => {
    generateNewText();
  }, [difficulty, focus]);

  const generateNewText = () => {
    let newText = "";
    if (focus === "random") {
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

  useEffect(() => {
    if (!currentRoom) return;

    // Handle room status transitions
    if (currentRoom.status === "waiting" && multiplayerState === "results") {
      // When room goes back to waiting after restart, go to lobby
      setMultiplayerState("lobby");
    } else if (
      currentRoom.status === "racing" &&
      multiplayerState === "lobby"
    ) {
      // When race starts, go to racing view
      setMultiplayerState("racing");
    } else if (
      currentRoom.status === "finished" &&
      multiplayerState === "racing"
    ) {
      // When race finishes, show results
      setMultiplayerState("results");
    }
  }, [currentRoom?.status, multiplayerState]);

  // Calculate stats
  useEffect(() => {
    const correctChars = userInput.split("").reduce((acc, char, index) => {
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
  useEffect(() => {
    if (userInput.length === text.length && text.length > 0) {
      setIsFinished(true);
      setIsStarted(false);

      const result: SessionResult = {
        ...stats,
        id: Date.now().toString(),
        date: Date.now(),
        textLength: text.length,
      };

      setCurrentResult(result);

      // Save result
      const newResults = [...savedResults, result];
      setSavedResults(newResults);
      localStorage.setItem("typingResults", JSON.stringify(newResults));

      setTimeout(() => setShowResults(true), 500);
    }
  }, [userInput, text, stats, savedResults]);

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
      if (e.key === "v" || e.key === "a" || e.key === "c") {
        e.preventDefault();
      }
    }
  };

  const resetTest = useCallback(() => {
    setUserInput("");
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

  // Multiplayer functions
  const handleCreateRoom = async (playerName: string) => {
    setIsMultiplayerLoading(true);
    setMultiplayerError("");

    try {
      const newText =
        focus === "random"
          ? generateTextByDifficulty(difficulty)
          : generateTextByFocus(focus);
      const roomId = await FirebaseService.createRoom(playerName, newText);

      // Subscribe to room updates
      unsubscribeRef.current = FirebaseService.subscribeToRoom(
        roomId,
        (room) => {
          if (room) {
            setCurrentRoom(room);
            setCurrentPlayerId(room.creatorId);

            if (room.status === "racing" && multiplayerState === "lobby") {
              setMultiplayerState("racing");
            } else if (room.status === "finished") {
              setMultiplayerState("results");
            }
          }
        }
      );

      setMultiplayerState("lobby");
    } catch (error) {
      setMultiplayerError(
        error instanceof Error ? error.message : "Failed to create room"
      );
    } finally {
      setIsMultiplayerLoading(false);
    }
  };

  const handleJoinRoom = async (roomId: string, playerName: string) => {
    setIsMultiplayerLoading(true);
    setMultiplayerError("");

    try {
      console.log("Attempting to join room:", roomId);

      // First check if room exists
      const roomExists = await FirebaseService.roomExists(roomId);
      if (!roomExists) {
        throw new Error(
          "Room not found. Please check the room ID and try again."
        );
      }

      const playerId = await FirebaseService.joinRoom(roomId, playerName);

      if (playerId) {
        setCurrentPlayerId(playerId);

        // Subscribe to room updates
        unsubscribeRef.current = FirebaseService.subscribeToRoom(
          roomId,
          (room) => {
            if (room) {
              setCurrentRoom(room);

              if (room.status === "countdown" && multiplayerState === "lobby") {
                // Stay in lobby during countdown
              } else if (
                room.status === "racing" &&
                multiplayerState === "lobby"
              ) {
                // Stay in lobby during countdown
              } else if (
                room.status === "racing" &&
                multiplayerState === "lobby"
              ) {
                setMultiplayerState("racing");
              } else if (room.status === "finished") {
                setMultiplayerState("results");
              }
            }
          }
        );

        setMultiplayerState("lobby");
      }
    } catch (error) {
      console.error("Error joining room:", error);
      setMultiplayerError(
        error instanceof Error ? error.message : "Failed to join room"
      );
    } finally {
      setIsMultiplayerLoading(false);
    }
  };

  const handleStartRace = async () => {
    if (!currentRoom || !currentPlayerId) return;

    try {
      await FirebaseService.startRace(currentRoom.id);
    } catch (error) {
      setMultiplayerError(
        error instanceof Error ? error.message : "Failed to start race"
      );
    }
  };

const handleLeaveRoom = async () => {
  // First, unsubscribe from Firebase to prevent further updates
  if (unsubscribeRef.current) {
    unsubscribeRef.current();
    unsubscribeRef.current = null;
  }

  // Leave the room in Firebase (if connected)
  if (currentRoom && currentPlayerId) {
    try {
      await FirebaseService.leaveRoom(currentRoom.id, currentPlayerId);
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  }

  // Reset ALL multiplayer state BEFORE changing game mode
  setCurrentRoom(null);
  setCurrentPlayerId("");
  setMultiplayerState("menu");
  setMultiplayerError("");
  setIsMultiplayerLoading(false);
  
  
  // THEN change game mode
  setGameMode("single");
};
  console.log('Current state:', { 
  gameMode, 
  multiplayerState, 
  hasRoom: !!currentRoom,
  roomId: currentRoom?.id 
});

  const handleRaceComplete = () => {
    setMultiplayerState("results");
  };

  const handleNewMultiplayerRace = async () => {
    if (!currentRoom) return;

    if (currentPlayerId === currentRoom.creatorId) {
      const newText =
        focus === "random"
          ? generateTextByDifficulty(difficulty)
          : generateTextByFocus(focus);

      try {
        await FirebaseService.restartRace(currentRoom.id, newText);
      } catch (error) {
        console.error("Failed to restart race:", error);
      }
    }

    setMultiplayerState("lobby");
  };

  const getCharacterStates = (): CharacterState[] => {
    return text.split("").map((char, index) => {
      if (index < userInput.length) {
        return {
          char,
          status: userInput[index] === char ? "correct" : "incorrect",
        };
      } else if (index === currentIndex) {
        return {
          char,
          status: "current",
        };
      } else {
        return {
          char,
          status: "untyped",
        };
      }
    });
  };

  const personalBest =
    savedResults.length > 0
      ? savedResults.reduce((best, current) =>
          current.wpm > best.wpm ? current : best
        )
      : undefined;

  // Render multiplayer components
  if (gameMode === "multiplayer") {
    if (multiplayerState === "menu") {
      return (
        <MultiplayerMenu
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onBackToSinglePlayer={() => setGameMode("single")}
          isLoading={isMultiplayerLoading}
          error={multiplayerError}
        />
      );
    }

    if (multiplayerState === "lobby" && currentRoom) {
      return (
        <RoomLobby
          room={currentRoom}
          currentPlayerId={currentPlayerId}
          onStartRace={() => setMultiplayerState("racing")}
          onLeaveRoom={handleLeaveRoom}
        />
      );
    }

    if (multiplayerState === "racing" && currentRoom) {
      return (
        <MultiplayerRace
          room={currentRoom}
          currentPlayerId={currentPlayerId}
          onRaceComplete={handleRaceComplete}
        />
      );
    }

    if (multiplayerState === "results" && currentRoom) {
      return (
        <RaceResults
          room={currentRoom}
          currentPlayerId={currentPlayerId}
          onNewRace={handleNewMultiplayerRace}
          onBackToMenu={handleLeaveRoom}
        />
      );
    }
  }

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
        <h1 className="text-4xl font-bold text-white mb-2">
          Typing Speed Test
        </h1>
        <p className="text-gray-400">Test your typing speed and accuracy</p>

        <div className="flex justify-center gap-4 mt-4">
          <button
            onClick={() => setGameMode("multiplayer")}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Users className="w-4 h-4" />
            Multiplayer
          </button>
          <button
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showLeaderboard
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-800 hover:bg-gray-700 text-white"
            }`}
          >
            <Trophy className="w-4 h-4" />
            Leaderboard
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showSettings
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-800 hover:bg-gray-700 text-white"
            }`}
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="mb-8 bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-xl font-bold text-white mb-4">
            Text Generation Settings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-300 font-semibold mb-2">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) =>
                  setDifficulty(e.target.value as "easy" | "medium" | "hard")
                }
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="easy">Easy (150-250 chars)</option>
                <option value="medium">Medium (250-350 chars)</option>
                <option value="hard">Hard (350-500 chars)</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-300 font-semibold mb-2">
                Focus Area
              </label>
              <select
                value={focus}
                onChange={(e) =>
                  setFocus(
                    e.target.value as
                      | "speed"
                      | "accuracy"
                      | "programming"
                      | "random"
                  )
                }
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
            <p>
              <strong>Random Topics:</strong> Varied content including
              literature, science, business, and technology
            </p>
            <p>
              <strong>Speed Training:</strong> Simple, repetitive patterns to
              build typing speed
            </p>
            <p>
              <strong>Accuracy Training:</strong> Complex punctuation and
              challenging vocabulary
            </p>
            <p>
              <strong>Programming Terms:</strong> Code-related vocabulary and
              technical terms
            </p>
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
                charState.status === "correct"
                  ? "text-gray-400 bg-green-900/30"
                  : charState.status === "incorrect"
                  ? "text-white bg-red-600/60"
                  : charState.status === "current"
                  ? "text-white bg-blue-600 animate-pulse"
                  : "text-gray-500"
              } ${
                charState.status === "current"
                  ? "border-l-2 border-blue-400"
                  : ""
              }`}
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
              ? "Start typing to begin the test"
              : isFinished
              ? "Test completed!"
              : "Keep typing..."}
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
