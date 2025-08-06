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
      {/* Status Panel */}
      <div className="absolute top-4 right-4 z-50 bg-black/90 text-red-200 p-3 rounded-md text-xs font-mono border border-red-800/50 shadow-md">
        <div className="flex items-center gap-2 mb-2">
          <Skull className="w-4 h-4 text-red-500" />
          <span className="text-red-500 font-bold">STATUS</span>
        </div>
        <div className="grid gap-1">
          <div>
            <span className="text-gray-400">Room:</span> <span className="text-white">{roomCode}</span>
          </div>
          <div>
            <span className="text-gray-400">Survivors:</span> <span className="text-green-400">{alivePlayers}</span>
          </div>
          <div>
            <span className="text-gray-400">Casualties:</span> <span className="text-red-500">{deadPlayers}</span>
          </div>
          <div>
            <span className="text-gray-400">Mode:</span>{" "}
            <span className={gameMode === "panic" ? "text-red-500 animate-pulse" : "text-yellow-400"}>
              {gameMode.toUpperCase()}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Zombie:</span>{" "}
            <span
              className={
                zombieState.isAttacking
                  ? "text-red-500 animate-pulse"
                  : isPlayerClose
                    ? "text-yellow-400"
                    : "text-gray-400"
              }
            >
              {zombieState.isAttacking ? "FEEDING" : isPlayerClose ? "CLOSING IN" : "HUNTING"}
            </span>
          </div>
        </div>
      </div>

      {/* Title Section */}
      <div className="absolute top-4 left-4 z-50 text-white font-mono">
        <div
          className={`text-4xl font-bold tracking-wider ${
            zombieState.isAttacking
              ? "text-red-500"
              : isPlayerClose
                ? "text-yellow-400"
                : gameMode === "panic"
                  ? "text-red-400"
                  : "text-red-300"
          }`}
          style={{
            fontFamily: "'Creepster', cursive",
            textShadow: "0 0 8px rgba(255,0,0,0.6)",
          }}
        >
         
        </div>
        <div
          className={`text-sm mt-1 ${
            zombieState.isAttacking
              ? "text-red-400 animate-pulse"
              : isPlayerClose
                ? "text-yellow-300"
                : gameMode === "panic"
                  ? "text-red-300"
                  : "text-red-200"
          }`}
          style={{ fontFamily: "'Creepster', cursive" }}
        >
          {zombieState.isAttacking
            ? "WASPADA!"
            : isPlayerClose
              ? "ZOMBIE MENDEKAT"
              : gameMode === "panic"
                ? "THEY ARE EVERYWHERE!"
                : "."}
        </div>

        {/* Attack Progress Bar */}
        {zombieState.isAttacking && (
          <div className="mt-3 w-48 bg-red-900/30 rounded-full h-4 overflow-hidden">
            <div
              className="h-full bg-red-600 rounded-full transition-all duration-300"
              style={{ width: `${Math.floor(zombieState.attackProgress * 100)}%` }}
            />
            <div className="mt-1 text-center text-red-400 text-xs">
              FEEDING: {Math.floor(zombieState.attackProgress * 100)}%
            </div>
          </div>
        )}
      </div>

      {/* Subtle Blood Splatter Overlay */}
      {/* {(gameMode === "panic" || isPlayerClose) && (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-40 opacity-20">
          <div
            className={`w-full h-full bg-red-900 ${
              isPlayerClose ? "animate-pulse-fast" : "animate-pulse"
            }`}
          />
        </div>
      )} */}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        @keyframes pulse-fast {
          0%, 100% { opacity: 0.9; }
          50% { opacity: 1; }
        }
        .animate-pulse { animation: pulse 1s infinite; }
        .animate-pulse-fast { animation: pulse-fast 0.4s infinite; }
      `}</style>
    </>
  );
}