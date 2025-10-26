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
  { id: 1, points: 10, question: "Kinh Kính Mừng chỉ được ấn định với hình thức cố định trong toàn thể Hội Thánh vào thời nào?", choices: ["Thế kỷ XVI, dưới triều Đức Giáo Hoàng Piô V", "Thế kỷ XII, khi Thánh danh “Giêsu” được thêm vào", "Thế kỷ XIV, khi xuất hiện phần cầu “Sancta Maria, ora pro nobis.”", "Thế kỷ XI, khi người ta chỉ đọc lời chào của bà Êlisabét"], answer: 0 },
  { id: 2, points: 10, question: "Đức Giáo Hoàng nào đã lập lễ “Đức Bà Thắng Trận” để ghi nhớ chiến thắng Lepante?", choices: ["Đức Piô V", "Đức Grêgôriô XIII", "Đức Clêmentê XI", "Đức Lêô XIII"], answer: 0 },
  { id: 3, points: 10, question: "Đức Giáo Hoàng Grêgôriô XIII đã đổi danh hiệu lễ nào thành “Lễ Mân Côi Thánh”?", choices: ["Đức Mẹ Phù Hộ Các Giáo Hữu", "Lễ Đức Mẹ Chiến Thắng", "Đức Mẹ Lên Trời", "Đức Mẹ Fatima"], answer: 1 },
  { id: 4, points: 10, question: "Trước kia vào thế kỉ X, các tu sĩ đọc 150 Thánh Vịnh. Khi không hiểu tiếng Latinh, họ đã thay thế bằng:", choices: ["150 Kinh Sáng Danh", "150 Kinh Lạy Cha", "150 Kinh Kính Mừng", "150 Kinh Tin Kính"], answer: 1 },
  { id: 5, points: 10, question: "Người được Đức Mẹ trao sứ mệnh truyền bá Kinh Mân Côi là ai?", choices: ["Thánh Phanxicô Assisi", "Thánh Đa Minh (Dominico)", "Thánh Giêrônimô", "Thánh Antôn Padua"], answer: 1 },
  { id: 6, points: 10, question: "Vào những năm 1400, các mầu nhiệm trong Kinh Mân Côi được đúc kết thành bao nhiêu mầu nhiệm chính?", choices: ["10 mầu nhiệm", "15 mầu nhiệm", "20 mầu nhiệm", "25 mầu nhiệm"], answer: 1 },
  { id: 7, points: 10, question: "Thánh danh “Giêsu” được thêm vào phần đầu Kinh Mân Côi khi nào?", choices: ["Thế kỉ XII", "Thế kỉ XIII", "Thế kỉ XI", "Thế kỉ XIV"], answer: 0 },
  { id: 8, points: 10, question: "Thánh Đa Minh đã từng khẳng định điều gì về giá trị của Kinh Mân Côi?", choices: ["Không có việc nào đẹp lòng Chúa Giêsu và Mẹ Người hơn là đọc Kinh Mân Côi một cách sốt sắng.", "Thiên Chúa cai trị thế gian, nhưng kinh nguyện điều khiển Thiên Chúa.", "Kinh Mân Côi là thói quen đạo đức hằng ngày của các thánh", "Đọc Kinh Mân Côi là niềm vui và niềm an ủi sâu xa nhất trong tâm hồn tôi"], answer: 0 },
  { id: 9, points: 10, question: "Theo Đức Giáo Hoàng Piô XI, Ngài đã khẳng định điều gì về giá trị của Kinh Mân Côi?", choices: ["Mỗi phần tử trong Hội Kinh Mân Côi luân phiên ngày đêm đọc kinh như một sự tôn kính không ngừng dâng lên Mẹ Thiên Chúa", "Kinh Mân Côi thực là một triều thiên hoa hồng rực rỡ nhất mà tuổi thanh xuân có thể đội", "Kinh Mân Côi mang ý nghĩa là kinh nguyện chung của gia đình.", "Không gì hoàn hảo hơn khi nhiều tiếng cầu xin từ khắp nơi trên thế giới cùng dâng lên Đức Trinh Nữ Maria"], answer: 1 },
  { id: 10, points: 10, question: "Ai đã thêm 5 mầu nhiệm Sự Sáng vào Kinh Mân Côi vào năm 2002?", choices: ["Đức Piô XII", "Đức Gioan Phaolô II", "Đức Phanxicô", "Đức Lêô XIII"], answer: 1 },
  { id: 11, points: 10, question: "Theo Các lời hứa của Mẹ Thiên Chúa cho ai đọc kinh Mân Côi, điều nào sau đây không đúng với lời hứa của Mẹ Thiên Chúa?", choices: ["Ai đọc Kinh Mân Côi sẽ không bị rủi ro, chết bất đắc kỳ tử.", "Ai mộ mến chuỗi Mân Côi, khi lâm tử sẽ được chia sản nghiệp trên Thiên Đàng.", "Đức Mẹ sẽ cứu khỏi hỏa ngục cho những ai siêng năng đọc Kinh Mân Côi.", "Những ai truyền bá chuỗi Mân Côi sẽ được Mẹ giúp đỡ trong lúc gặp khó khăn."], answer: 2 },
  { id: 12, points: 10, question: "Theo “Thủ bản về Ân xá” (ấn bản năm 1999, Ân ban số 17), những việc đạo đức nào sau đây được ban ơn tiểu xá, ngoại trừ:", choices: ["Đọc sốt sắng thánh thi Te Deum", "Sốt sắng đọc thánh thi Magnificat (“Linh hồn tôi ngợi khen Chúa…”).", "Sốt sắng đọc Kinh Truyền Tin vào buổi sáng, trưa hoặc chiều.", "Sốt sắng cầu xin cùng Đức Mẹ bằng các kinh như “Kinh Hãy Nhớ” hoặc “Kinh Lạy Nữ Vương”"], answer: 0 }
];

const DEFAULT_TEAMS: Team[] = [
  { id: 1, name: "Tổ 1 Ane", score: 0, canGuess: true },
  { id: 2, name: "Tổ 2 Marco", score: 0, canGuess: true },
  { id: 3, name: "Tổ 3 Đaminh Savio", score: 0, canGuess: true },
  { id: 4, name: "Tổ 4 Lucia", score: 0, canGuess: true },
];

// Game Constants
const ANSWER_TIME = 30; // seconds
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
    if (selectedTile) {
      handleWrongAnswer(selectedTile, currentTeamIndex);
    }
  };

  const handleStealTimeUp = () => {
    startTimer(STEAL_TIME);
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
      setTiles(prev => {
        const updated = prev.map(t =>
          t.id === tile.id ? { ...t, revealedPoints: true } : t
        );
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

    if (text.includes("đức mẹ dâng mình trong đền thờ") || text.includes("Đức Mẹ dâng mình trong đền thờ")) {
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
    if (tile.opened) {
      // Ô đã mở - hiển thị bức tranh phía sau (trong suốt)
      return "";
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
        <h1 className="text-xl font-bold mb-2 text-blue-700">ẨN HỌA THIÊN ÂN</h1>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 text-gray-800 p-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-4 text-blue-700">ẨN HỌA THIÊN ÂN</h1>

      <div className="flex flex-col md:flex-row gap-6 w-full max-w-6xl">
        {/* Game Board */}
        <div className="relative flex-1">
          <Image
            src="/bg.jpg"
            alt="Đức Mẹ"
            fill
            className="object-cover rounded-lg"
            priority
          />
          <div className="grid grid-cols-4 gap-0.5 relative z-10 p-1">
            {tiles.map(tile => {
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