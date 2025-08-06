
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import PlayersPanel from "@/components/game/host/PlayersPanel";
import GameBackground from "@/components/game/host/GameBackground";
import ZombieCharacter from "@/components/game/host/ZombieCharacter";
import RunningCharacters from "@/components/game/host/RunningCharacters";
import GameUI from "@/components/game/host/GameUI";
import BackgroundEffects from "@/components/game/host/BackgroundEffects";

// Interfaces tetap sama seperti kode asli
interface Player {
  id: string;
  nickname: string;
  character_type: string;
  score: number;
  is_alive: boolean;
  joined_at: string;
}

interface GameRoom {
  id: string;
  room_code: string;
  title: string;
  status: string;
  max_players: number;
  current_phase: string;
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
  last_answer_time: string;
}

interface PlayerState {
  id: string;
  health: number;
  maxHealth: number;
  speed: number;
  isBeingAttacked: boolean;
  position: number;
  lastAttackTime: number;
  attackIntensity: number;
  countdown?: number;
}

interface ZombieState {
  isAttacking: boolean;
  targetPlayerId: string | null;
  attackProgress: number;
  basePosition: number;
  currentPosition: number;
}

interface GameCompletion {
  id: string;
  player_id: string;
  room_id: string;
  final_health: number;
  correct_answers: number;
  total_questions_answered: number;
  is_eliminated: boolean;
  completion_type: string;
  completed_at: string;
}

const characterGifs = [
  {
    src: "/images/character.gif",
    fallback: "/character/character.gif",
    rootFallback: "/character.gif",
    alt: "Karakter Hijau",
    color: "bg-green-500",
    type: "robot1",
  },
  {
    src: "/images/character1.gif",
    fallback: "/character/character1.gif",
    rootFallback: "/character1.gif",
    alt: "Karakter Biru",
    color: "bg-blue-500",
    type: "robot2",
  },
  {
    src: "/images/character2.gif",
    fallback: "/character/character2.gif",
    rootFallback: "/character2.gif",
    alt: "Karakter Merah",
    color: "bg-red-500",
    type: "robot3",
  },
  {
    src: "/images/character3.gif",
    fallback: "/character/character3.gif",
    rootFallback: "/character3.gif",
    alt: "Karakter Ungu",
    color: "bg-purple-500",
    type: "robot4",
  },
  {
    src: "/images/character4.gif",
    fallback: "/character/character4.gif",
    rootFallback: "/character4.gif",
    alt: "Karakter Oranye",
    color: "bg-orange-500",
    type: "robot5",
  },
];

