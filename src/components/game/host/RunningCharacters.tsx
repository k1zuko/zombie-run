
"use client"

import { Heart } from "lucide-react"

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

interface PlayerState {
  id: string
  health: number
  isBeingAttacked: boolean
  position: number
  lastAttackTime: number
  attackIntensity: number
}

interface ZombieState {
  isAttacking: boolean
  targetPlayerId: string | null
  attackProgress: number
  basePosition: number
  currentPosition: number
}

interface RunningCharactersProps {
  players: Player[]
  playerStates: { [playerId: string]: PlayerState }
  playerHealthStates: { [playerId: string]: PlayerHealthState }
  zombieState: ZombieState
  animationTime: number
  gameMode: "normal" | "panic"
  centerX: number
  getCharacterByType: (type: string) => any
  getWorkingImagePath: (character: any) => string
}

export default function RunningCharacters({
  players,
  playerStates,
  playerHealthStates,
  zombieState,
  animationTime,
  gameMode,
  centerX,
  getCharacterByType,
  getWorkingImagePath,
}: RunningCharactersProps) {
  return (
    <div className="absolute bottom-20 z-30">
      {players.slice(0, 5).map((player, i) => {
        const character = getCharacterByType(player.character_type)
        const workingPath = getWorkingImagePath(character)
        const playerState = playerStates[player.id]
        const healthState = playerHealthStates[player.id]
        const isBeingAttacked = playerState?.isBeingAttacked || false
        const health = playerState?.health ?? healthState?.health ?? 3
        const attackIntensity = playerState?.attackIntensity ?? 0
        const isZombieTarget = zombieState.targetPlayerId === player.id
        const isEliminated = health === 0

        const healthPenalty = (3 - health) * 80
        const charX =
          centerX -
          130 +
          i * 120 -
          healthPenalty +
          Math.sin(animationTime * (gameMode === "panic" ? 1.2 : 0.4) + i) * (gameMode === "panic" ? 60 : 15)
        const charY = -30
          Math.abs(Math.sin(animationTime * (gameMode === "panic" ? 2 : 0.6) + i * 0.5)) *
          (gameMode === "panic" ? 25 : 8)

        // Attack effects
        const attackShakeIntensity = isBeingAttacked ? attackIntensity * 5 : 0
        const attackShakeX = isBeingAttacked ? Math.sin(animationTime * 20) * attackShakeIntensity : 0
        const attackShakeY = isBeingAttacked ? Math.sin(animationTime * 15) * attackShakeIntensity : 0
        const attackScale = isBeingAttacked ? 1 + attackIntensity * 0.1 : 1

        return (
          <div
            key={`character-${player.id}`}
            className="absolute transition-all duration-100"
            style={{
              left: `${charX}px`,
              bottom: `${charY}px`,
              zIndex: isEliminated ? 25 : isZombieTarget ? 40 : 35,
              transform: `translate(${attackShakeX}px, ${attackShakeY}px) scale(${attackScale})`,
            }}
          >
            <div className="relative flex flex-col items-center">
              {/* Character GIF */}
              <div
                className={`drop-shadow-2xl transition-all duration-100 ${
                  isZombieTarget ? "animate-bounce scale-110 z-50" : ""
                }`}
                style={{
                  width: gameMode === "panic" ? 120 : 96,
                  height: gameMode === "panic" ? 120 : 96,
                  backgroundImage: `url(${workingPath})`,
                  backgroundSize: "contain",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                  imageRendering: "pixelated",
                  filter:
                    isEliminated
                      ? "grayscale(100%) brightness(0.3) contrast(1.2)"
                      : isZombieTarget
                        ? "brightness(1.8) contrast(2) saturate(1.8) hue-rotate(15deg)"
                        : gameMode === "panic"
                          ? "brightness(1.2) contrast(1.4) saturate(1.2)"
                          : "brightness(1.1) contrast(1.2)",
                  transform: `scale(${gameMode === "panic" ? 1.8 : 1.6})`,
                }}
              />

              {/* Health Bar */}
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 flex gap-1">
                {[...Array(3)].map((_, heartIndex) => (
                  <Heart
                    key={heartIndex}
                    className={`w-4 h-4 transition-all ${
                      heartIndex < health
                        ? isZombieTarget
                          ? "text-red-500 fill-red-500"
                          : "text-red-500 fill-red-500"
                        : "text-gray-600 fill-gray-600"
                    }`}
                  />
                ))}
              </div>

              {/* Nickname di bawah karakter */}
              <p className="text-white font-mono text-sm mt-1 text-center">
                {player.nickname}
              </p>

              {/* Hanya tampilkan notifikasi ELIMINATED */}
              {isEliminated && (
                <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-gray-300 text-xs font-bold rounded">
                  ELIMINATED
                </div>
              )}

              {/* Shadow effect */}
              <div
                className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-20 h-4 bg-black rounded-full opacity-30 blur-md"
                style={{
                  transform: `translateX(-50%) scaleX(${0.8 + Math.sin(animationTime * 0.6) * 0.2})`,
                }}
              />

              {/* Zombie target effects (tanpa lingkaran blink) */}
              {isZombieTarget && !isEliminated && (
                <div className="absolute -inset-2 border-2 border-red-500 rounded-full animate-pulse" />
              )}

              {/* Elimination overlay */}
              {isEliminated && (
                <div className="absolute inset-0 bg-gray-800 opacity-50 rounded-full" />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
