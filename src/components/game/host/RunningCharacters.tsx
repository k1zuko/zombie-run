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
}

interface PlayerHealthState {
  id: string;
  player_id: string;
  room_id: string;
  health: number;
  max_health: number;
  speed: number; // Tambahkan speed
  is_being_attacked: boolean;
  last_attack_time: string;
}

interface PlayerState {
  id: string;
  health: number;
  speed: number; // Tambahkan speed
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

        if (isEliminated && !eliminatedPlayers.has(player.id)) {
          return null;
        }

        const speedOffset = (speed - 20) * 10; // Sesuaikan posisi berdasarkan kecepatan
        const charX =
          centerX -
          130 +
          i * 120 +
          speedOffset +
          Math.sin(animationTime * (gameMode === "panic" ? 1.2 : 0.4) + i) * (gameMode === "panic" ? 60 : 15);
        const charY =
          -30 +
          Math.abs(Math.sin(animationTime * (gameMode === "panic" ? 2 : 0.6) + i * 0.5)) *
          (gameMode === "panic" ? 25 : 8);

        const attackShakeIntensity = isBeingAttacked ? attackIntensity * 5 : 0;
        const attackShakeX = isBeingAttacked ? Math.sin(animationTime * 20) * attackShakeIntensity : 0;
        const attackShakeY = isBeingAttacked ? Math.sin(animationTime * 15) * attackShakeIntensity : 0;
        const attackScale = isBeingAttacked ? 1 + attackIntensity * 0.1 : 1;

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
                : "all 0.1s ease-out",
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
              <div
                className={`drop-shadow-2xl transition-all duration-100 ${
                  isZombieTarget && !isEliminated ? "animate-bounce scale-110 z-50" : ""
                }`}
                style={{
                  width: gameMode === "panic" ? 120 : 96,
                  height: gameMode === "panic" ? 120 : 96,
                  backgroundImage: `url(${workingPath})`,
                  backgroundSize: "contain",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                  imageRendering: "pixelated",
                  filter: isEliminated
                    ? "grayscale(100%) brightness(0.3) contrast(1.2)"
                    : isZombieTarget
                      ? "brightness(1.8) contrast(2) saturate(1.8) hue-rotate(15deg)"
                      : gameMode === "panic"
                        ? "brightness(1.2) contrast(1.4) saturate(1.2)"
                        : "brightness(1.1) contrast(1.2)",
                  transform: `scale(${gameMode === "panic" ? 1.8 : 1.6})`,
                }}
              />

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

              <p className="text-white font-mono text-sm mt-1 text-center">{player.nickname}</p>
              <p className="text-gray-400 font-mono text-xs">Kecepatan: {speed}</p>

              {isEliminated && (
                <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-gray-300 text-xs font-bold rounded">
                  TERELIMINASI
                </div>
              )}

              <div
                className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-20 h-4 bg-black rounded-full opacity-30 blur-md"
                style={{
                  transform: `translateX(-50%) scaleX(${0.8 + Math.sin(animationTime * 0.6) * 0.2})`,
                }}
              />

              {isZombieTarget && !isEliminated && (
              <div className="absolute -inset-2 border-2 border-red-500 rounded-full animate-pulse" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}