export default function HostGamePage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = params.roomCode as string;

  const [animationTime, setAnimationTime] = useState(0);
  const [gameMode, setGameMode] = useState<"normal" | "panic">("normal");
  const [isClient, setIsClient] = useState(false);
  const [screenWidth, setScreenWidth] = useState(1200);
  const [imageLoadStatus, setImageLoadStatus] = useState<{ [key: string]: boolean }>({});
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameRoom, setGameRoom] = useState<GameRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [completedPlayers, setCompletedPlayers] = useState<Player[]>([]);
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);
  const [playerStates, setPlayerStates] = useState<{ [playerId: string]: PlayerState }>({});
  const [playerHealthStates, setPlayerHealthStates] = useState<{ [playerId: string]: PlayerHealthState }>({});
  const [zombieState, setZombieState] = useState<ZombieState>({
    isAttacking: false,
    targetPlayerId: null,
    attackProgress: 0,
    basePosition: 500,
    currentPosition: 500,
  });
  const [attackQueue, setAttackQueue] = useState<string[]>([]);
  const [recentAttacks, setRecentAttacks] = useState<Set<string>>(new Set());
  const [backgroundFlash, setBackgroundFlash] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const attackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const getCharacterByType = (type: string) => {
    return characterGifs.find((char) => char.type === type) || characterGifs[0];
  };

  const initializePlayerStates = useCallback((playersData: Player[], healthData: PlayerHealthState[]) => {
    const newStates: { [playerId: string]: PlayerState } = {};
    const newHealthStates: { [playerId: string]: PlayerHealthState } = {};

    playersData.forEach((player, index) => {
      const healthState = healthData.find((h) => h.player_id === player.id);
      const currentHealth = healthState?.health ?? 3;
      const currentMaxHealth = healthState?.max_health ?? 3;
      const currentSpeed = healthState?.speed ?? 20;
      const isBeingAttacked = healthState?.is_being_attacked ?? false;
      const lastAttackTime = healthState ? new Date(healthState.last_attack_time).getTime() : 0;

      newStates[player.id] = {
        id: player.id,
        health: currentHealth,
        maxHealth: currentMaxHealth,
        speed: currentSpeed,
        isBeingAttacked,
        position: index,
        lastAttackTime,
        attackIntensity: 0,
        countdown: currentSpeed <= 30 && !isBeingAttacked && currentHealth > 0 && player.is_alive ? 5 : undefined,
      };

      if (healthState) {
        newHealthStates[player.id] = healthState;
      }
    });

    setPlayerStates(newStates);
    setPlayerHealthStates(newHealthStates);
  }, []);

  const handleZombieAttack = useCallback((playerId: string, newHealth: number, newSpeed: number) => {
    console.log(`🧟 Memulai serangan pada pemain ${playerId}! Kesehatan: ${newHealth}, Kecepatan: ${newSpeed}`);

    const playerState = playerStates[playerId];
    const player = players.find((p) => p.id === playerId);
    if (!playerState || !player || newHealth <= 0 || !player.is_alive) {
      console.log(`⚠️ Pemain ${playerId} tidak valid untuk diserang (kesehatan: ${playerState?.health}, is_alive: ${player?.is_alive})`);
      setAttackQueue((prev) => prev.filter((id) => id !== playerId));
      return;
    }

    if (zombieState.isAttacking) {
      console.log(`⚠️ Zombie sedang menyerang ${zombieState.targetPlayerId}, menambahkan ${playerId} ke antrian`);
      setAttackQueue((prev) => {
        if (!prev.includes(playerId)) {
          return [...prev, playerId];
        }
        return prev;
      });
      return;
    }

    if (attackIntervalRef.current) {
      clearInterval(attackIntervalRef.current);
      attackIntervalRef.current = null;
    }

    setZombieState({
      isAttacking: true,
      targetPlayerId: playerId,
      attackProgress: 0,
      basePosition: 500,
      currentPosition: 500,
    });

    setPlayerStates((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        health: newHealth,
        speed: newSpeed,
        isBeingAttacked: true,
        lastAttackTime: Date.now(),
        attackIntensity: 0.5,
        countdown: undefined,
      },
    }));

    setRecentAttacks((prev) => new Set([...prev, playerId]));
    setBackgroundFlash(true);
    setGameMode("panic");

    let progress = 0;
    attackIntervalRef.current = setInterval(() => {
      progress += 0.02;
      setZombieState((prev) => ({
        ...prev,
        attackProgress: progress,
        currentPosition: prev.basePosition * (1 - progress * 0.8),
      }));

      if (progress >= 0.5 && progress < 0.52) {
        setBackgroundFlash(true);
        console.log("💥 Zombie mengenai!");
      }

      if (progress >= 1) {
        console.log(`✅ Serangan selesai untuk pemain ${playerId}`);
        if (attackIntervalRef.current) {
          clearInterval(attackIntervalRef.current);
          attackIntervalRef.current = null;
        }

        setZombieState({
          isAttacking: false,
          targetPlayerId: null,
          attackProgress: 0,
          basePosition: 500,
          currentPosition: 500,
        });

        setPlayerStates((prev) => ({
          ...prev,
          [playerId]: {
            ...prev[playerId],
            isBeingAttacked: false,
            attackIntensity: 0,
            countdown: prev[playerId].speed <= 30 && prev[playerId].health > 0 && players.find((p) => p.id === playerId)?.is_alive ? 5 : undefined,
          },
        }));

        supabase
          .from("player_health_states")
          .update({
            is_being_attacked: false,
            last_attack_time: new Date().toISOString(),
          })
          .eq("player_id", playerId)
          .eq("room_id", gameRoom?.id)
          .then(({ error }) => {
            if (error) console.error(`⚠️ Gagal mereset is_being_attacked untuk ${playerId}:`, error);
            else console.log(`✅ Status is_being_attacked untuk ${playerId} direset di Supabase`);
          });

        setBackgroundFlash(false);
        setGameMode("normal");

        setAttackQueue((prev) => {
          const nextQueue = prev.filter((id) => id !== playerId);
          if (nextQueue.length > 0) {
            const nextPlayerId = nextQueue[0];
            const nextState = playerStates[nextPlayerId];
            const nextPlayer = players.find((p) => p.id === nextPlayerId);
            if (nextState && nextState.speed <= 30 && nextState.health > 0 && nextPlayer?.is_alive) {
              console.log(`📋 Memproses antrian berikutnya: ${nextPlayerId}`);
              supabase
                .from("player_health_states")
                .update({
                  health: Math.max(0, nextState.health - 1),
                  speed: nextState.speed,
                  is_being_attacked: true,
                  last_attack_time: new Date().toISOString(),
                })
                .eq("player_id", nextPlayerId)
                .eq("room_id", gameRoom?.id)
                .then(({ error }) => {
                  if (error) {
                    console.error(`⚠️ Gagal memperbarui status kesehatan untuk ${nextPlayerId}:`, error);
                    handleZombieAttack(nextPlayerId, Math.max(0, nextState.health - 1), nextState.speed); // Fallback
                    setAttackQueue((prev) => prev.filter((id) => id !== nextPlayerId));
                    return;
                  }
                  handleZombieAttack(nextPlayerId, Math.max(0, nextState.health - 1), nextState.speed);
                });
            } else {
              console.log(`⚠️ Pemain berikutnya ${nextPlayerId} tidak memenuhi syarat (kecepatan: ${nextState?.speed}, kesehatan: ${nextState?.health}, is_alive: ${nextPlayer?.is_alive})`);
              setAttackQueue((prev) => prev.filter((id) => id !== nextPlayerId));
            }
          }
          return nextQueue;
        });
      }
    }, 50);

    setTimeout(() => {
      if (attackIntervalRef.current && zombieState.isAttacking) {
        console.log(`🛑 Timeout cadangan: Memaksa reset serangan untuk ${playerId}`);
        clearInterval(attackIntervalRef.current);
        attackIntervalRef.current = null;
        setZombieState({
          isAttacking: false,
          targetPlayerId: null,
          attackProgress: 0,
          basePosition: 500,
          currentPosition: 500,
        });
        setPlayerStates((prev) => ({
          ...prev,
          [playerId]: {
            ...prev[playerId],
            isBeingAttacked: false,
            attackIntensity: 0,
            countdown: prev[playerId].speed <= 30 && prev[playerId].health > 0 && players.find((p) => p.id === playerId)?.is_alive ? 5 : undefined,
          },
        }));
        supabase
          .from("player_health_states")
          .update({
            is_being_attacked: false,
            last_attack_time: new Date().toISOString(),
          })
          .eq("player_id", playerId)
          .eq("room_id", gameRoom?.id)
          .then(({ error }) => {
            if (error) console.error(`⚠️ Gagal mereset is_being_attacked untuk ${playerId} (timeout):`, error);
            else console.log(`✅ Status is_being_attacked untuk ${playerId} direset di Supabase (timeout)`);
          });
        setBackgroundFlash(false);
        setGameMode("normal");
        setAttackQueue((prev) => prev.filter((id) => id !== playerId));
      }
    }, 3000);
  }, [zombieState, playerStates, players, gameRoom]);

  const handleCorrectAnswer = useCallback((playerId: string, newSpeed: number) => {
    console.log(`✅ Pemain ${playerId} menjawab benar! Kecepatan: ${newSpeed}`);
    setPlayerStates((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        speed: newSpeed,
        lastAttackTime: Date.now(),
        countdown: undefined,
        isBeingAttacked: false,
      },
    }));
    setAttackQueue((prev) => prev.filter((id) => id !== playerId));
    if (attackIntervalRef.current && zombieState.targetPlayerId === playerId) {
      console.log(`🛑 Menghentikan serangan zombie karena jawaban benar dari ${playerId}`);
      clearInterval(attackIntervalRef.current);
      attackIntervalRef.current = null;
      setZombieState({
        isAttacking: false,
        targetPlayerId: null,
        attackProgress: 0,
        basePosition: 500,
        currentPosition: 500,
      });
      setBackgroundFlash(false);
      setGameMode("normal");
    }
    supabase
      .from("player_health_states")
      .update({
        speed: newSpeed,
        is_being_attacked: false,
        last_answer_time: new Date().toISOString(),
      })
      .eq("player_id", playerId)
      .eq("room_id", gameRoom?.id)
      .then(({ error }) => {
        if (error) console.error(`⚠️ Gagal memperbarui kecepatan untuk ${playerId}:`, error);
        else console.log(`✅ Kecepatan ${playerId} diperbarui ke ${newSpeed} di Supabase`);
      });
  }, [zombieState, playerStates, gameRoom]);

  const updateCountdown = useCallback(() => {
    if (!gameRoom) {
      console.log("⚠️ gameRoom kosong, lewati pembaruan countdown");
      return;
    }

    setPlayerStates((prev) => {
      const updatedStates = { ...prev };
      const newAttackQueue = [...attackQueue];

      Object.entries(updatedStates).forEach(([playerId, state]) => {
        const player = players.find((p) => p.id === playerId);
        if (!player || !state.countdown || state.isBeingAttacked || state.health <= 0 || state.speed > 30 || !player.is_alive) {
          if (state.countdown !== undefined) {
            console.log(`🚫 Menghapus countdown untuk ${playerId} karena tidak memenuhi syarat (kecepatan: ${state.speed}, kesehatan: ${state.health}, isBeingAttacked: ${state.isBeingAttacked}, is_alive: ${player?.is_alive})`);
            updatedStates[playerId] = { ...state, countdown: undefined };
            const index = newAttackQueue.indexOf(playerId);
            if (index !== -1) {
              newAttackQueue.splice(index, 1);
            }
          }
          return;
        }

        const newCountdown = state.countdown - 1;
        console.log(`⏲️ Countdown untuk ${playerId}: ${newCountdown}s`);

        if (newCountdown <= 0) {
          if (zombieState.isAttacking) {
            console.log(`⚠️ Zombie sedang menyerang ${zombieState.targetPlayerId}, menunda serangan untuk ${playerId}`);
            if (!newAttackQueue.includes(playerId)) {
              newAttackQueue.push(playerId);
            }
            updatedStates[playerId] = { ...state, countdown: 5 }; // Reset countdown
            return;
          }

          const newHealth = Math.max(0, state.health - 1);
          console.log(`🧟 Memulai serangan pada ${playerId}! Kesehatan: ${newHealth}, Kecepatan: ${state.speed}`);
          
          supabase
            .from("player_health_states")
            .update({
              health: newHealth,
              speed: state.speed,
              is_being_attacked: true,
              last_attack_time: new Date().toISOString(),
            })
            .eq("player_id", playerId)
            .eq("room_id", gameRoom.id)
            .then(({ error }) => {
              if (error) {
                console.error(`⚠️ Gagal memperbarui status kesehatan untuk ${playerId}:`, error);
                // Fallback: tetap jalankan serangan
                handleZombieAttack(playerId, newHealth, state.speed);
                return;
              }
              handleZombieAttack(playerId, newHealth, state.speed);
            });

          updatedStates[playerId] = { ...state, countdown: undefined };
          const index = newAttackQueue.indexOf(playerId);
          if (index !== -1) {
            newAttackQueue.splice(index, 1);
          }
        } else {
          updatedStates[playerId] = { ...state, countdown: newCountdown };
        }
      });

      setAttackQueue(newAttackQueue);
      return updatedStates;
    });
  }, [gameRoom, playerStates, zombieState, handleZombieAttack, attackQueue, players]);

  const checkLowSpeedPlayers = useCallback(() => {
    if (!gameRoom) {
      console.log("⚠️ gameRoom kosong, lewati pemeriksaan kecepatan rendah");
      return;
    }
    console.log("🔍 Memeriksa pemain dengan kecepatan rendah:", { playerStates, zombieState, attackQueue });

    const eligiblePlayers = Object.entries(playerStates)
      .filter(([playerId, state]) => {
        const player = players.find((p) => p.id === playerId);
        const isEligible =
          state.speed <= 30 &&
          !state.isBeingAttacked &&
          state.health > 0 &&
          player?.is_alive &&
          state.countdown === undefined;
        console.log(`Pemain ${playerId} memenuhi syarat: ${isEligible}, Kecepatan: ${state.speed}, Kesehatan: ${state.health}, is_alive: ${player?.is_alive}`);
        return isEligible;
      })
      .sort(([, stateA], [, stateB]) => stateA.speed - stateB.speed);

    if (eligiblePlayers.length === 0) {
      console.log("🚫 Tidak ada pemain yang memenuhi syarat untuk diserang");
      return;
    }

    eligiblePlayers.forEach(([playerId, state]) => {
      if (!attackQueue.includes(playerId)) {
        console.log(`📋 Menambahkan ${playerId} ke antrian serangan (Kecepatan: ${state.speed})`);
        setAttackQueue((prev) => [...prev, playerId]);
        setPlayerStates((prev) => ({
          ...prev,
          [playerId]: {
            ...prev[playerId],
            countdown: 5,
          },
        }));
      }
    });
  }, [playerStates, players, attackQueue, gameRoom]);

  const checkInactivityPenalty = useCallback(() => {
    if (!gameRoom) {
      console.log("⚠️ gameRoom kosong, lewati pemeriksaan penalti ketidakaktifan");
      return;
    }
    supabase
      .from("player_health_states")
      .select("player_id, last_answer_time, speed")
      .eq("room_id", gameRoom.id)
      .then(({ data, error }) => {
        if (error) {
          console.error("Gagal memeriksa ketidakaktifan:", error);
          return;
        }
        data.forEach(async (state) => {
          const lastAnswerTime = new Date(state.last_answer_time).getTime();
          const currentTime = Date.now();
          const timeSinceLastAnswer = (currentTime - lastAnswerTime) / 1000;
          if (timeSinceLastAnswer >= 10 && state.speed > 20) {
            const newSpeed = Math.max(20, state.speed - 10);
            console.log(`⚠️ Pemain ${state.player_id} tidak aktif selama ${timeSinceLastAnswer}s, kecepatan dikurangi ke ${newSpeed}`);
            await supabase
              .from("player_health_states")
              .update({ speed: newSpeed, last_answer_time: new Date().toISOString() })
              .eq("player_id", state.player_id)
              .eq("room_id", gameRoom.id);
            setPlayerStates((prev) => ({
              ...prev,
              [state.player_id]: {
                ...prev[state.player_id],
                speed: newSpeed,
                countdown: newSpeed <= 30 && !prev[state.player_id].isBeingAttacked && prev[state.player_id].health > 0 ? 5 : prev[state.player_id].countdown,
              },
            }));
          }
        });
      });
  }, [gameRoom]);

  const fetchGameData = useCallback(async () => {
    try {
      const { data: room, error: roomError } = await supabase
        .from("game_rooms")
        .select("*")
        .eq("room_code", roomCode.toUpperCase())
        .single();

      if (roomError) throw roomError;
      setGameRoom(room);

      if (room.current_phase === "completed") {
        console.log("🏁 Fase permainan selesai, mengalihkan ke hasil");
        router.push(`/game/${roomCode}/results`);
        return;
      }

      const { data: playersData, error: playersError } = await supabase
        .from("players")
        .select("*")
        .eq("room_id", room.id)
        .order("joined_at", { ascending: true });

      if (playersError) throw playersError;
      setPlayers(playersData || []);

      const { data: healthData, error: healthError } = await supabase
        .from("player_health_states")
        .select("*")
        .eq("room_id", room.id);

      if (healthError) {
        console.error("Gagal mengambil status kesehatan:", healthError);
        setPlayerStates({});
      } else {
        initializePlayerStates(playersData || [], healthData || []);
      }

      const { data: completionData, error: completionError } = await supabase
        .from("game_completions")
        .select("*, players(nickname, character_type)")
        .eq("room_id", room.id)
        .eq("completion_type", "completed");

      if (completionError) {
        console.error("Gagal mengambil data penyelesaian:", completionError);
      } else {
        const completed = completionData?.map((completion: any) => completion.players) || [];
        setCompletedPlayers(completed);
        if (completed.length > 0) {
          setShowCompletionPopup(true);
        }
      }

      if (playersData && completionData && playersData.length === completionData.length) {
        await supabase
          .from("game_rooms")
          .update({ current_phase: "completed" })
          .eq("id", room.id);
        console.log("🏁 Semua pemain selesai, memperbarui current_phase ke completed");
        router.push(`/game/${roomCode}/results`);
      }
    } catch (error) {
      console.error("Gagal mengambil data permainan:", error);
      setPlayers([]);
      setPlayerStates({});
    } finally {
      setIsLoading(false);
    }
  }, [roomCode, initializePlayerStates, router]);

  useEffect(() => {
    if (!gameRoom) return;

    console.log(`🔗 Menyiapkan langganan real-time untuk ruangan ${gameRoom.id}`);
    const roomChannel = supabase
      .channel(`room-${gameRoom.id}-all`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_rooms", filter: `id=eq.${gameRoom.id}` },
        (payload) => {
          console.log("🏷️ Perubahan game_rooms terdeteksi:", payload);
          const newRoom = payload.new as GameRoom;
          if (newRoom.current_phase === "completed") {
            console.log("🏁 Fase permainan selesai, mengalihkan ke hasil");
            router.push(`/game/${roomCode}/results`);
          }
          setGameRoom(newRoom);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "players", filter: `room_id=eq.${gameRoom.id}` },
        (payload) => {
          console.log("👥 Perubahan pemain terdeteksi:", payload);
          fetchGameData();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "player_health_states", filter: `room_id=eq.${gameRoom.id}` },
        (payload) => {
          console.log("💖 Perubahan status kesehatan terdeteksi:", payload);
          const healthState = payload.new as PlayerHealthState;
          if (healthState) {
            console.log(`🔄 Memperbarui status untuk ${healthState.player_id}:`, {
              health: healthState.health,
              speed: healthState.speed,
              isBeingAttacked: healthState.is_being_attacked,
            });
            setPlayerHealthStates((prev) => ({
              ...prev,
              [healthState.player_id]: healthState,
            }));
            setPlayerStates((prev) => {
              const existingState = prev[healthState.player_id] || {};
              const newState = {
                ...existingState,
                health: healthState.health,
                maxHealth: healthState.max_health,
                speed: healthState.speed,
                isBeingAttacked: healthState.is_being_attacked,
                lastAttackTime: new Date(healthState.last_attack_time).getTime(),
                countdown: healthState.speed <= 30 && !healthState.is_being_attacked && healthState.health > 0 && !existingState.isBeingAttacked ? 5 : existingState.countdown,
              };
              return {
                ...prev,
                [healthState.player_id]: newState,
              };
            });

            if (healthState.speed <= 30 && !healthState.is_being_attacked && !zombieState.isAttacking && healthState.health > 0) {
              console.log(`🧟 Menambahkan ${healthState.player_id} ke antrian serangan dari Supabase`);
              setAttackQueue((prev) => {
                if (!prev.includes(healthState.player_id)) {
                  return [...prev, healthState.player_id];
                }
                return prev;
              });
              setPlayerStates((prev) => ({
                ...prev,
                [healthState.player_id]: {
                  ...prev[healthState.player_id],
                  countdown: 5,
                },
              }));
            }
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "player_answers", filter: `room_id=eq.${gameRoom.id}` },
        (payload) => {
          console.log("📝 Jawaban baru diterima:", payload);
          const answer = payload.new as any;
          const player = players.find((p) => p.id === answer.player_id);
          const playerName = player?.nickname || "Tidak Diketahui";
          if (answer.is_correct) {
            console.log(`✅ ${playerName} menjawab benar! Kecepatan: ${answer.speed || 20}`);
            handleCorrectAnswer(answer.player_id, answer.speed || 20);
          } else {
            console.log(`❌ ${playerName} menjawab salah! Zombie akan menyerang jika kecepatan <= 30...`);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "game_completions", filter: `room_id=eq.${gameRoom.id}` },
        (payload) => {
          console.log("🏆 Penyelesaian permainan terdeteksi:", payload);
          const completion = payload.new as GameCompletion;
          if (completion.completion_type === "completed") {
            const player = players.find((p) => p.id === completion.player_id);
            if (player) {
              setCompletedPlayers((prev) => {
                if (!prev.some((p) => p.id === player.id)) {
                  return [...prev, player];
                }
                return prev;
              });
              setShowCompletionPopup(true);
            }
          }
          supabase
            .from("game_completions")
            .select("*")
            .eq("room_id", gameRoom.id)
            .then(({ data, error }) => {
              if (error) {
                console.error("Gagal memeriksa penyelesaian:", error);
                return;
              }
              if (data.length === players.length) {
                supabase
                  .from("game_rooms")
                  .update({ current_phase: "completed" })
                  .eq("id", gameRoom.id)
                  .then(({ error }) => {
                    if (error) console.error("Gagal memperbarui current_phase:", error);
                    else console.log("🏁 Semua pemain selesai, memperbarui current_phase ke completed");
                    router.push(`/game/${roomCode}/results`);
                  });
              }
            });
        }
      )
      .subscribe();

    return () => {
      console.log("🔌 Membersihkan langganan real-time");
      supabase.removeChannel(roomChannel);
    };
  }, [gameRoom, handleZombieAttack, handleCorrectAnswer, fetchGameData, players, zombieState.isAttacking, router, roomCode]);

  useEffect(() => {
    if (roomCode) {
      console.log(`🎮 Menginisialisasi halaman host untuk ruangan: ${roomCode}`);
      fetchGameData();
    }
  }, [roomCode, fetchGameData]);

  useEffect(() => {
    if (!gameRoom) return;
    const interval = setInterval(() => {
      checkLowSpeedPlayers();
      checkInactivityPenalty();
    }, 1000);

    return () => clearInterval(interval);
  }, [checkLowSpeedPlayers, checkInactivityPenalty, gameRoom]);

  useEffect(() => {
    if (!gameRoom) return;
    const interval = setInterval(() => {
      updateCountdown();
    }, 1000);

    return () => clearInterval(interval);
  }, [updateCountdown, gameRoom]);

  useEffect(() => {
    const testAllImages = async () => {
      const status: { [key: string]: boolean } = {};
      for (const character of characterGifs) {
        const primaryWorks = await testImageLoad(character.src);
        if (primaryWorks) {
          status[character.src] = true;
          continue;
        }
        const fallbackWorks = await testImageLoad(character.fallback);
        if (fallbackWorks) {
          status[character.fallback] = true;
          continue;
        }
        const rootFallbackWorks = await testImageLoad(character.rootFallback);
        status[character.rootFallback] = rootFallbackWorks;
      }
      const zombieWorks = await testImageLoad("/images/zombie.gif");
      status["/images/zombie.gif"] = zombieWorks;
      setImageLoadStatus(status);
    };
    testAllImages();
  }, []);

  const testImageLoad = (src: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  };

  useEffect(() => {
    setIsClient(true);
    setScreenWidth(window.innerWidth);
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const interval = setInterval(
      () => setAnimationTime((prev) => prev + 1),
      gameMode === "panic" ? 30 : 80
    );
    return () => clearInterval(interval);
  }, [gameMode]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRecentAttacks((prev) => {
        const newSet = new Set(prev);
        newSet.forEach((playerId) => {
          const playerState = playerStates[playerId];
          if (playerState && (Date.now() - playerState.lastAttackTime) / 1000 > 10) {
            newSet.delete(playerId);
          }
        });
        return newSet;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [playerStates]);

  useEffect(() => {
    const checkConnection = () => {
      const state = supabase.getChannels()[0]?.state || "closed";
      setIsConnected(state === "joined");
    };

    checkConnection();
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  const getLoopPosition = (speed: number, spacing: number, offset = 0) => {
    const totalDistance = screenWidth + spacing;
    const position = (animationTime * speed + offset) % totalDistance;
    return position > 0 ? position - spacing : totalDistance + position - spacing;
  };

  const getWorkingImagePath = (character: (typeof characterGifs)[0]) => {
    if (imageLoadStatus[character.src]) return character.src;
    if (imageLoadStatus[character.fallback]) return character.fallback;
    if (imageLoadStatus[character.rootFallback]) return character.rootFallback;
    return character.src;
  };

  if (!isClient || isLoading) {
    return (
      <div className="relative w-full h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Memuat Kejaran Zombie...</div>
      </div>
    );
  }

  const centerX = screenWidth / 2;

  return (
    <div
      className="relative w-full h-screen bg-black overflow-hidden"
      style={{
        transform: `translate(${Math.sin(animationTime * 0.1) * (gameMode === "panic" ? 5 : 2)}px, ${Math.cos(animationTime * 0.1) * (gameMode === "panic" ? 3 : 1)
          }px)`,
      }}
    >
      <audio src="/musics/zombies.mp3" autoPlay />
      <audio src="/musics/background-music.mp3" autoPlay loop />
      <AnimatePresence>
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 flex flex-col gap-2 max-w-[240px] max-h-[400px] overflow-y-auto">
          {Object.entries(playerStates)
            .filter(([_, state]) => state.countdown !== undefined && state.countdown > 0)
            .slice(0, 10)
            .map(([playerId, state]) => {
              const player = players.find((p) => p.id === playerId);
              if (!player) return null;
              return (
                <motion.div
                  key={`countdown-${playerId}`}
                  initial={{ opacity: 0, y: -20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="flex items-center bg-red-900/90 text-white font-mono text-sm px-3 py-2 rounded-lg shadow-lg border border-red-500/50 w-[240px] animate-pulse"
                >
                  <span className="flex-1 truncate">{player.nickname}</span>
                  <span className="ml-2 font-bold text-yellow-300">{state.countdown}s</span>
                </motion.div>
              );
            })}
        </div>
      </AnimatePresence>

      <GameBackground
        animationTime={animationTime}
        gameMode={gameMode}
        screenWidth={screenWidth}
        getLoopPosition={getLoopPosition}
      />
      <BackgroundEffects
        animationTime={animationTime}
        gameMode={gameMode}
        screenWidth={screenWidth}
        backgroundFlash={backgroundFlash}
        getLoopPosition={getLoopPosition}
      />
      <PlayersPanel
        players={players}
        gameRoom={gameRoom}
        roomCode={roomCode}
        playerStates={playerStates}
        zombieState={zombieState}
        recentAttacks={recentAttacks}
        getCharacterByType={getCharacterByType}
        getWorkingImagePath={getWorkingImagePath}
        isConnected={isConnected}
      />
      <RunningCharacters
        players={players}
        playerStates={playerStates}
        playerHealthStates={playerHealthStates}
        zombieState={zombieState}
        animationTime={animationTime}
        gameMode={gameMode}
        centerX={centerX}
        getCharacterByType={getCharacterByType}
        getWorkingImagePath={getWorkingImagePath}
      />
      <ZombieCharacter
        zombieState={zombieState}
        animationTime={animationTime}
        gameMode={gameMode}
        centerX={centerX}
      />
      <GameUI
        roomCode={roomCode}
        players={players}
        gameMode={gameMode}
        zombieState={zombieState}
        playerHealthStates={playerHealthStates}
      />

      <AnimatePresence>
        {showCompletionPopup && completedPlayers.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
            onClick={() => setShowCompletionPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              className="bg-gray-900/90 border border-red-900/50 rounded-lg p-8 max-w-md w-full text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-white font-mono mb-4">
                Selamat Anda Lolos dari Kejaran!
              </h2>
              <div className="flex justify-center gap-4 mb-6">
                {completedPlayers.map((player) => {
                  const character = getCharacterByType(player.character_type);
                  return (
                    <img
                      key={player.id}
                      src={getWorkingImagePath(character)}
                      alt={character.alt}
                      className="w-16 h-16 object-contain"
                    />
                  );
                })}
              </div>
              <div className="text-white font-mono mb-6">
                <p className="text-lg mb-2">Pemain yang Lolos:</p>
                <ul className="list-disc list-inside">
                  {completedPlayers.map((player) => (
                    <li key={player.id}>{player.nickname}</li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => {
                  setShowCompletionPopup(false);
                  router.push(`/game/${roomCode}/results`);
                }}
                className="bg-red-600 hover:bg-red-500 text-white font-mono py-2 px-4 rounded"
              >
                Lihat Hasil
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
