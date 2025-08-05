// src/components/game/GameOverScreen.tsx
"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
// import { Progress } from "@/components/ui/progress"
// import { Badge } from "@/components/ui/badge"
import { Trophy, Skull, Heart, Target, Clock, Home, RotateCcw, AlertTriangle, Zap } from "lucide-react"
import { motion, AnimatePresence, Transition } from "framer-motion"
import { HorrorCard } from "@/components/ui/horror-card"
import type { GameRoom } from "@/lib/supabase"
import Image from "next/image"

interface GameCompletion {
  id: string
  player_id: string
  final_health: number
  correct_answers: number
  total_questions_answered: number
  is_eliminated: boolean
  completion_type: string
  completed_at: string
  players: {
    nickname: string
    character_type: string
  }
}

interface PlayerStats {
  id: string
  nickname: string
  score: number
  correct_answers: number
  is_alive: boolean
  rank: number
}

interface RoomStats {
  total_players: number
  alive_players: number
  total_attacks: number
  recent_attacks: number
  average_health: number
}

interface GameActivity {
  activity_type: string
  player_nickname: string
  activity_data: {
    correct_answers?: number
    final_health?: number
    is_eliminated?: boolean
    completion_type?: string
    damage?: number
    attack_type?: string
    attack_data?: {
      question_index?: number
      answer?: string
      player_nickname?: string
      damage_dealt?: number
    }
  }
  activity_time: string
}

const characterGifs = [
  '/character.gif',
  '/character1.gif',
  '/character2.gif',
  '/character3.gif',
  '/character4.gif'
]

