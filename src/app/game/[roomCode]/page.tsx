"use client"

import type React from "react"
import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { useGameData, TransformedRoom, TransformedGameState, TransformedPlayer } from "@/hooks/useGameData"
import { useGameLogic } from "@/hooks/useGameLogic"
import { supabase } from "@/lib/supabase"
import LoadingScreen from "@/components/game/LoadingScreen"
import LobbyPhase from "@/components/game/LobbyPhase"
import QuizPhase from "@/components/game/QuizPhase"
import GameOverScreen from "@/components/game/GameOverScreen"

// Define interfaces
interface PlayerHealthState {
  playerId: string
  health: number
  isBeingAttacked: boolean
  lastAttackTime: number
}

// Common wrapper component for game phases
function GameWrapper({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-gray-900">{children}</div>
}

// Error state component
function ErrorState({ onRetry, error }: { onRetry: () => void; error?: string }) {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black opacity-90" />
      <div className="text-center z-10 p-6 bg-gray-800 bg-opacity-80 rounded-lg shadow-xl">
        <p className="text-gray-300 text-lg mb-4">Unable to load game data</p>
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200 transition-colors duration-200"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}

// Unknown phase component
function UnknownPhase({ phase, room, gameState }: { phase: string; room: TransformedRoom; gameState: TransformedGameState }) {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black opacity-90" />
      <div className="text-center z-10 p-6 bg-gray-800 bg-opacity-80 rounded-lg shadow-xl">
        <p className="text-gray-300 text-lg mb-4">Unrecognized game phase: {phase}</p>
        <div className="text-sm text-gray-400 mt-4">
          <p>Debug Info:</p>
          <p>Room Status: {room?.status ?? "N/A"}</p>
          <p>Current Phase: {room?.current_phase ?? "N/A"}</p>
          <p>Game State Phase: {gameState?.phase ?? "N/A"}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200 transition-colors duration-200"
        >
          Reload Page
        </button>
      </div>
    </div>
  )
}

export default function GamePage() {
  const isMountedRef = useRef(true)
  const timeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set())
  const router = useRouter()

  const params = useParams()
  const searchParams = useSearchParams()
  const roomCode = params.roomCode as string
  const nickname = searchParams.get("nickname") ?? ""

  const resumeFromMinigame = searchParams.get("resumeFromMinigame") === "true"
  const resumeHealth = parseInt(searchParams.get("health") || "3", 10)
  const resumeCorrect = parseInt(searchParams.get("correct") || "0", 10)
  const resumeCurrentIndex = parseInt(searchParams.get("currentIndex") || "0", 10)

  const { room, gameState, players, currentPlayer, isLoading, error, isSoloMode, refetch } = useGameData(
    roomCode,
    nickname,
  )

  const gameLogic = useGameLogic({
    room,
    gameState,
    players,
    currentPlayer,
  })

  const { isGameOver, showCaptureAnimation, wrongAnswers, restartGame, setIsGameOver, setShowCaptureAnimation } =
    gameLogic

  const [quizState, setQuizState] = useState({
    health: 3,
    correctAnswers: 0,
    currentIndex: 0,
    isResuming: false,
  })

  const [playerHealthStates, setPlayerHealthStates] = useState<{ [playerId: string]: PlayerHealthState }>({})
  const [isUnderAttack, setIsUnderAttack] = useState(false)
  const [attackAnimation, setAttackAnimation] = useState(false)

  const safeSetTimeout = useCallback((callback: () => void, delay: number) => {
    if (!isMountedRef.current) return null

    const timeout = setTimeout(() => {
      if (isMountedRef.current) {
        callback()
      }
      timeoutsRef.current.delete(timeout)
    }, delay)
    timeoutsRef.current.add(timeout)
    return timeout
  }, [])

  const safeSetState = useCallback((setter: () => void) => {
    if (isMountedRef.current) {
      setter()
    }
  }, [])

  // Save game completion to Supabase
  const saveGameCompletion = useCallback(async () => {
    if (!currentPlayer || !room || !isMountedRef.current) return

    try {
      const { error } = await supabase.from("game_completions").insert({
        player_id: currentPlayer.id,
        room_id: room.id,
        final_health: quizState.health,
        correct_answers: quizState.correctAnswers,
        total_questions_answered: quizState.currentIndex + 1,
        is_eliminated: quizState.health <= 0,
        completion_type: quizState.health <= 0 ? "eliminated" : "completed",
      })

      if (error) {
        console.error("Failed to save game completion:", error)
      } else {
        console.log("Game completion saved for player:", currentPlayer.nickname)
      }
    } catch (err) {
      console.error("Error saving game completion:", err)
    }
  }, [currentPlayer, room, quizState])

  // Handle resume from minigame
  useEffect(() => {
    if (resumeFromMinigame && isMountedRef.current) {
      setQuizState({
        health: resumeHealth,
        correctAnswers: resumeCorrect,
        currentIndex: resumeCurrentIndex,
        isResuming: true,
      })

      const url = new URL(window.location.href)
      url.searchParams.delete("resumeFromMinigame")
      url.searchParams.delete("health")
      url.searchParams.delete("correct")
      url.searchParams.delete("currentIndex")
      window.history.replaceState({}, "", url.toString())
    }
  }, [resumeFromMinigame, resumeHealth, resumeCorrect, resumeCurrentIndex])

  // Handle health state updates from host
  const handleHealthStateUpdate = useCallback(
    (payload: any) => {
      if (!isMountedRef.current || !payload.new) return

      const healthData = payload.new
      console.log("🩺 Received health update from host:", healthData)

      safeSetState(() => {
        setPlayerHealthStates((prev) => ({
          ...prev,
          [healthData.player_id]: {
            playerId: healthData.player_id,
            health: healthData.health,
            isBeingAttacked: healthData.is_being_attacked,
            lastAttackTime: new Date(healthData.last_attack_time).getTime(),
          },
        }))
      })

      if (currentPlayer && healthData.player_id === currentPlayer.id && healthData.is_being_attacked) {
        console.log("💀 I am being attacked by zombie!")
        triggerAttackAnimation()
        safeSetState(() => {
          setQuizState((prev) => ({
            ...prev,
            health: healthData.health,
          }))
        })
      }
    },
    [currentPlayer, safeSetState],
  )

  // Handle attack events
  const handleAttackEvent = useCallback(
    (payload: any) => {
      if (!isMountedRef.current || !payload.new || !currentPlayer) return

      const attackData = payload.new
      console.log("⚔️ Attack event received:", attackData)

      if (attackData.target_player_id === currentPlayer.id) {
        console.log("💀 Zombie attack confirmed for me!")
        triggerAttackAnimation()

        if (attackData.attack_data?.player_nickname) {
          console.log(`🧟 ${attackData.attack_data.player_nickname} was attacked for wrong answer!`)
        }
      }
    },
    [currentPlayer],
  )

  // Trigger enhanced zombie attack animation
  const triggerAttackAnimation = useCallback(() => {
    if (!isMountedRef.current) return

    console.log("🎬 Starting enhanced zombie attack animation!")
    safeSetState(() => {
      setIsUnderAttack(true)
      setAttackAnimation(true)
    })

    if (document.body) {
      document.body.classList.add("zombie-attack-shake")
      document.body.style.background = "linear-gradient(0deg, rgba(139,0,0,0.3), rgba(0,0,0,0.9))"
    }

    // Optional: Add sound effect (if supported in your environment)
    // const audio = new Audio("/sounds/zombie-growl.mp3")
    // audio.play().catch((err) => console.error("Sound error:", err))

    safeSetTimeout(() => {
      safeSetState(() => {
        setIsUnderAttack(false)
        setAttackAnimation(false)
      })

      if (document.body) {
        document.body.classList.remove("zombie-attack-shake")
        document.body.style.background = ""
      }
      console.log("✅ Zombie attack animation completed")
    }, 4000)
  }, [safeSetState, safeSetTimeout])

  // Setup realtime subscription for player health states and attacks
  useEffect(() => {
    if (!room || !currentPlayer || !isMountedRef.current) return

    console.log(`🔗 Setting up player health sync for room ${room.id}`)

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
        handleHealthStateUpdate,
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(`✅ Health channel subscribed for room ${room.id}`)
        } else {
          console.error(`❌ Health channel subscription status: ${status}`)
        }
      })

    const attackChannel = supabase
      .channel(`attacks-${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "player_attacks",
          filter: `room_id=eq.${room.id}`,
        },
        handleAttackEvent,
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(`✅ Attack channel subscribed for room ${room.id}`)
        } else {
          console.error(`❌ Attack channel subscription status: ${status}`)
        }
      })

    return () => {
      console.log("🔌 Cleaning up health subscriptions")
      supabase.removeChannel(healthChannel)
      supabase.removeChannel(attackChannel)
    }
  }, [room, currentPlayer, handleHealthStateUpdate, handleAttackEvent])

  // Sync player health with quiz state and handle game over
  useEffect(() => {
    if (!isMountedRef.current || !currentPlayer || !playerHealthStates[currentPlayer.id]) return

    const healthState = playerHealthStates[currentPlayer.id]
    safeSetState(() => {
      setQuizState((prev) => ({
        ...prev,
        health: healthState.health,
      }))
    })

    if (healthState.health <= 0 && !isGameOver) {
      safeSetState(() => {
        setIsGameOver?.(true)
        setShowCaptureAnimation?.(true)
      })
    }
  }, [playerHealthStates, currentPlayer, isGameOver, safeSetState, setIsGameOver, setShowCaptureAnimation])

  // Handle game completion and redirect
  useEffect(() => {
    if (gameState?.phase === "finished" && isMountedRef.current) {
      saveGameCompletion().then(() => {
        router.push(`/game/${roomCode}/results?nickname=${encodeURIComponent(nickname)}`)
      })
    }
  }, [gameState?.phase, roomCode, nickname, saveGameCompletion, router])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      timeoutsRef.current.forEach((timeout) => clearTimeout(timeout))
      timeoutsRef.current.clear()

      if (document.body) {
        document.body.classList.remove("zombie-attack-shake")
        document.body.style.background = ""
      }
    }
  }, [])

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!room || !gameState || error) {
    return <ErrorState onRetry={refetch} error={error || "Unknown error"} />
  }

  if (isGameOver && showCaptureAnimation && currentPlayer) {
    return (
      <GameWrapper>
        <div className={`${attackAnimation ? "animate-pulse bg-red-900/20" : ""}`}>
          <GameOverScreen />
        </div>
      </GameWrapper>
    )
  }

  const renderGamePhase = () => {
    if (quizState.isResuming && currentPlayer) {
      return (
        <QuizPhase
          room={room}
          gameState={{ ...gameState, phase: "quiz" }}
          currentPlayer={currentPlayer}
          players={players}
          gameLogic={gameLogic}
          isSoloMode={isSoloMode}
          wrongAnswers={wrongAnswers}
          resumeState={quizState}
        />
      )
    }

    if (!currentPlayer) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <p className="text-white text-xl mb-4">Player not found</p>
            <p className="text-gray-400 mb-4">Please join the game with a valid nickname</p>
            <button
              onClick={() => (window.location.href = "/")}
              className="px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200 transition-colors duration-200"
            >
              Go Home
            </button>
          </div>
        </div>
      )
    }

    console.log("Rendering phase:", gameState.phase)

    switch (gameState.phase) {
      case "lobby":
        return (
          <LobbyPhase currentPlayer={currentPlayer} players={players} gameLogic={gameLogic} isSoloMode={isSoloMode} />
        )

      case "quiz":
        return (
          <div className={`${isUnderAttack ? "animate-pulse bg-red-900/30" : ""} transition-all duration-300 relative`}>
            {isUnderAttack && (
              <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-red-900/50 to-black/80 animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-5xl md:text-7xl font-horror text-red-600 animate-zombie-text drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                    🧟 ZOMBIE ATTACK! 🧟
                  </div>
                </div>
                {/* Zombie claw marks */}
                <div className="absolute inset-0">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute bg-red-600/50 h-2 w-24 rotate-45 animate-claw"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 0.8}s`,
                      }}
                    />
                  ))}
                </div>
                {/* Blood splatter particles */}
                <div className="absolute inset-0">
                  {[...Array(15)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute bg-red-700 rounded-full animate-blood-splat"
                      style={{
                        width: `${Math.random() * 10 + 5}px`,
                        height: `${Math.random() * 10 + 5}px`,
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDuration: `${Math.random() * 1 + 0.5}s`,
                        animationDelay: `${Math.random() * 0.5}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            <QuizPhase
              room={room}
              gameState={gameState}
              currentPlayer={currentPlayer}
              players={players}
              gameLogic={gameLogic}
              isSoloMode={isSoloMode}
              wrongAnswers={wrongAnswers}
            />
          </div>
        )

      case "finished":
        return null // Handled by useEffect redirect

      default:
        return <UnknownPhase phase={gameState.phase} room={room} gameState={gameState} />
    }
  }

  return (
    <GameWrapper>
      {renderGamePhase()}
      {isUnderAttack && (
        <>
          <div className="fixed inset-0 z-40 pointer-events-none border-8 border-red-600/50 animate-pulse" />
          <div className="fixed inset-0 z-40 pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute text-red-500 font-bold text-xl md:text-2xl animate-damage"
                style={{
                  left: `${Math.random() * 90 + 5}%`,
                  top: `${Math.random() * 90 + 5}%`,
                  animationDelay: `${Math.random() * 0.6}s`,
                }}
              >
                -1 HP
              </div>
            ))}
          </div>
        </>
      )}
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }

        @keyframes zombie-text {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes claw {
          0% { transform: translateX(0) rotate(45deg); opacity: 0; }
          50% { transform: translateX(100px) rotate(45deg); opacity: 0.7; }
          100% { transform: translateX(200px) rotate(45deg); opacity: 0; }
        }

        @keyframes blood-splat {
          0% { transform: scale(0); opacity: 0.8; }
          50% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.5); opacity: 0; }
        }

        @keyframes damage {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-100px); opacity: 0; }
        }

        .zombie-attack-shake {
          animation: shake 0.5s ease-in-out 4;
        }

        .font-horror {
          font-family: 'Creepster', cursive, sans-serif;
        }

        /* Preload the font to avoid FOUT */
        @font-face {
          font-family: 'Creepster';
          src: url('https://fonts.googleapis.com/css2?family=Creepster&display=swap');
        }
      `}</style>
    </GameWrapper>
  )
}