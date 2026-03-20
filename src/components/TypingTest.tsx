import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, RotateCcw, Trophy, Settings, Users } from "lucide-react";
import { TypingStats, CharacterState, SessionResult } from "../types";
import {
  generateRandomText,
  generateTextByDifficulty,
  generateTextByFocus,
  calculateWPM,
  calculateAccuracy,
} from "../utils/textGenerator";
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
    null,
  );
  const [savedResults, setSavedResults] = useState<SessionResult[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium",
  );
  const [focus, setFocus] = useState<
    "speed" | "accuracy" | "programming" | "random"
  >("random");
  const [isInputFocused, setIsInputFocused] = useState(true);
  const [hasError, setHasError] = useState(false);

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
  const caretRef = useRef<HTMLDivElement>(null);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
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

  // Update caret position
  useEffect(() => {
    if (caretRef.current && charRefs.current[currentIndex]) {
      const charEle = charRefs.current[currentIndex];
      caretRef.current.style.left = `${charEle.offsetLeft}px`;
      caretRef.current.style.top = `${charEle.offsetTop}px`;
      caretRef.current.style.width = `${charEle.offsetWidth}px`;
      caretRef.current.style.height = `${charEle.offsetHeight}px`;
    }
  }, [currentIndex, text]);

  // Load saved results from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("typingResults");
    if (saved) {
      setSavedResults(JSON.parse(saved));
    }

    // Check for room ID in URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const roomIdFromUrl = urlParams.get("room");

    // Check for active multiplayer session
    const savedRoomId = localStorage.getItem("activeRoomId");
    const savedPlayerId = localStorage.getItem("activePlayerId");

    // Logic: If URL has a room ID, and it's different from our saved session, 
    // we should prioritize the NEW room from the URL.
    if (roomIdFromUrl && savedRoomId && roomIdFromUrl !== savedRoomId) {
      // Clear old session to join the new one
      localStorage.removeItem("activeRoomId");
      localStorage.removeItem("activePlayerId");
      
      setGameMode("multiplayer");
      setMultiplayerState("menu");
    } else if (savedRoomId && savedPlayerId) {
      // No conflicting URL parameter, reconnect normally
      reconnectToRoom(savedRoomId, savedPlayerId);
    } else if (roomIdFromUrl) {
      // First time joining via link
      setGameMode("multiplayer");
      setMultiplayerState("menu");
    }
  }, []);

  const reconnectToRoom = async (roomId: string, playerId: string) => {
    setIsMultiplayerLoading(true);
    try {
      const roomExists = await FirebaseService.roomExists(roomId);
      if (!roomExists) {
        localStorage.removeItem("activeRoomId");
        localStorage.removeItem("activePlayerId");
        return;
      }

      unsubscribeRef.current = FirebaseService.subscribeToRoom(
        roomId,
        (room) => {
          if (room) {
            if (!room.players[playerId]) {
              // Player is no longer in the room
              handleLeaveRoom();
              return;
            }
            setCurrentRoom(room);
            setCurrentPlayerId(playerId);
            setGameMode("multiplayer");
          } else {
            handleLeaveRoom();
          }
        },
      );
    } catch (error) {
      console.error("Failed to reconnect:", error);
      localStorage.removeItem("activeRoomId");
      localStorage.removeItem("activePlayerId");
    } finally {
      setIsMultiplayerLoading(false);
    }
  };

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
    charRefs.current = new Array(newText.length).fill(null);
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
    if (currentRoom.status === "waiting") {
      if (multiplayerState === "results" || multiplayerState === "menu") {
        setMultiplayerState("lobby");
      }
    } else if (currentRoom.status === "racing") {
      if (multiplayerState === "lobby") {
        setMultiplayerState("racing");
      }
    } else if (currentRoom.status === "finished") {
      if (multiplayerState !== "results") {
        setMultiplayerState("results");
      }
    }
  }, [currentRoom?.status, multiplayerState]);

  // Check if all players finished (Host only)
  useEffect(() => {
    if (!currentRoom || !currentPlayerId || currentPlayerId !== currentRoom.creatorId) return;
    if (currentRoom.status !== "racing") return;

    const players = Object.values(currentRoom.players);
    const allFinished = players.every(p => p.isFinished);
    
    if (allFinished && players.length > 0) {
      FirebaseService.updateRoomStatus(currentRoom.id, "finished");
    }
  }, [currentRoom, currentPlayerId]);


  // Calculate stats
  useEffect(() => {
    const correctChars = userInput.split("").reduce((acc, char, index) => {
      return acc + (char === text[index] ? 1 : 0);
    }, 0);

    const incorrectChars = userInput.length - correctChars;
    const wpm = calculateWPM(userInput.length, timeElapsed);
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
    if (userInput.length === text.length && text.length > 0 && !isFinished) {
      setIsFinished(true);
      setIsStarted(false);

      const result: SessionResult = {
        ...stats,
        id: Date.now().toString(),
        date: Date.now(),
        textLength: text.length,
      };

      setCurrentResult(result);

      // Save result using functional update to avoid dependency on savedResults
      setSavedResults((prev) => {
        const newResults = [...prev, result];
        localStorage.setItem("typingResults", JSON.stringify(newResults));
        return newResults;
      });

      setTimeout(() => setShowResults(true), 500);
    }
  }, [userInput, text, stats, isFinished]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Prevent input beyond text length
    if (value.length > text.length) return;

    // Start timer on first keystroke
    if (!isStarted && value.length > 0) {
      setIsStarted(true);
      setStartTime(Date.now());
    }

    // Error detection for shake effect
    const lastCharTyped = value[value.length - 1];
    const expectedChar = text[value.length - 1];

    if (value.length > userInput.length && lastCharTyped !== expectedChar) {
      setHasError(true);
      setTimeout(() => setHasError(false), 200);
    }

    setUserInput(value);
    setCurrentIndex(value.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
      const { roomId, playerId } = await FirebaseService.createRoom(playerName, newText);

      unsubscribeRef.current = FirebaseService.subscribeToRoom(
        roomId,
        (room) => {
          if (room) {
            setCurrentRoom(room);
            setCurrentPlayerId(playerId);
          }
        },
      );

      localStorage.setItem("activeRoomId", roomId);
      localStorage.setItem("activePlayerId", playerId);
      setMultiplayerState("lobby");
    } catch (error) {
      setMultiplayerError(
        error instanceof Error ? error.message : "Failed to create room",
      );
    } finally {
      setIsMultiplayerLoading(false);
    }
  };

  const handleJoinRoom = async (roomId: string, playerName: string) => {
    setIsMultiplayerLoading(true);
    setMultiplayerError("");

    try {
      const roomExists = await FirebaseService.roomExists(roomId);
      if (!roomExists) {
        throw new Error(
          "Room not found. Please check the room ID and try again.",
        );
      }

      const playerId = await FirebaseService.joinRoom(roomId, playerName);

      if (playerId) {
        setCurrentPlayerId(playerId);

        unsubscribeRef.current = FirebaseService.subscribeToRoom(
          roomId,
          (room) => {
            if (room) {
              setCurrentRoom(room);
            }
          },
        );

        localStorage.setItem("activeRoomId", roomId);
        localStorage.setItem("activePlayerId", playerId);
        setMultiplayerState("lobby");
      }
    } catch (error) {
      setMultiplayerError(
        error instanceof Error ? error.message : "Failed to join room",
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
        error instanceof Error ? error.message : "Failed to start race",
      );
    }
  };

  const handleLeaveRoom = async () => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    if (currentRoom && currentPlayerId) {
      try {
        await FirebaseService.leaveRoom(currentRoom.id, currentPlayerId);
      } catch (error) {
        console.error("Error leaving room:", error);
      }
    }

    localStorage.removeItem("activeRoomId");
    localStorage.removeItem("activePlayerId");
    setCurrentRoom(null);
    setCurrentPlayerId("");
    setMultiplayerState("menu");
    setMultiplayerError("");
    setIsMultiplayerLoading(false);
    setGameMode("single");
  };

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
          current.wpm > best.wpm ? current : best,
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
          initialRoomId={new URLSearchParams(window.location.search).get("room") || ""}
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
          onLeaveRoom={handleLeaveRoom}
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
      <div className="w-full h-full flex flex-col justify-center">
        <Results
          result={currentResult}
          onRestart={resetTest}
          onNewTest={startNewTest}
          personalBest={personalBest}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col justify-between">
      {/* Header & Settings */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setGameMode("multiplayer")}
            className="flex items-center gap-2 bg-[#161b22] hover:bg-[#21262d] text-white px-4 py-2 rounded-lg border border-gray-800 transition-colors"
          >
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium">Multiplayer</span>
          </button>
          <button
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors ${
              showLeaderboard
                ? "bg-blue-600/10 border-blue-500/50 text-blue-400"
                : "bg-[#161b22] border-gray-800 text-white hover:bg-[#21262d]"
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span className="font-medium">Leaderboard</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-[#161b22] rounded-lg p-1 border border-gray-800 flex">
            {["easy", "medium", "hard"].map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d as any)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  difficulty === d
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {d.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg border transition-colors ${
              showSettings
                ? "bg-blue-600/10 border-blue-500/50 text-blue-400"
                : "bg-[#161b22] border-gray-800 text-white hover:bg-[#21262d]"
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="mb-6 bg-[#161b22] rounded-xl p-4 border border-gray-800 animate-in fade-in duration-200">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            Focus Area
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {["random", "speed", "accuracy", "programming"].map((f) => (
              <button
                key={f}
                onClick={() => setFocus(f as any)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  focus === f
                    ? "bg-blue-600/10 border-blue-500/50"
                    : "bg-transparent border-gray-800 hover:bg-[#21262d]"
                }`}
              >
                <div
                  className={`text-xs font-bold ${focus === f ? "text-blue-400" : "text-white"}`}
                >
                  {f.toUpperCase()}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {showLeaderboard && (
        <div className="mb-6 bg-[#161b22] rounded-xl p-4 border border-gray-800 max-h-[200px] overflow-y-auto">
          <Leaderboard results={savedResults} />
        </div>
      )}

      {/* Stats Dashboard */}
      <div className="mb-4">
        <Statistics stats={stats} />
      </div>

      {/* Typing Playground */}
      <div
        className={`relative bg-[#0d1117] rounded-xl p-6 md:p-8 flex-grow min-h-0 mb-6 transition-all border ${
          isInputFocused ? "border-blue-500/40" : "border-gray-800"
        } ${hasError ? "shake border-red-500/50" : ""}`}
        onClick={() => inputRef.current?.focus()}
      >
        {!isInputFocused && !isFinished && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#0d1117]/80 backdrop-blur-[2px] rounded-xl transition-opacity">
            <button className="flex items-center gap-3 bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-blue-900/40 transform active:scale-95 transition-transform">
              <Play className="w-5 h-5 fill-current" />
              <span>CLICK TO START</span>
            </button>
          </div>
        )}

        <div className="typing-area relative z-10 h-full overflow-hidden">
          <div ref={caretRef} className="caret" />
          <div className="whitespace-pre-wrap break-words leading-relaxed relative z-10">
            {getCharacterStates().map((charState, index) => (
              <span
                key={index}
                ref={(el) => (charRefs.current[index] = el)}
                className={`char ${charState.status}`}
              >
                {charState.char}
              </span>
            ))}
          </div>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={userInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
          className="absolute inset-0 opacity-0 cursor-default"
          autoComplete="off"
          spellCheck="false"
          autoFocus
          disabled={isFinished}
        />
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4 shrink-0 pb-2">
        <button
          onClick={resetTest}
          className="flex items-center gap-2 bg-[#161b22] hover:bg-[#21262d] text-white px-6 py-2.5 rounded-lg font-semibold border border-gray-800 transition-colors active:scale-95"
        >
          <RotateCcw className="w-4 h-4 text-gray-400" />
          <span>Reset</span>
        </button>
        <button
          onClick={startNewTest}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold transition-all active:scale-95"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>New Run</span>
        </button>
      </div>
    </div>
  );
};

export default TypingTest;
