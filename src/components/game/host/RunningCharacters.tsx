"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Player {
  id: string;
  nickname: string;
  character_type: string;
  score: number;
  is_alive: boolean;
  joined_at: string;
  position_x: number;
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

interface PlayerState {
  id: string;
  health: number;
  speed: number;
  isBeingAttacked: boolean;
  position: number;
  lastAttackTime: number;
  attackIntensity: number;
}

interface ZombieState {
  isAttacking: boolean;
  targetPlayerId: string | null;
  attackProgress: number;
  basePosition: number;
  currentPosition: number;
}

interface RunningCharactersProps {
  players: Player[];
  playerStates: { [playerId: string]: PlayerState };
  playerHealthStates: { [playerId: string]: PlayerHealthState };
  zombieState: ZombieState;
  animationTime: number;
  gameMode: "normal" | "panic";
  centerX: number;
  getCharacterByType: (type: string) => any;
  getWorkingImagePath: (character: any) => string;
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
  const [eliminatedPlayers, setEliminatedPlayers] = useState<Set<string>>(new Set());
  const router = useRouter();
  const ZOMBIE_SPEED = 30;
  const INITIAL_OFFSET = 500; // Offset awal untuk jarak dari zombie

  useEffect(() => {
    const newEliminated = new Set<string>();
    const allPlayersEliminated = players.every((player) => {
      const playerState = playerStates[player.id];
      const healthState = playerHealthStates[player.id];
      const health = playerState?.health ?? healthState?.health ?? 3;
      const isEliminated = !player.is_alive || health <= 0;
      if (isEliminated) {
        newEliminated.add(player.id);
      }
      return isEliminated;
    });

    setEliminatedPlayers(newEliminated);

    if (allPlayersEliminated && players.length > 0) {
      const redirectTimeout = setTimeout(() => {
        router.push("/");
      }, 1000);
      return () => clearTimeout(redirectTimeout);
    }
  }, [players, playerStates, playerHealthStates, router]);

