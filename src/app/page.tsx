"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

// Types
type Tile = {
  id: number;
  points: number;
  question: string;
  choices: string[];
  answer: number;
  opened?: boolean;
  revealedPoints?: boolean;
  locked?: boolean;
};

type Team = {
  id: number;
  name: string;
  score: number;
  canGuess: boolean;
};

type GamePhase = "idle" | "answering" | "stolen";

// Game Data
const SAMPLE_TILES: Tile[] = [
  { id: 1, points: 10, question: "Ai là mẹ của Chúa Giê-su?", choices: ["Maria", "Martha", "Elisabeth", "Anna"], answer: 0 },
  { id: 2, points: 10, question: "Thành phố quê hương Maria là?", choices: ["Nazareth", "Bethlehem", "Jerusalem", "Capernaum"], answer: 0 },
  { id: 3, points: 10, question: "Sự kiện Maria được sùng kính gọi là?", choices: ["Mầu Nhiệm", "Đức Mẹ", "Khổ Nạn", "Mẹ Thiên Chúa"], answer: 3 },
  { id: 4, points: 10, question: "Ngày kính Đức Mẹ phổ biến là?", choices: ["8/12", "25/12", "15/8", "1/11"], answer: 2 },
  { id: 5, points: 10, question: "Màu áo thường thấy của Đức Mẹ là?", choices: ["Xanh và trắng", "Đỏ và vàng", "Đen", "Đỏ và xanh"], answer: 0 },
  { id: 6, points: 10, question: "Tên tiếng Latinh của Maria?", choices: ["Maria", "Mariam", "Mariae", "Marita"], answer: 2 },
  { id: 7, points: 10, question: "Ai đến thăm Maria lúc truyền tin?", choices: ["Các mục đồng", "Simeon", "Thiên thần Gabriel", "Phêrô"], answer: 2 },
  { id: 8, points: 10, question: "Có bao nhiêu ô trong trò chơi?", choices: ["10", "12", "14", "16"], answer: 1 },
  { id: 9, points: 10, question: "Đức Mẹ được gọi là?", choices: ["Mẹ Thiên Chúa", "Nữ Vương", "Cả hai", "Không ai"], answer: 2 },
  { id: 10, points: 10, question: "Lễ Đức Mẹ Hồn Xác Lên Trời là?", choices: ["15/8", "25/12", "1/1", "8/12"], answer: 0 },
  { id: 11, points: 10, question: "Một biểu tượng của Maria thường là?", choices: ["Ngôi sao", "Trăng lưỡi liềm", "Cây thánh giá", "Cây gậy"], answer: 1 },
  { id: 12, points: 10, question: "Maria là mẹ của ai?", choices: ["Moses", "Jesus", "David", "Noah"], answer: 1 }
];

const DEFAULT_TEAMS: Team[] = [
  { id: 1, name: "Tổ 1 Ane", score: 0, canGuess: true },
  { id: 2, name: "Tổ 2 Marco", score: 0, canGuess: true },
  { id: 3, name: "Tổ 3 Đaminh Savio", score: 0, canGuess: true },
  { id: 4, name: "Tổ 4 Lucia", score: 0, canGuess: true },
];

// Game Constants
const ANSWER_TIME = 10; // seconds
const STEAL_TIME = 7; // seconds
const GUESS_THRESHOLD = 6; // minimum opened tiles to enable guessing
const GUESS_BONUS = 20; // points for correct guess

