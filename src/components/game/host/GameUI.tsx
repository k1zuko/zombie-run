"use client"

import { Activity, Skull } from "lucide-react"

interface Player {
  id: string
  nickname: string
  character_type: string
  score: number
  is_alive: boolean
  joined_at: string
}

interface PlayerHealthState {
  id: string
  player_id: string
  room_id: string
  health: number
  max_health: number
  is_being_attacked: boolean
  last_attack_time: string
}

interface ZombieState {
  isAttacking: boolean
  targetPlayerId: string | null
  attackProgress: number
  basePosition: number
  currentPosition: number
}

interface GameUIProps {
  roomCode: string
  players: Player[]
  gameMode: "normal" | "panic"
  zombieState: ZombieState
  playerHealthStates: { [playerId: string]: PlayerHealthState }
}

export default function GameUI({
  roomCode,
  players,
  gameMode,
  zombieState,
  playerHealthStates,
}: GameUIProps) {
  // Calculate dead/alive player counts
  const deadPlayers = players.filter(p => !p.is_alive).length
  const alivePlayers = players.length - deadPlayers

  return (
    <>
      {/* Blood-stained status panel */}
      <div className="absolute top-4 right-4 z-50 bg-black/95 text-red-100 p-3 rounded-lg text-xs font-mono border border-red-900/80 shadow-lg shadow-red-900/20">
        <div className="flex items-center gap-2 mb-2">
          <Skull className="w-4 h-4 text-red-500" />
          <span className="text-red-500 font-bold tracking-wider">DEATH STATUS</span>
        </div>
        <div className="mb-1">
          <span className="text-gray-300">Room:</span> 
          <span className="ml-2 text-white font-bold">{roomCode}</span>
        </div>
        <div className="mb-1">
          <span className="text-gray-300">Survivors:</span> 
          <span className="ml-2 text-green-400 font-bold">{alivePlayers}</span>
        </div>
        <div className="mb-1">
          <span className="text-gray-300">Casualties:</span> 
          <span className="ml-2 text-red-500 font-bold">{deadPlayers}</span>
        </div>
        <div className="mb-1">
          <span className="text-gray-300">Mode:</span> 
          <span className={`ml-2 font-bold ${
            gameMode === "panic" ? "text-red-500 animate-pulse" : "text-yellow-400"
          }`}>
            {gameMode.toUpperCase()}
          </span>
        </div>
        <div className="mb-1">
          <span className="text-gray-300">Zombie:</span> 
          <span className={`ml-2 font-bold ${
            zombieState.isAttacking ? "text-red-500 animate-pulse" : "text-gray-400"
          }`}>
            {zombieState.isAttacking ? "FEEDING" : "HUNTING"}
          </span>
        </div>
        <div className="mt-3 pt-2 border-t border-red-900/50 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">HEALTH SYNC:</span>
            <span className={`font-bold ${
              Object.keys(playerHealthStates).length > 0 ? "text-red-400" : "text-gray-500"
            }`}>
              {Object.keys(playerHealthStates).length > 0 ? "BLOOD FLOWING" : "SYSTEM FAILURE"}
            </span>
          </div>
          {zombieState.targetPlayerId && (
            <div className="mt-1 flex justify-between items-center">
              <span className="text-gray-400">TARGET:</span>
              <span className="text-red-400 font-bold">LOCKED</span>
            </div>
          )}
        </div>
      </div>

      {/* Bloody title section */}
      <div className="absolute top-4 left-4 z-50 text-white font-mono">
        <div
          className={`text-4xl font-bold tracking-wider ${
            zombieState.isAttacking
              ? "text-red-500"
              : gameMode === "panic"
                ? "text-red-600"
                : "text-red-400"
          }`}
          style={{
            textShadow: "0 0 10px rgba(255,0,0,0.7), 0 0 20px rgba(255,0,0,0.5)",
            fontFamily: "'Creepster', cursive, sans-serif",
            letterSpacing: "2px",
            WebkitTextStroke: "1px #300",
            filter: "drop-shadow(0 0 5px #f00)"
          }}
        >
          {/* ZOMBIE APOCALYPSE */}
        </div>
        <div
          className={`text-sm mt-1 ${
            zombieState.isAttacking
              ? "text-red-300 animate-pulse"
              : gameMode === "panic"
                ? "text-red-300"
                : "text-red-200"
          }`}
          style={{
            fontFamily: "'Creepster', cursive, sans-serif",
            letterSpacing: "1px"
          }}
        >
          {zombieState.isAttacking
            ? "💀 THE HORDE HUNGERS! 💀"
            : gameMode === "panic"
              ? "☠️ THEY ARE EVERYWHERE! ☠️"
              : "  ."}
        </div>

        {/* Bloody attack progress bar */}
        {zombieState.isAttacking && (
          <div className="mt-3 w-full bg-red-900/30 rounded-full h-4 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-800 to-red-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.floor(zombieState.attackProgress * 100)}%` }}
            >
              <div className="h-full w-full bg-red-500/50 animate-pulse"></div>
            </div>
            <div className="mt-1 text-center text-red-300 font-bold text-xs tracking-wider">
              FEEDING PROGRESS: {Math.floor(zombieState.attackProgress * 100)}%
            </div>
          </div>
        )}
      </div>

      {/* Blood splatter effects */}
      {gameMode === "panic" && (
        <>
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-40">
            {[...Array(8)].map((_, i) => (
              <div 
                key={i}
                className="absolute bg-red-900/30 rounded-full"
                style={{
                  width: `${Math.random() * 100 + 50}px`,
                  height: `${Math.random() * 100 + 50}px`,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  transform: `rotate(${Math.random() * 360}deg)`,
                  opacity: 0.7,
                  filter: "blur(1px)"
                }}
              ></div>
            ))}
          </div>
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-40 opacity-20">
            <div className="absolute top-0 left-0 w-full h-full bg-red-900 animate-pulse"></div>
          </div>
        </>
      )}
    </>
  )
}