  return (
    <div className="absolute bottom-20 z-30">
      {players.slice(0, 5).map((player, i) => {
        const character = getCharacterByType(player.character_type);
        const workingPath = getWorkingImagePath(character);
        const playerState = playerStates[player.id];
        const healthState = playerHealthStates[player.id];
        const isBeingAttacked = playerState?.isBeingAttacked || false;
        const health = playerState?.health ?? healthState?.health ?? 3;
        const speed = playerState?.speed ?? healthState?.speed ?? 20;
        const attackIntensity = playerState?.attackIntensity ?? 0;
        const isZombieTarget = zombieState.targetPlayerId === player.id;
        const isEliminated = !player.is_alive || health <= 0;
        const speedDifference = Math.abs(speed - ZOMBIE_SPEED);
        const isSpeedClose = speedDifference <= 5 && !isBeingAttacked && !isEliminated;

        if (isEliminated && !eliminatedPlayers.has(player.id)) {
          return null;
        }

        // Posisi relatif terhadap zombie dengan offset awal
        const speedOffset = (speed - ZOMBIE_SPEED) * 25 + INITIAL_OFFSET; // Tambahkan offset awal
        const positionX = player.position_x || 0; // Gunakan position_x dari database
        const runSpeed = speed / 20; // Normalisasi kecepatan untuk animasi
        const charX =
          centerX -
          150 +
          i * 100 +
          speedOffset +
          positionX +
          Math.sin(animationTime * (gameMode === "panic" ? 2 * runSpeed : 0.7 * runSpeed) + i) *
            (gameMode === "panic" ? 90 : 30);
        const charY =
          -50 +
          Math.abs(
            Math.sin(animationTime * (gameMode === "panic" ? 3.5 * runSpeed : 1.2 * runSpeed) + i * 0.5)
          ) *
            (gameMode === "panic" ? 40 : 15);

        const attackShakeIntensity = isBeingAttacked ? attackIntensity * 10 : 0;
        const attackShakeX = isBeingAttacked ? Math.sin(animationTime * 35) * attackShakeIntensity : 0;
        const attackShakeY = isBeingAttacked ? Math.sin(animationTime * 30) * attackShakeIntensity : 0;
        const attackScale = isBeingAttacked ? 1 + attackIntensity * 0.25 : 1;

        return (
          <div
            key={`character-${player.id}`}
            className={`absolute transition-all duration-500 ease-out ${
              isEliminated ? "opacity-0 scale-0" : "opacity-100 scale-100"
            }`}
            style={{
              left: `${charX}px`,
              bottom: `${charY}px`,
              zIndex: isEliminated ? 25 : isZombieTarget ? 40 : 35,
              transform: `translate(${attackShakeX}px, ${attackShakeY}px) scale(${attackScale})`,
              transition: isEliminated
                ? "opacity 0.5s ease-out, transform 0.5s ease-out"
                : "all 0.08s ease-out",
            }}
            onTransitionEnd={() => {
              if (isEliminated) {
                setEliminatedPlayers((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(player.id);
                  return newSet;
                });
              }
            }}
          >
            <div className="relative flex flex-col items-center">
              {/* Indikator kedekatan kecepatan */}
              {isSpeedClose && (
                <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-red-900/95 text-white text-base font-bold rounded animate-pulse-fast border border-red-600 shadow-2xl">
                  ZOMBIE MENDEKAT!
                </div>
              )}

              <div
                className={`drop-shadow-2xl transition-all duration-100 ${
                  isZombieTarget && !isEliminated ? "animate-bounce scale-110 z-50" : ""
                }`}
                style={{
                  width: gameMode === "panic" ? 130 : 110,
                  height: gameMode === "panic" ? 130 : 110,
                  backgroundImage: `url(${workingPath})`,
                  backgroundSize: "contain",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                  imageRendering: "pixelated",
                  filter: isEliminated
                    ? "grayscale(100%) brightness(0.3) contrast(1.2)"
                    : isZombieTarget
                      ? "brightness(2) contrast(2.2) saturate(2) hue-rotate(20deg)"
                      : isSpeedClose
                        ? "brightness(1.6) contrast(1.8) saturate(1.6) hue-rotate(15deg)"
                        : gameMode === "panic"
                          ? "brightness(1.4) contrast(1.6) saturate(1.4)"
                          : "brightness(1.1) contrast(1.2)",
                  transform: `scale(${gameMode === "panic" ? 2.1 : 1.8})`,
                }}
              />

              {/* Indikator kesehatan */}
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 flex gap-1.5">
                {[...Array(3)].map((_, heartIndex) => (
                  <Heart
                    key={heartIndex}
                    className={`w-5 h-5 transition-all ${
                      heartIndex < health
                        ? isZombieTarget || isSpeedClose
                          ? "text-red-600 fill-red-600 animate-pulse-fast"
                          : "text-red-500 fill-red-500"
                        : "text-gray-600 fill-gray-600"
                    }`}
                  />
                ))}
              </div>

              {/* Nama dan kecepatan pemain */}
              <p className="text-white font-mono text-base mt-2 text-center">{player.nickname}</p>
              <p
                className={`font-mono text-sm mt-1 text-center ${
                  isSpeedClose || isZombieTarget ? "text-red-500 animate-pulse-fast" : "text-gray-400"
                }`}
              >
                Kecepatan: {speed}
              </p>

              {/* Label eliminasi */}
              {isEliminated && (
                <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-gray-900/95 text-gray-300 text-base font-bold rounded border border-gray-700 shadow-2xl">
                  TERELIMINASI
                </div>
              )}

              {/* Efek debu saat berlari */}
              <div
                className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-gray-400 rounded-full opacity-30 blur-md"
                style={{
                  transform: `translateX(-50%) scaleX(${0.8 + Math.sin(animationTime * runSpeed * 1.2) * 0.5})`,
                  opacity: 0.3 + (speed / 40) * 0.3,
                }}
              />

              {/* Efek lingkaran saat diserang atau kecepatan dekat */}
              {(isZombieTarget || isSpeedClose) && !isEliminated && (
                <div
                  className={`absolute -inset-3 border-2 ${
                    isZombieTarget ? "border-red-600" : "border-yellow-600"
                  } rounded-full animate-pulse-fast`}
                />
              )}
            </div>
          </div>
        );
      })}
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
    </div>
  );
}