export default function HomePage() {
  // Client-side mounting check
  const [mounted, setMounted] = useState(false);

  // Game state
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [message, setMessage] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [wrongTeamIndex, setWrongTeamIndex] = useState<number | null>(null);
  const stealModeRef = useRef(false);
  const stealTakenRef = useRef(false);
  const [stealTaken, setStealTaken] = useState(false);


  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastWrongTileRef = useRef<Tile | null>(null);

  // Initialize game
  useEffect(() => {
    setMounted(true);
    initializeGame();
  }, []);

  const initializeGame = () => {
    setTiles(SAMPLE_TILES.map(t => ({ ...t, opened: false, revealedPoints: false })));
    setTeams(DEFAULT_TEAMS.map(t => ({ ...t, score: 0, canGuess: true })));
    setCurrentTeamIndex(0);
    setSelectedTile(null);
    setPhase("idle");
    setMessage("");
    setGameOver(false);
    setWrongTeamIndex(null);
    clearTimer();
  };

  // Timer management
  const startTimer = (seconds: number) => {
    clearTimer();
    setTimeLeft(seconds);
    timerRef.current = setInterval(() => setTimeLeft(prev => Math.max(0, prev - 1)), 1000);
  };

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  // Timer effects
  useEffect(() => {
    if (timeLeft === 0 && phase === "answering") {
      handleTimeUp();
    } else if (timeLeft === 0 && phase === "stolen") {
      handleStealTimeUp();
    }
  }, [timeLeft]);

  const handleTimeUp = () => {
    setPhase("stolen");
    setMessage("⏰ Hết thời gian! Các đội khác có thể giành quyền trả lời.");
    startTimer(STEAL_TIME);
  };

  const handleStealTimeUp = () => {
    if (selectedTile) {
      setMessage(`⏰ Hết thời gian giành quyền! Ô ${selectedTile.id} có ${selectedTile.points > 0 ? '+' : ''}${selectedTile.points} điểm nhưng không được mở.`);
    }
    endTurn();
  };

  // Game flow
  const nextTeam = () => setCurrentTeamIndex(i => (i + 1) % teams.length);

  const endTurn = () => {
    stealModeRef.current = false;
    setPhase("idle");
    setSelectedTile(null);
    setWrongTeamIndex(null);
    nextTeam();
  };

  // Tile selection
  const selectTile = (tile: Tile) => {
    if (tile.opened || gameOver || phase !== "idle" || tile.locked) return;
    stealModeRef.current = false;
    setSelectedTile(tile);
    setPhase("answering");
    startTimer(ANSWER_TIME);
    setMessage(`🎯 ${teams[currentTeamIndex].name} đang trả lời ô ${tile.id}`);
  };

  // Answer handling
  const answer = (choice: number, teamIdx?: number) => {
    const answeringTeam = teamIdx ?? currentTeamIndex;
    const tile = selectedTile!;
    clearTimer();

    if (tile.answer === choice) {
      handleCorrectAnswer(tile, answeringTeam);
    } else {
      handleWrongAnswer(tile, answeringTeam);
    }
  };

  const handleCorrectAnswer = (tile: Tile, teamIdx: number) => {
    if (stealModeRef.current) {
      console.log("[DEBUG] STEAL correct -> revealing points only", { tileId: tile.id });

      setTiles(prev => {
        const updated = prev.map(t =>
          t.id === tile.id ? { ...t, revealedPoints: true } : t
        );
        console.log("[DEBUG] Updated tiles (revealed):", updated);
        return updated;
      });

      setTeams(prev =>
        prev.map((t, i) =>
          i === teamIdx ? { ...t, score: t.score + tile.points } : t
        )
      );

      setMessage(
        `✅ ${teams[teamIdx].name} giành quyền và trả lời đúng! +${tile.points} điểm. Ô ${tile.id} vẫn được che để giữ bí mật bức tranh.`
      );

      // 🕒 Delay 300ms để React commit cập nhật trước khi reset phase
      setTimeout(() => {
        endTurn();
      }, 300);
    } else {
      // ... giữ nguyên nhánh đội chính trả lời đúng
      setTiles(ts => ts.map(t => t.id === tile.id ? { ...t, opened: true } : t));
      setTeams(prev => prev.map((t, i) => i === teamIdx ? { ...t, score: t.score + tile.points } : t));
      setMessage(`✅ ${teams[teamIdx].name} trả lời đúng! +${tile.points} điểm. Ô ${tile.id} được mở để hiển thị bức tranh.`);
      endTurn();
    }
  };

  const handleWrongAnswer = (tile: Tile, teamIdx: number) => {
    if (stealModeRef.current) {
      // ❌ Đội giành quyền trả lời sai
      setTiles(prev => prev.map(t => {
        if (t.id === tile.id) {
          return { ...t, revealedPoints: true, points: 0, locked: true };
        }
        return t;
      }));

      setMessage(
        `❌ ${teams[teamIdx].name} giành quyền nhưng trả lời sai! Ô ${tile.id} bị khóa và được tính 0 điểm. Không đội nào được trả lời ô này nữa.`
      );

      // 🔒 reset flag & timer
      stealModeRef.current = false;
      stealTakenRef.current = false;
      lastWrongTileRef.current = null;
      clearTimer();

      // ✅ Kết thúc lượt luôn
      endTurn();
    } else {
      // ❌ Đội chính trả lời sai → sang pha giành quyền
      lastWrongTileRef.current = tile;
      setWrongTeamIndex(teamIdx);
      stealTakenRef.current = false;
      setMessage(
        `❌ ${teams[teamIdx].name} trả lời sai! Các đội khác có thể giành quyền trả lời ô ${tile.id}.`
      );
      setPhase("stolen");
      setSelectedTile(null);
      clearTimer();
      startTimer(STEAL_TIME);
    }
  };


  // Steal functionality
  const steal = (teamIdx: number) => {
    if (teamIdx === wrongTeamIndex || phase !== "stolen" || gameOver || !lastWrongTileRef.current) return;
    if (stealTakenRef.current) return;

    stealTakenRef.current = true;
    stealModeRef.current = true;

    setCurrentTeamIndex(teamIdx);
    setSelectedTile(lastWrongTileRef.current);
    setMessage(`⚡ ${teams[teamIdx].name} giành quyền trả lời ô ${lastWrongTileRef.current.id}!`);
    setPhase("answering");
    startTimer(ANSWER_TIME);
  };


  // Guessing functionality
  const guess = (teamIdx: number) => {
    if (!isGuessingEnabled() || !teams[teamIdx].canGuess || gameOver) return;

    const text = prompt(`${teams[teamIdx].name} đoán bức tranh là gì?`)?.trim().toLowerCase();
    if (!text) return;

    if (text.includes("maria") || text.includes("đức mẹ")) {
      setMessage(`🎉 ${teams[teamIdx].name} đoán đúng! +${GUESS_BONUS} điểm.`);
      setTeams(prev => prev.map((t, i) => i === teamIdx ? { ...t, score: t.score + GUESS_BONUS } : t));
      setGameOver(true);
    } else {
      setMessage(`🚫 ${teams[teamIdx].name} đoán sai và bị loại khỏi lượt đoán.`);
      setTeams(prev => prev.map((t, i) => i === teamIdx ? { ...t, canGuess: false } : t));
    }
  };

  // Helper functions
  const isGuessingEnabled = () => {
    return tiles.filter(t => t.opened).length >= GUESS_THRESHOLD;
  };

  const getTileClassName = (tile: Tile) => {
    console.log("[DEBUG] Rendering tile:", tile.id, { opened: tile.opened, revealedPoints: tile.revealedPoints });
    if (tile.opened) {
      // Ô đã mở - hiển thị bức tranh phía sau (trong suốt)
      return "bg-transparent text-transparent border-2 border-green-400";
    } else if (tile.revealedPoints) {
      // Ô có điểm được tiết lộ nhưng vẫn che bức tranh (ô trắng)
      return "bg-white text-gray-600 border-2 border-gray-400 shadow-md";
    } else {
      // Ô bình thường - che bức tranh
      return "bg-blue-600 text-white hover:bg-blue-500";
    }
  };

  const getTileContent = (tile: Tile) => {
    if (tile.opened) return "";
    if (tile.revealedPoints) return `${tile.points > 0 ? "+" : ""}${tile.points}`;
    return tile.id;
  };

  // Loading state
  if (!mounted) {
    return (
      <main className="min-h-screen bg-gray-100 text-gray-800 p-6 flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-4 text-blue-700">Trò chơi Đoán tranh Đức Mẹ</h1>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 text-gray-800 p-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-4 text-blue-700">Trò chơi Đoán tranh Đức Mẹ</h1>

      <div className="flex flex-col md:flex-row gap-6 w-full max-w-6xl">
        {/* Game Board */}
        <div className="relative flex-1">
          <Image
            src="/bg.jpg"
            alt="Đức Mẹ"
            fill
            className="object-cover rounded-lg opacity-40"
            priority
          />
          <div className="grid grid-cols-4 gap-2 relative z-10 p-2">
            {tiles.map(tile => {
              console.log("[DEBUG] Tile in render:", tile.id, tile);
              return (
                <div
                  key={tile.id}
                  onClick={() => selectTile(tile)}
                  className={`cursor-pointer aspect-square flex items-center justify-center font-bold text-xl rounded-md 
                  transition-all duration-700 ease-in-out transform ${getTileClassName(tile)}`}
                >
                  {getTileContent(tile)}
                </div>
              );
            })}
          </div>
        </div>

        {/* Game Info Sidebar */}
        <div className="w-full md:w-64 bg-white shadow-md rounded-lg p-4">
          <div className="space-y-2">
            <p><strong>🎯 Lượt:</strong> {teams[currentTeamIndex]?.name}</p>
            <p><strong>⏰ Thời gian:</strong> {timeLeft}s</p>
            <p><strong>Trạng thái:</strong> {phase}</p>
            <p><strong>Ô đã mở:</strong> {tiles.filter(t => t.opened).length}/12</p>
          </div>

          <button
            onClick={initializeGame}
            className="mt-4 w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Đặt lại game
          </button>

          <h3 className="mt-4 font-semibold text-lg">Điểm các đội</h3>
          <div className="space-y-2">
            {teams.map((team, i) => (
              <div key={team.id} className="flex justify-between items-center py-1">
                <span>{team.name}</span>
                <b>{team.score}</b>
                {isGuessingEnabled() && !gameOver && (
                  <button
                    onClick={() => guess(i)}
                    disabled={!team.canGuess}
                    className={`text-sm px-2 py-1 rounded transition ${team.canGuess
                      ? "bg-yellow-400 hover:bg-yellow-500"
                      : "bg-gray-300 cursor-not-allowed"
                      }`}
                  >
                    Giơ cờ đoán
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Question Modal */}
      {selectedTile && !gameOver && (phase === "answering" || phase === "stolen") && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative">
            <button
              onClick={() => { setSelectedTile(null); setPhase("idle"); clearTimer(); }}
              className="absolute top-2 right-3 text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>

            <h3 className="font-semibold text-lg mb-4">
              Ô {selectedTile.id}: {selectedTile.question}
            </h3>

            <div className="flex flex-col gap-2">
              {selectedTile.choices.map((choice, idx) => (
                <button
                  key={idx}
                  onClick={() => answer(idx)}
                  className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
                >
                  {String.fromCharCode(65 + idx)}. {choice}
                </button>
              ))}
            </div>

            <p className="mt-3 text-sm text-gray-600">⏱ Còn lại: {timeLeft}s</p>
          </div>
        </div>
      )}

      {/* Steal Phase */}
      {phase === "stolen" && !gameOver && (
        <div className="mt-4 flex gap-2 flex-wrap justify-center">
          {teams.map((team, i) => {
            const disabled = i === wrongTeamIndex || stealTaken || (lastWrongTileRef.current?.locked ?? false);
            return (
              <button
                key={team.id}
                onClick={() => steal(i)}
                disabled={disabled}
                className={`px-3 py-2 rounded transition ${disabled
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-purple-500 hover:bg-purple-600 text-white"
                  }`}
              >
                {team.name} giành quyền trả lời
              </button>
            );
          })}
        </div>
      )}

      {/* Game Message */}
      <p className="mt-4 text-lg text-center">{message}</p>

      {/* Game Over */}
      {gameOver && (
        <div className="mt-6 bg-green-100 p-4 rounded-lg w-full max-w-3xl text-center">
          <h2 className="text-xl font-bold mb-2">🎉 Kết quả cuối cùng</h2>
          {teams.map(team => (
            <div key={team.id}>{team.name}: {team.score} điểm</div>
          ))}
        </div>
      )}
    </main>
  );
}