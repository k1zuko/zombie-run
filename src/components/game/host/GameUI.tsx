"use client";

import { Skull } from "lucide-react";

interface Player {
  id: string;
  nickname: string;
  character_type: string;
  score: number;
  is_alive: boolean;
  joined_at: string;
}

interface PlayerHealthState {
  id: string;
  player_id: string;
  room_id: string;
  health: number;
  max_health: number;
  speed: number;
  is_being_attacked: boolean;
  last_attack_time: string;
}

interface ZombieState {
  isAttacking: boolean;
  targetPlayerId: string | null;
  attackProgress: number;
  basePosition: number;
  currentPosition: number;
}

interface GameUIProps {
  roomCode: string;
  players: Player[];
  gameMode: "normal" | "panic";
  zombieState: ZombieState;
  playerHealthStates: { [playerId: string]: PlayerHealthState };
}

export default function GameUI({
  roomCode,
  players,
  gameMode,
  zombieState,
  playerHealthStates,
}: GameUIProps) {
  const ZOMBIE_SPEED = 30;
  const deadPlayers = players.filter((p) => !p.is_alive).length;
  const alivePlayers = players.length - deadPlayers;
  const isPlayerClose = Object.values(playerHealthStates).some(
    (state) => Math.abs(state.speed - ZOMBIE_SPEED) <= 5 && !state.is_being_attacked && state.health > 0
  );

  return (
    <>
      {/* Blood-stained status panel */}
      <div className="absolute top-4 right-4 z-50 bg-black/95 text-red-100 p-4 rounded-lg text-sm font-mono border border-red-900/80 shadow-lg shadow-red-900/30">
        <div className="flex items-center gap-2 mb-3">
          <Skull className="w-5 h-5 text-red-600" />
          <span className="text-red-600 font-bold tracking-wider">DEATH STATUS</span>
        </div>
        <div className="mb-2">
          <span className="text-gray-300">Room:</span>
          <span className="ml-2 text-white font-bold">{roomCode}</span>
        </div>
        <div className="mb-2">
          <span className="text-gray-300">Survivors:</span>
          <span className="ml-2 text-green-400 font-bold">{alivePlayers}</span>
        </div>
        <div className="mb-2">
          <span className="text-gray-300">Casualties:</span>
          <span className="ml-2 text-red-600 font-bold">{deadPlayers}</span>
        </div>
        <div className="mb-2">
          <span className="text-gray-300">Mode:</span>
          <span
            className={`ml-2 font-bold ${
              gameMode === "panic" ? "text-red-600 animate-pulse" : "text-yellow-400"
            }`}
          >
            {gameMode.toUpperCase()}
          </span>
        </div>
        <div className="mb-2">
          <span className="text-gray-300">Zombie:</span>
          <span
            className={`ml-2 font-bold ${
              zombieState.isAttacking
                ? "text-red-600 animate-pulse-fast"
                : isPlayerClose
                  ? "text-yellow-500 animate-pulse"
                  : "text-gray-400"
            }`}
          >
            {zombieState.isAttacking ? "FEEDING" : isPlayerClose ? "CLOSING IN" : "HUNTING"}
          </span>
        </div>
        <div className="mt-3 pt-2 border-t border-red-900/50 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">HEALTH SYNC:</span>
            <span
              className={`font-bold ${
                Object.keys(playerHealthStates).length > 0 ? "text-red-400" : "text-gray-500"
              }`}
            >
              {Object.keys(playerHealthStates).length > 0 ? "BLOOD FLOWING" : "SYSTEM FAILURE"}
            </span>
          </div>
          {zombieState.targetPlayerId && (
            <div className="mt-1 flex justify-between items-center">
              <span className="text-gray-400">TARGET:</span>
              <span className="text-red-600 font-bold">LOCKED</span>
            </div>
          )}
        </div>
      </div>

      {/* Bloody title section */}
      <div className="absolute top-4 left-4 z-50 text-white font-mono">
        <div
          className={`text-5xl font-bold tracking-wider ${
            zombieState.isAttacking
              ? "text-red-600"
              : isPlayerClose
                ? "text-yellow-500 animate-pulse"
                : gameMode === "panic"
                  ? "text-red-500"
                  : "text-red-400"
          }`}
          style={{
            textShadow: "0 0 12px rgba(255,0,0,0.8), 0 0 24px rgba(255,0,0,0.6)",
            fontFamily: "'Creepster', cursive, sans-serif",
            letterSpacing: "3px",
            WebkitTextStroke: "1.2px #300",
            filter: "drop-shadow(0 0 6px #f00)",
          }}
        >
      
        </div>
        <div
          className={`text-base mt-2 ${
            zombieState.isAttacking
              ? "text-red-400 animate-pulse-fast"
              : isPlayerClose
                ? "text-yellow-400 animate-pulse"
                : gameMode === "panic"
                  ? "text-red-300"
                  : "text-red-200"
          }`}
          style={{
            fontFamily: "'Creepster', cursive, sans-serif",
            letterSpacing: "1.5px",
          }}
        >
          {zombieState.isAttacking
            ? "💀 THE HORDE HUNGERS! 💀"
            : isPlayerClose
              ? "☣️ ZOMBIES CLOSING IN! ☣️"
              : gameMode === "panic"
                ? "☠️ THEY ARE EVERYWHERE! ☠️"
                : "RUN OR BE EATEN!"}
        </div>

        {/* Bloody attack progress bar */}
        {zombieState.isAttacking && (
          <div className="mt-4 w-64 bg-red-900/40 rounded-full h-6 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-900 to-red-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.floor(zombieState.attackProgress * 100)}%` }}
            >
              <div className="h-full w-full bg-red-600/50 animate-pulse-fast"></div>
            </div>
            <div className="mt-2 text-center text-red-400 font-bold text-sm tracking-wider">
              FEEDING PROGRESS: {Math.floor(zombieState.attackProgress * 100)}%
            </div>
          </div>
        )}
      </div>

      {/* Blood splatter effects */}
      {(gameMode === "panic" || isPlayerClose) && (
        <>
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-40">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="absolute bg-red-900/40 rounded-full"
                style={{
                  width: `${Math.random() * 120 + 60}px`,
                  height: `${Math.random() * 120 + 60}px`,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  transform: `rotate(${Math.random() * 360}deg)`,
                  opacity: isPlayerClose ? 0.8 : 0.7,
                  filter: "blur(1.5px)",
                }}
              ></div>
            ))}
          </div>
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-40 opacity-25">
            <div
              className={`absolute top-0 left-0 w-full h-full bg-red-900 ${
                isPlayerClose ? "animate-pulse-fast" : "animate-pulse"
              }`}
            ></div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes pulse-fast {
          0%,
          100% {
            opacity: 0.9;
            border-width: 2px;
          }
          50% {
            opacity: 1;
            border-width: 4px;
          }
        }
        .animate-pulse-fast {
          animation: pulse-fast 0.3s infinite;
        }
      `}</style>
    </>
  );
}