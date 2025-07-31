"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { motion, AnimatePresence } from "framer-motion"
import PlayersPanel from "@/components/game/host/PlayersPanel"
import GameBackground from "@/components/game/host/GameBackground"
import ZombieCharacter from "@/components/game/host/ZombieCharacter"
import RunningCharacters from "@/components/game/host/RunningCharacters"
import GameUI from "@/components/game/host/GameUI"
import BackgroundEffects from "@/components/game/host/BackgroundEffects"

interface Player {
  id: string
  nickname: string
  character_type: string
  score: number
  is_alive: boolean
  joined_at: string
}

interface GameRoom {
  id: string
  room_code: string
  title: string
  status: string
  max_players: number
  current_phase: string
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

interface GameCompletion {
  id: string
  player_id: string
  room_id: string
  final_health: number
  correct_answers: number
  total_questions_answered: number
  is_eliminated: boolean
  completion_type: string
  completed_at: string
}

const characterGifs = [
  {
    src: "/images/character.gif",
    fallback: "/character/character.gif",
    rootFallback: "/character.gif",
    alt: "Green Character",
    color: "bg-green-500",
    type: "robot1",
  },
  {
    src: "/images/character1.gif",
    fallback: "/character/character1.gif",
    rootFallback: "/character1.gif",
    alt: "Blue Character",
    color: "bg-blue-500",
    type: "robot2",
  },
  {
    src: "/images/character2.gif",
    fallback: "/character/character2.gif",
    rootFallback: "/character2.gif",
    alt: "Red Character",
    color: "bg-red-500",
    type: "robot3",
  },
  {
    src: "/images/character3.gif",
    fallback: "/character/character3.gif",
    rootFallback: "/character3.gif",
    alt: "Purple Character",
    color: "bg-purple-500",
    type: "robot4",
  },
  {
    src: "/images/character4.gif",
    fallback: "/character/character4.gif",
    rootFallback: "/character4.gif",
    alt: "Orange Character",
    color: "bg-orange-500",
    type: "robot5",
  },
]

export default function HostGamePage() {
  const params = useParams()
  const roomCode = params.roomCode as string

  // Game animation states
  const [animationTime, setAnimationTime] = useState(0)
  const [gameMode, setGameMode] = useState<"normal" | "panic">("normal")
  const [isClient, setIsClient] = useState(false)
  const [screenWidth, setScreenWidth] = useState(1200)
  const [imageLoadStatus, setImageLoadStatus] = useState<{ [key: string]: boolean }>({})

  // Game data states
  const [players, setPlayers] = useState<Player[]>([])
  const [gameRoom, setGameRoom] = useState<GameRoom | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [completedPlayers, setCompletedPlayers] = useState<Player[]>([])
  const [showCompletionPopup, setShowCompletionPopup] = useState(false)

  // Enhanced player states with real-time health sync from database
  const [playerStates, setPlayerStates] = useState<{ [playerId: string]: PlayerState }>({})
  const [playerHealthStates, setPlayerHealthStates] = useState<{ [playerId: string]: PlayerHealthState }>({})

  // Zombie attack system
  const [zombieState, setZombieState] = useState<ZombieState>({
    isAttacking: false,
    targetPlayerId: null,
    attackProgress: 0,
    basePosition: 500,
    currentPosition: 500,
  })

  // Visual effects
  const [recentAttacks, setRecentAttacks] = useState<Set<string>>(new Set())
  const [backgroundFlash, setBackgroundFlash] = useState(false)

  // Get character data by type
  const getCharacterByType = (type: string) => {
    return characterGifs.find((char) => char.type === type) || characterGifs[0]
  }

  // Initialize player states with real health from database
  const initializePlayerStates = useCallback((playersData: Player[], healthData: PlayerHealthState[]) => {
    const newStates: { [playerId: string]: PlayerState } = {}
    const newHealthStates: { [playerId: string]: PlayerHealthState } = {}

    playersData.forEach((player, index) => {
      const healthState = healthData.find((h) => h.player_id === player.id)
      const currentHealth = healthState?.health ?? 3

      newStates[player.id] = {
        id: player.id,
        health: currentHealth,
        isBeingAttacked: healthState?.is_being_attacked ?? false,
        position: index,
        lastAttackTime: healthState ? new Date(healthState.last_attack_time).getTime() : 0,
        attackIntensity: 0,
      }

      if (healthState) {
        newHealthStates[player.id] = healthState
      }
    })

    setPlayerStates(newStates)
    setPlayerHealthStates(newHealthStates)
  }, [])

  // Enhanced zombie attack animation
  const handleZombieAttack = useCallback((playerId: string, newHealth: number) => {
    console.log(`🧟 Zombie attacking player ${playerId}! Health: ${newHealth}`)
    setZombieState({
      isAttacking: true,
      targetPlayerId: playerId,
      attackProgress: 0,
      basePosition: 500,
      currentPosition: 500,
    })

    setPlayerStates((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        health: newHealth,
        isBeingAttacked: true,
        lastAttackTime: Date.now(),
        attackIntensity: 0.5,
      },
    }))

    setRecentAttacks((prev) => new Set([...prev, playerId]))
    setBackgroundFlash(true)
    setGameMode("panic")

    let progress = 0
    const attackInterval = setInterval(() => {
      progress += 0.05
      setZombieState((prev) => ({
        ...prev,
        attackProgress: progress,
        currentPosition: prev.basePosition * (1 - progress * 0.8),
      }))

      if (progress >= 0.5 && progress < 0.55) {
        setBackgroundFlash(true)
        console.log("💥 Zombie hit!")
      }

      if (progress >= 1) {
        clearInterval(attackInterval)
        setZombieState({
          isAttacking: false,
          targetPlayerId: null,
          attackProgress: 0,
          basePosition: 500,
          currentPosition: 500,
        })
        setPlayerStates((prev) => ({
          ...prev,
          [playerId]: {
            ...prev[playerId],
            isBeingAttacked: false,
            attackIntensity: 0,
          },
        }))
        setRecentAttacks((prev) => {
          const newSet = new Set(prev)
          newSet.delete(playerId)
          return newSet
        })
        setBackgroundFlash(false)
        setGameMode("normal")
        console.log("✅ Zombie attack sequence completed")
      }
    }, 50)

    setTimeout(() => {
      clearInterval(attackInterval)
      setZombieState({
        isAttacking: false,
        targetPlayerId: null,
        attackProgress: 0,
        basePosition: 500,
        currentPosition: 500,
      })
      setGameMode("normal")
      setBackgroundFlash(false)
    }, 3000)
  }, [])

  // Handle correct answer
  const handleCorrectAnswer = useCallback((playerId: string) => {
    console.log(`✅ Player ${playerId} answered correctly!`)
    setPlayerStates((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        lastAttackTime: Date.now(),
      },
    }))
  }, [])

  // Fetch game room and players data
  const fetchGameData = useCallback(async () => {
    try {
      const { data: room, error: roomError } = await supabase
        .from("game_rooms")
        .select("*")
        .eq("room_code", roomCode.toUpperCase())
        .single()

      if (roomError) throw roomError
      setGameRoom(room)

      const { data: playersData, error: playersError } = await supabase
        .from("players")
        .select("*")
        .eq("room_id", room.id)
        .order("joined_at", { ascending: true })

      if (playersError) throw playersError
      setPlayers(playersData || [])

      const { data: healthData, error: healthError } = await supabase
        .from("player_health_states")
        .select("*")
        .eq("room_id", room.id)

      if (healthError) console.error("Error fetching health states:", healthError)

      const { data: completionData, error: completionError } = await supabase
        .from("game_completions")
        .select("*, players(nickname, character_type)")
        .eq("room_id", room.id)
        .eq("completion_type", "completed")

      if (completionError) console.error("Error fetching completion data:", completionError)
      else {
        const completed = completionData?.map((completion: any) => completion.players) || []
        setCompletedPlayers(completed)
        if (completed.length > 0) {
          setShowCompletionPopup(true)
        }
      }

      if (playersData && playersData.length > 0) {
        initializePlayerStates(playersData, healthData || [])
      }
    } catch (error) {
      console.error("Error fetching game data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [roomCode, initializePlayerStates])

  // Realtime subscriptions
  useEffect(() => {
    if (!gameRoom) return

    console.log(`🔗 Setting up optimized real-time subscriptions for room ${gameRoom.id}`)

    const roomChannel = supabase
      .channel(`room-${gameRoom.id}-all`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `room_id=eq.${gameRoom.id}`,
        },
        (payload) => {
          console.log("👥 Players change detected:", payload)
          fetchGameData()
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "player_health_states",
          filter: `room_id=eq.${gameRoom.id}`,
        },
        (payload) => {
          console.log("💖 Health state change detected:", payload)
          const healthState = payload.new as PlayerHealthState
          if (healthState) {
            setPlayerHealthStates((prev) => ({
              ...prev,
              [healthState.player_id]: healthState,
            }))
            setPlayerStates((prev) => ({
              ...prev,
              [healthState.player_id]: {
                ...prev[healthState.player_id],
                health: healthState.health,
                isBeingAttacked: healthState.is_being_attacked,
                lastAttackTime: new Date(healthState.last_attack_time).getTime(),
              },
            }))
            if (healthState.is_being_attacked && !zombieState.isAttacking) {
              handleZombieAttack(healthState.player_id, healthState.health)
            }
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "player_answers",
          filter: `room_id=eq.${gameRoom.id}`,
        },
        (payload) => {
          console.log("📝 New answer received:", payload)
          const answer = payload.new as any
          const player = players.find((p) => p.id === answer.player_id)
          const playerName = player?.nickname || "Unknown"
          if (answer.is_correct) {
            console.log(`✅ ${playerName} answered correctly!`)
            handleCorrectAnswer(answer.player_id)
          } else {
            console.log(`❌ ${playerName} answered wrong! Zombie will attack...`)
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "game_completions",
          filter: `room_id=eq.${gameRoom.id}`,
        },
        (payload) => {
          console.log("🏆 Game completion detected:", payload)
          const completion = payload.new as GameCompletion
          if (completion.completion_type === "completed") {
            const player = players.find((p) => p.id === completion.player_id)
            if (player) {
              setCompletedPlayers((prev) => {
                if (!prev.some((p) => p.id === player.id)) {
                  return [...prev, player]
                }
                return prev
              })
              setShowCompletionPopup(true)
            }
          }
        },
      )
      .subscribe()

    return () => {
      console.log("🔌 Cleaning up optimized subscriptions")
      supabase.removeChannel(roomChannel)
    }
  }, [gameRoom, handleZombieAttack, handleCorrectAnswer, fetchGameData, players, zombieState.isAttacking])

  // Initial data fetch
  useEffect(() => {
    if (roomCode) {
      console.log(`🎮 Initializing host page for room: ${roomCode}`)
      fetchGameData()
    }
  }, [roomCode, fetchGameData])

  // Test image loading
  useEffect(() => {
    const testAllImages = async () => {
      const status: { [key: string]: boolean } = {}
      for (const character of characterGifs) {
        const primaryWorks = await testImageLoad(character.src)
        if (primaryWorks) {
          status[character.src] = true
          continue
        }
        const fallbackWorks = await testImageLoad(character.fallback)
        if (fallbackWorks) {
          status[character.fallback] = true
          continue
        }
        const rootFallbackWorks = await testImageLoad(character.rootFallback)
        status[character.rootFallback] = rootFallbackWorks
      }
      const zombieWorks = await testImageLoad("/images/zombie.gif")
      status["/images/zombie.gif"] = zombieWorks
      setImageLoadStatus(status)
    }

    testAllImages()
  }, [])

  const testImageLoad = (src: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new window.Image()
      img.onload = () => resolve(true)
      img.onerror = () => resolve(false)
      img.src = src
    })
  }

  // Handle client-side hydration and resize
  useEffect(() => {
    setIsClient(true)
    setScreenWidth(window.innerWidth)
    const handleResize = () => setScreenWidth(window.innerWidth)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Animation timer
  useEffect(() => {
    const interval = setInterval(
      () => setAnimationTime((prev) => prev + 1),
      gameMode === "panic" ? 30 : 80,
    )
    return () => clearInterval(interval)
  }, [gameMode])

  // Helper for seamless looping
  const getLoopPosition = (speed: number, spacing: number, offset = 0) => {
    const totalDistance = screenWidth + spacing
    const position = (animationTime * speed + offset) % totalDistance
    return position > 0 ? position - spacing : totalDistance + position - spacing
  }

  // Get working image path
  const getWorkingImagePath = (character: (typeof characterGifs)[0]) => {
    if (imageLoadStatus[character.src]) return character.src
    if (imageLoadStatus[character.fallback]) return character.fallback
    if (imageLoadStatus[character.rootFallback]) return character.rootFallback
    return character.src
  }

  if (!isClient || isLoading) {
    return (
      <div className="relative w-full h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading Zombie Chase...</div>
      </div>
    )
  }

  const centerX = screenWidth / 2

  return (
    <div
      className="relative w-full h-screen bg-black overflow-hidden"
      style={{
        transform: `translate(${Math.sin(animationTime * 0.1) * (gameMode === "panic" ? 5 : 2)}px, ${Math.cos(animationTime * 0.1) * (gameMode === "panic" ? 3 : 1)}px)`,
      }}
    >
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
        playerHealthStates={playerHealthStates}
        zombieState={zombieState}
        recentAttacks={recentAttacks}
        getCharacterByType={getCharacterByType}
        getWorkingImagePath={getWorkingImagePath}
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

      {/* Completion Popup */}
<AnimatePresence>
  {showCompletionPopup && completedPlayers.length > 0 && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" // Lebih transparan (bg-black/30)
      onClick={() => setShowCompletionPopup(false)}
    >
      <motion.div
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 50 }}
        className="bg-red-900/60 border border-red-700/50 rounded-lg p-8 max-w-md w-full text-center" // Warna merah (bg-red-900/60)
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-white font-mono mb-4">Selamat Anda Lolos dari Kejaran!</h2>
        <div className="flex justify-center gap-4 mb-6">
          {completedPlayers.map((player) => {
            const character = getCharacterByType(player.character_type)
            return (
              <img
                key={player.id}
                src={getWorkingImagePath(character)}
                alt={character.alt}
                className="w-16 h-16 object-contain"
              />
            )
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
          onClick={() => setShowCompletionPopup(false)}
          className="bg-red-600 hover:bg-red-500 text-white font-mono py-2 px-4 rounded"
        >
          Tutup
        </button>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
    </div>
  )
}