export default function GameOverScreen() {
  const params = useParams()
  const searchParams = useSearchParams()
  const roomCode = params.roomCode as string

  const [gameCompletions, setGameCompletions] = useState<GameCompletion[]>([])
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([])
  const [roomStats, setRoomStats] = useState<RoomStats | null>(null)
  const [recentActivities, setRecentActivities] = useState<GameActivity[]>([])
  const [room, setRoom] = useState<GameRoom | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [playerData, setPlayerData] = useState<{
    health: number
    correct: number
    total: number
    eliminated: boolean
    perfect: boolean
    nickname: string
  } | null>(null)

  const isMountedRef = useRef(true)
  const channelsRef = useRef<any[]>([])

  const initializePlayerData = useCallback(() => {
    console.log("Initializing player data...");
    try {
      const health = parseInt(searchParams.get("health") || "3", 10)
      const correct = parseInt(searchParams.get("correct") || "0", 10)
      const total = parseInt(searchParams.get("total") || "10", 10)
      const eliminated = searchParams.get("eliminated") === "true"
      let nickname = decodeURIComponent(searchParams.get("nickname") || "Unknown")

      if (isNaN(health) || isNaN(correct) || isNaN(total)) {
        console.warn("Invalid URL parameters: using fallback values", {
          health: searchParams.get("health"),
          correct: searchParams.get("correct"),
          total: searchParams.get("total"),
        })
        setError("Invalid URL parameters, using default values")
        setPlayerData({
          health: 3,
          correct: 0,
          total: 10,
          eliminated: false,
          perfect: false,
          nickname: "Unknown"
        })
        return
      }

      if (!nickname || nickname === "null") {
        console.warn("Invalid nickname, using default")
        nickname = "Unknown"
      }

      const perfect = correct === total && total > 0

      setPlayerData({
        health,
        correct,
        total,
        eliminated,
        perfect,
        nickname
      })
      console.log("Player data set:", { health, correct, total, eliminated, perfect, nickname })
    } catch (err: any) {
      console.error("Error initializing player data:", err.message)
      setError("Failed to load player data from URL, using default values")
      setPlayerData({
        health: 3,
        correct: 0,
        total: 10,
        eliminated: false,
        perfect: false,
        nickname: "Unknown"
      })
    }
  }, [searchParams])

  const fetchInitialData = useCallback(async () => {
    console.log("Starting fetchInitialData for roomCode:", roomCode)
    if (!roomCode) {
      console.error("Invalid roomCode")
      setError("Invalid room code")
      setIsLoading(false)
      return
    }

    try {
      setError(null)
      console.log("Fetching room data...")

      initializePlayerData()

      const { data: roomData, error: roomError } = await supabase
        .from("game_rooms")
        .select("*")
        .eq("room_code", roomCode)
        .single()

      if (roomError || !roomData) {
        console.error("Room fetch error:", roomError?.message)
        setError(`Room not found: ${roomError?.message || "Invalid room"}`)
        setIsLoading(false)
        return
      }

      console.log("Room data fetched:", roomData)
      setRoom(roomData)

      const [
        { data: completionsData, error: completionsError },
        { data: leaderboardData, error: leaderboardError },
        { data: battleStatsData, error: battleStatsError },
        { data: activityData, error: activityError }
      ] = await Promise.all([
        supabase
          .from("game_completions")
          .select(`
            *,
            players!inner(nickname, character_type)
          `)
          .eq("room_id", roomData.id)
          .order("completed_at", { ascending: false }),
        supabase.rpc("get_room_leaderboard", { p_room_id: roomData.id }),
        supabase.rpc("get_room_battle_stats", { p_room_id: roomData.id }),
        supabase.rpc("get_recent_game_activity", { p_room_id: roomData.id, p_limit: 10 })
      ])

      if (completionsError) {
        console.warn("Error fetching game completions:", completionsError.message)
        setGameCompletions([])
      } else {
        const formattedCompletions = completionsData.map((completion: any) => ({
          ...completion,
          players: {
            nickname: completion.players?.nickname || "Unknown",
            character_type: completion.players?.character_type || "default",
          },
        }))
        setGameCompletions(formattedCompletions)
        console.log("Game completions set:", formattedCompletions)
      }

      if (leaderboardError) {
        console.warn("Error fetching leaderboard:", leaderboardError.message)
        setPlayerStats([])
      } else if (leaderboardData) {
        setPlayerStats(leaderboardData)
        console.log("Player stats set:", leaderboardData)
      }

      if (battleStatsError) {
        console.warn("Error fetching battle stats:", battleStatsError.message)
        setRoomStats(null)
      } else {
        setRoomStats(battleStatsData[0] || null)
        console.log("Room stats set:", battleStatsData[0])
      }

      if (activityError) {
        console.warn("Error fetching recent activities:", activityError.message)
        setRecentActivities([])
      } else {
        setRecentActivities(activityData)
        console.log("Recent activities set:", activityData)
      }
    } catch (err: any) {
      console.error("Fetch initial data error:", err.message)
      setError(err.message || "Failed to load additional data, showing partial results")
    } finally {
      if (isMountedRef.current) {
        console.log("Setting isLoading to false")
        setIsLoading(false)
      }
    }
  }, [roomCode, initializePlayerData])

  const setupRealtimeSubscriptions = useCallback(() => {
    if (!room || !isMountedRef.current) return () => {}

    console.log("Setting up realtime subscriptions for room:", room.id)
    const completionsChannel = supabase
      .channel(`completions-${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_completions",
          filter: `room_id=eq.${room.id}`,
        },
        async () => {
          if (!isMountedRef.current) return
          const { data: completionsData, error } = await supabase
            .from("game_completions")
            .select(`
              *,
              players!inner(nickname, character_type)
            `)
            .eq("room_id", room.id)
            .order("completed_at", { ascending: false })

          if (!error && completionsData && isMountedRef.current) {
            const formattedCompletions = completionsData.map((completion: any) => ({
              ...completion,
              players: {
                nickname: completion.players?.nickname || "Unknown",
                character_type: completion.players?.character_type || "default",
              },
            }))
            setGameCompletions(formattedCompletions)
            console.log("Realtime update: game completions", formattedCompletions)
          } else if (error) {
            console.warn("Realtime completions error:", error.message)
          }
        },
      )
      .subscribe()

    const playersChannel = supabase
      .channel(`players-${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `room_id=eq.${room.id}`,
        },
        async () => {
          if (!isMountedRef.current) return
          const { data: leaderboardData, error } = await supabase.rpc("get_room_leaderboard", {
            p_room_id: room.id,
          })

          if (!error && leaderboardData && isMountedRef.current) {
            setPlayerStats(leaderboardData)
            console.log("Realtime update: player stats", leaderboardData)
          } else if (error) {
            console.warn("Realtime leaderboard error:", error.message)
          }
        },
      )
      .subscribe()

    const healthChannel = supabase
      .channel(`health-${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "player_health_states",
          filter: `room_id=eq.${room.id}`,
        },
        async () => {
          if (!isMountedRef.current) return
          const { data: battleStatsData, error } = await supabase.rpc("get_room_battle_stats", {
            p_room_id: room.id,
          })

          if (!error && battleStatsData && isMountedRef.current) {
            setRoomStats(battleStatsData[0] || null)
            console.log("Realtime update: room stats", battleStatsData[0])
          } else if (error) {
            console.warn("Realtime battle stats error:", error.message)
          }
        },
      )
      .subscribe()

    const activityChannel = supabase
      .channel(`activity-${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "player_answers",
          filter: `room_id=eq.${room.id}`,
        },
        async () => {
          if (!isMountedRef.current) return
          const { data: activityData, error } = await supabase.rpc("get_recent_game_activity", {
            p_room_id: room.id,
            p_limit: 10,
          })

          if (!error && activityData && isMountedRef.current) {
            setRecentActivities(activityData)
            console.log("Realtime update: recent activities", activityData)
          } else if (error) {
            console.warn("Realtime activities error:", error.message)
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "player_attacks",
          filter: `room_id=eq.${room.id}`,
        },
        async () => {
          if (!isMountedRef.current) return
          const { data: activityData, error } = await supabase.rpc("get_recent_game_activity", {
            p_room_id: room.id,
            p_limit: 10,
          })

          if (!error && activityData && isMountedRef.current) {
            setRecentActivities(activityData)
            console.log("Realtime update: recent attacks", activityData)
          } else if (error) {
            console.warn("Realtime attacks error:", error.message)
          }
        },
      )
      .subscribe()

    channelsRef.current = [completionsChannel, playersChannel, healthChannel, activityChannel]

    return () => {
      console.log("Cleaning up realtime subscriptions")
      channelsRef.current.forEach((channel) => {
        supabase.removeChannel(channel)
      })
      channelsRef.current = []
    }
  }, [room])

  useEffect(() => {
    console.log("Triggering fetchInitialData")
    fetchInitialData()

    const timeout = setTimeout(() => {
      if (isMountedRef.current && isLoading) {
        console.warn("Loading timeout reached, forcing render")
        setIsLoading(false)
        if (!playerData) {
          console.error("Player data still null after timeout")
          setError("Loading took too long, showing partial results from URL")
        }
      }
    }, 3000)

    return () => clearTimeout(timeout)
  }, [fetchInitialData])

  useEffect(() => {
    if (room) {
      const cleanup = setupRealtimeSubscriptions()
      return cleanup
    }
  }, [room, setupRealtimeSubscriptions])

  useEffect(() => {
    return () => {
      console.log("Component unmounting")
      isMountedRef.current = false
      channelsRef.current.forEach((channel) => {
        supabase.removeChannel(channel)
      })
    }
  }, [])

  const getPlayerRank = () => {
    if (!playerData || gameCompletions.length === 0) return 1

    const sortedCompletions = [...gameCompletions].sort((a, b) => {
      if (a.correct_answers !== b.correct_answers) {
        return b.correct_answers - a.correct_answers
      }
      return b.final_health - a.final_health
    })

    const playerCompletion = sortedCompletions.find(
      (c) => c.correct_answers === playerData.correct && c.final_health === playerData.health,
    )

    return playerCompletion ? sortedCompletions.indexOf(playerCompletion) + 1 : 1
  }

  const getPerformanceTitle = () => {
    if (!playerData) return "LOST SOUL"
    const accuracy = playerData.total > 0 ? (playerData.correct / playerData.total) * 100 : 0

    if (playerData.perfect) return "MASTER SURVIVOR"
    if (accuracy >= 90) return "NIGHTMARE SLAYER"
    if (accuracy >= 80) return "DARKNESS HUNTER"
    if (accuracy >= 70) return "BLOODIED WARRIOR"
    if (accuracy >= 60) return "FEAR FIGHTER"
    if (accuracy >= 50) return "WOUNDED VICTIM"
    if (accuracy >= 40) return "SHATTERED SOUL"
    if (accuracy >= 30) return "WANDERING IN AGONY"
    if (accuracy >= 20) return "BEGGING FOR MERCY"
    return "PATHETIC PREY"
  }

  const getPerformanceMessage = () => {
    if (!playerData) return "Your soul vanished into the darkness... no trace remains..."
    const accuracy = playerData.total > 0 ? (playerData.correct / playerData.total) * 100 : 0

    if (playerData.perfect) return "You performed flawlessly!"
    if (playerData.eliminated) return "The creatures of the night claimed you... your screams echo in the void..."
    if (accuracy >= 90) return "You were absolutely phenomenal!"
    if (accuracy >= 70) return "You fought bravely!"
    if (accuracy >= 60) return "Your spirit clings to the shadows... try again."
    if (accuracy >= 50) return "Your spirit clings to the shadows... try again."
    if (accuracy >= 40) return "Your spirit clings to the shadows... try again."
    if (accuracy >= 30) return "Your spirit clings to the shadows... try again."
    if (accuracy >= 20) return "Your spirit clings to the shadows... try again."
    return "You were mere prey. The darkness consumed you effortlessly..."
  }

  const getActivityMessage = (activity: GameActivity) => {
    if (activity.activity_type === "completion") {
      const { correct_answers, final_health, is_eliminated, completion_type } = activity.activity_data
      if (is_eliminated) {
        return `${activity.player_nickname} Perished (${correct_answers}/${playerData?.total || 10} correct)`
      }
      if (completion_type === "completed") {
        return `${activity.player_nickname} Survived! (${correct_answers}/${playerData?.total || 10} correct, ${final_health} HP)`
      }
      return `${activity.player_nickname} Finished... (${correct_answers}/${playerData?.total || 10} correct, ${final_health} HP)`
    }
    if (activity.activity_type === "attack") {
      const { attack_type, attack_data, damage } = activity.activity_data
      if (attack_type === "wrong_answer") {
        return `${activity.player_nickname} was attacked by zombies for a wrong answer on question ${attack_data?.question_index! + 1}! (-${damage} HP)`
      }
      return `${activity.player_nickname} suffered a ${attack_type} attack! (-${damage} HP)`
    }
    return `${activity.player_nickname} WAS ATTACKED`
  }

  const getRandomCharacterGif = () => {
    return characterGifs[Math.floor(Math.random() * characterGifs.length)]
  }

  if (isLoading || !playerData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/tombstone.png')] bg-no-repeat bg-center bg-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-red-900/10 via-black to-purple-900/10" />
        <div className="text-center z-10">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-white font-mono text-xl mb-4 tracking-widest">VOID SCREAMS IN AGONY</p>
          <p className="text-red-400 font-mono text-sm mb-6">{error || "Game data not found"}</p>
          <Button 
            onClick={fetchInitialData} 
            className="bg-red-900 hover:bg-red-800 text-white font-mono border border-red-700"
          >
            SUMMON THE SPIRITS
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/images/dark-clouds.png')] opacity-30" />
      <div className="absolute inset-0 bg-[url('/images/fog-texture1.png')] opacity-15 animate-pulse" />
      <div className="absolute inset-0 bg-gradient-to-b from-red-900/10 via-black to-purple-900/10" />
      
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-red-900 rounded-full opacity-10 blur-xl" />
        <div className="absolute top-1/3 right-20 w-24 h-24 bg-red-900 rounded-full opacity-10 blur-xl" />
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-red-900 rounded-full opacity-10 blur-xl" />
        <div className="absolute bottom-1/3 right-1/4 w-20 h-20 bg-red-900 rounded-full opacity-10 blur-xl" />
      </div>

      <div className="absolute top-20 left-10 opacity-20">
        <Image src="/images/tombstone.png" width={80} height={80} alt="Tombstone" />
      </div>
      <div className="absolute top-1/3 right-10 opacity-20">
        <Image src="/images/dead-tree.png" width={120} height={120} alt="Dead tree" />
      </div>
      <div className="absolute bottom-20 left-20 opacity-20">
        <Image src="/images/spooky-tree-2.png" width={100} height={100} alt="Spooky tree" />
      </div>

      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 bg-red-900/50 rounded-full"
            initial={{
              x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1000),
              y: Math.random() * (typeof window !== "undefined" ? window.innerHeight : 1000),
              opacity: 0,
            }}
            animate={{
              y: -100,
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              repeatType: "loop",
              delay: Math.random() * 5,
            } as Transition}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center justify-center mb-6">
            <Skull className="w-8 h-8 text-red-500 mr-3 animate-pulse" />
            <h1 className="text-5xl font-bold text-white font-horror tracking-wider text-red-600 drop-shadow-[0_0_8px_rgba(255,0,0,0.7)]">
              NIGHTMARE REPORT
            </h1>
            <Skull className="w-8 h-8 text-red-500 ml-3 animate-pulse" />
          </div>
          <p className="text-gray-400 font-mono tracking-widest text-sm">Room code: {roomCode}</p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-6"
          >
            <p className="text-red-400 font-mono text-sm">{error}</p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <HorrorCard variant="blood" glowing animated className="max-w-2xl mx-auto mb-8">
            <div className="p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 left-1/4 w-1 h-16 bg-red-900/70" />
              <div className="absolute top-0 right-1/3 w-1 h-10 bg-red-900/70" />
              
              <div className="relative z-10">
                <h2 className="text-3xl font-bold text-white mb-2 font-horror tracking-wider text-red-500">
                  {getPerformanceTitle()}
                </h2>
                
                <p className="text-gray-300 mb-6 italic font-mono text-sm">
                  {getPerformanceMessage()}
                </p>

                <div className="mb-6 flex justify-center">
                  <Image 
                    src={getRandomCharacterGif()} 
                    width={120} 
                    height={120} 
                    alt="Character" 
                    className="rounded-full border-2 border-red-900"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-900/70 rounded-lg p-4 border border-red-900/50">
                    <Target className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white font-mono">{playerData.correct}</div>
                    <div className="text-xs text-gray-400 tracking-widest">CORRECT</div>
                  </div>

                  <div className="bg-gray-900/70 rounded-lg p-4 border border-red-900/50">
                    <Heart className="w-6 h-6 text-red-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white font-mono">{playerData.health}</div>
                    <div className="text-xs text-gray-400 tracking-widest">HEALTH</div>
                  </div>

                  <div className="bg-gray-900/70 rounded-lg p-4 border border-red-900/50">
                    <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white font-mono">#{getPlayerRank()}</div>
                    <div className="text-xs text-gray-400 tracking-widest">RANK</div>
                  </div>

                  <div className="bg-gray-900/70 rounded-lg p-4 border border-red-900/50">
                    <Zap className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white font-mono">
                      {playerData.total > 0 ? Math.round((playerData.correct / playerData.total) * 100) : 0}%
                    </div>
                    <div className="text-xs text-gray-400 tracking-widest">ACCURACY</div>
                  </div>
                </div>
              </div>
            </div>
          </HorrorCard>
        </motion.div>

        {roomStats && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <HorrorCard variant="shadow" className="max-w-4xl mx-auto mb-8">
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-4 font-horror tracking-wider flex items-center">
                  <Skull className="w-5 h-5 mr-2 text-red-500" />
                  ROOM STATS
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                    <div className="text-2xl font-bold text-blue-400 font-mono">{roomStats.total_players}</div>
                    <div className="text-xs text-gray-400 tracking-widest">PLAYERS JOINED</div>
                  </div>

                  <div className="text-center bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                    <div className="text-2xl font-bold text-green-400 font-mono">{roomStats.alive_players}</div>
                    <div className="text-xs text-gray-400 tracking-widest">SURVIVORS</div>
                  </div>

                  <div className="text-center bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                    <div className="text-2xl font-bold text-red-400 font-mono">{roomStats.total_attacks}</div>
                    <div className="text-xs text-gray-400 tracking-widest">ATTACKS DEALT</div>
                  </div>

                  <div className="text-center bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                    <div className="text-2xl font-bold text-yellow-400 font-mono">{roomStats.recent_attacks}</div>
                    <div className="text-xs text-gray-400 tracking-widest">RECENT ATTACKS</div>
                  </div>

                  <div className="text-center bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                    <div className="text-2xl font-bold text-purple-400 font-mono">{roomStats.average_health.toFixed(1)}</div>
                    <div className="text-xs text-gray-400 tracking-widest">AVG PLAYER HEALTH</div>
                  </div>
                </div>
              </div>
            </HorrorCard>
          </motion.div>
        )}

        {playerStats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <HorrorCard variant="curse" glowing className="max-w-4xl mx-auto mb-8">
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-4 font-horror tracking-wider flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                  LEADERBOARD
                </h3>

                <div className="space-y-2">
                  <AnimatePresence>
                    {playerStats.slice(0, 10).map((player, index) => (
                      <motion.div
                        key={player.id}
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          index === 0
                            ? "bg-yellow-900/20 border-yellow-800"
                            : index === 1
                              ? "bg-gray-800/20 border-gray-700"
                              : index === 2
                                ? "bg-orange-900/20 border-orange-800"
                                : "bg-gray-900/50 border-gray-800"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              index === 0
                                ? "bg-yellow-600 text-white"
                                : index === 1
                                  ? "bg-gray-600 text-white"
                                  : index === 2
                                    ? "bg-orange-600 text-white"
                                    : "bg-gray-700 text-gray-300"
                            }`}
                          >
                            {index + 1}
                          </div>

                          <div>
                            <div className="text-white font-mono tracking-wider">{player.nickname}</div>
                            <div className="text-xs text-gray-400">
                              {player.correct_answers} correct • {player.is_alive ? "🩸 ALIVE" : "💀 DEAD"}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-lg font-bold text-white font-mono">{player.score}</div>
                          <div className="text-xs text-gray-400 tracking-widest">SOUL POINTS</div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </HorrorCard>
          </motion.div>
        )}

        {recentActivities.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <HorrorCard variant="dark" className="max-w-4xl mx-auto mb-8">
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-4 font-horror tracking-wider flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-purple-400" />
                  RECENT ACTIVITY
                </h3>

                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                  <AnimatePresence>
                    {recentActivities.map((activity, index) => (
                      <motion.div
                        key={`${activity.activity_type}-${activity.activity_time}-${index}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="flex items-center justify-between p-3 bg-gray-900/30 rounded-lg border border-gray-800"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              activity.activity_type === "completion"
                                ? activity.activity_data.is_eliminated
                                  ? "bg-red-500"
                                  : "bg-green-500"
                                : "bg-yellow-500"
                            } animate-pulse`}
                          />
                          <div>
                            <div className="text-white font-mono text-sm tracking-wider">
                              {getActivityMessage(activity)}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(activity.activity_time).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>

                        <div className="text-right text-xs text-gray-400">
                          {activity.activity_type === "completion" ? (
                            <span>❤️ {activity.activity_data.final_health} HP</span>
                          ) : (
                            <span>⚔️ {activity.activity_data.damage} DMG</span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </HorrorCard>
          </motion.div>
        )}

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
        >
          <Button
            onClick={() => (window.location.href = "/")}
            className="bg-gray-900 hover:bg-gray-800 text-white font-mono tracking-wider flex items-center justify-center border border-gray-700"
          >
            <Home className="w-4 h-4 mr-2" />
            RETURN TO SAFETY
          </Button>

          <Button
            onClick={() =>
              (window.location.href = `/game/${roomCode}?nickname=Survivor${Math.floor(Math.random() * 1000)}`)
            }
            className="bg-red-900 hover:bg-red-800 text-white font-mono tracking-wider flex items-center justify-center border border-red-700"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            FACE THE HORROR AGAIN
          </Button>
        </motion.div>

        <motion.div 
          className="mt-12 text-center text-gray-500 text-xs font-mono tracking-widest"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          <p>THE NIGHT NEVER ENDS...</p>
          <p className="mt-1">YOUR SCREAMS WILL BE REMEMBERED</p>
        </motion.div>
      </div>
    </div>
  )
}