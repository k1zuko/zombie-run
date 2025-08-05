"use client"

import { useState, useEffect } from "react"
import { Users, Skull, Zap, Play, Ghost, Bone, HeartPulse } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import SoulStatus from "./SoulStatus"
import CountdownPhase from "../CountDownPhase"
interface Player {
  id: string
  nickname: string
  isHost?: boolean
  isReady?: boolean
  health?: number
  maxHealth?: number
  score?: number
  room_id?: string
}

interface LobbyPhaseProps {
  currentPlayer: Player
  players: Player[]
  gameLogic: any
  isSoloMode: boolean
  wrongAnswers?: number
}

export default function LobbyPhase({
  currentPlayer,
  players,
  gameLogic,
  isSoloMode,
  wrongAnswers = 0,
}: LobbyPhaseProps) {
  const [flickerText, setFlickerText] = useState(true)
  const [bloodDrips, setBloodDrips] = useState<Array<{ id: number; left: number; speed: number; delay: number }>>([])
  const [atmosphereText, setAtmosphereText] = useState("Dinding-dinding berbisik tentang dosa-dosamu...")
  const [countdown, setCountdown] = useState<number | null>(null)
  const [room, setRoom] = useState<any>(null)
  const [showCountdownPhase, setShowCountdownPhase] = useState(false)

  const atmosphereTexts = [
    "Dinding-dinding berbisik tentang dosa-dosamu...",
    "Darah menetes dari langit-langit...",
    "Mereka mengawasimu...",
    "Udara berbau besi dan penyesalan...",
    "Detak jantungmu terdengar terlalu keras...",
    "Jangan menoleh ke belakang...",
    "Bayangan-bayangan lapar malam ini...",
    "Mereka hampir tiba...",
    "Kau bisa merasakannya merayap di kulitmu?",
    "Jiwamu sudah hilang...",
  ]

  // Fetch room data to get countdown info
  useEffect(() => {
    const fetchRoom = async () => {
      if (!currentPlayer.room_id) return

      try {
        console.log("🏠 LobbyPhase: Fetching room data for room_id:", currentPlayer.room_id)
        const { data, error } = await supabase.from("game_rooms").select("*").eq("id", currentPlayer.room_id).single()

        if (error) {
          console.error("❌ LobbyPhase: Error fetching room:", error)
          return
        }

        console.log("✅ LobbyPhase: Room data fetched:", data)
        setRoom(data)
      } catch (error) {
        console.error("❌ LobbyPhase: Error fetching room:", error)
      }
    }

    fetchRoom()
  }, [currentPlayer.room_id])

  // Listen for room updates (including countdown_start)
  useEffect(() => {
    if (!currentPlayer.room_id) return

    console.log("🔗 LobbyPhase: Setting up realtime subscription for room_id:", currentPlayer.room_id)

    const channel = supabase
      .channel(`lobby_${currentPlayer.room_id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_rooms",
          filter: `id=eq.${currentPlayer.room_id}`,
        },
        (payload) => {
          console.log("📡 LobbyPhase: Room update received:", payload)
          console.log("📡 LobbyPhase: New room data:", payload.new)
          setRoom(payload.new)
        },
      )
      .subscribe((status) => {
        console.log("📡 LobbyPhase: Subscription status:", status)
      })

    return () => {
      console.log("🔌 LobbyPhase: Cleaning up subscription")
      supabase.removeChannel(channel)
    }
  }, [currentPlayer.room_id])

  // Handle countdown based on room countdown_start
  useEffect(() => {
    console.log("⏰ LobbyPhase: Checking countdown_start:", room?.countdown_start)

    if (!room?.countdown_start) {
      console.log("⏰ LobbyPhase: No countdown_start, hiding countdown phase")
      setCountdown(null)
      setShowCountdownPhase(false)
      return
    }

    const countdownStart = room.countdown_start // Already a number (Unix timestamp)
    const now = Date.now()
    const elapsed = Math.floor((now - countdownStart) / 1000)
    const remaining = Math.max(0, 5 - elapsed) // 5 second countdown

    console.log("⏰ LobbyPhase: Countdown calculation:", {
      countdownStart,
      now,
      elapsed,
      remaining,
    })

    if (remaining > 0) {
      console.log("🚀 LobbyPhase: Starting countdown with", remaining, "seconds remaining")
      setCountdown(remaining)
      setShowCountdownPhase(true) // Show countdown phase when countdown starts

      const timer = setInterval(() => {
        const currentNow = Date.now()
        const currentElapsed = Math.floor((currentNow - countdownStart) / 1000)
        const currentRemaining = Math.max(0, 5 - currentElapsed)

        console.log("⏰ LobbyPhase: Countdown tick:", currentRemaining)
        setCountdown(currentRemaining)

        if (currentRemaining <= 0) {
          console.log("⏰ LobbyPhase: Countdown finished")
          clearInterval(timer)
          setCountdown(null)
          setShowCountdownPhase(false)
        }
      }, 100) // Update every 100ms for smooth countdown

      return () => clearInterval(timer)
    } else {
      console.log("⏰ LobbyPhase: Countdown already finished")
      setCountdown(null)
      setShowCountdownPhase(false)
    }
  }, [room?.countdown_start])

  // Generate blood drips
  useEffect(() => {
    const generateBlood = () => {
      const newBlood = Array.from({ length: 15 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        speed: 0.5 + Math.random() * 2,
        delay: Math.random() * 5,
      }))
      setBloodDrips(newBlood)
    }

    generateBlood()
    const bloodInterval = setInterval(() => {
      generateBlood()
    }, 8000)

    return () => clearInterval(bloodInterval)
  }, [])

  // Flicker and atmosphere text effects
  useEffect(() => {
    const flickerInterval = setInterval(
      () => {
        setFlickerText((prev) => !prev)
      },
      100 + Math.random() * 150,
    )

    const textInterval = setInterval(() => {
      setAtmosphereText(atmosphereTexts[Math.floor(Math.random() * atmosphereTexts.length)])
    }, 2500)

    return () => {
      clearInterval(flickerInterval)
      clearInterval(textInterval)
    }
  }, [])

  // Host start game function (for non-countdown start)
  const handleStartGame = async () => {
    if (!currentPlayer.isHost || !currentPlayer.room_id) return

    try {
      console.log("🎮 LobbyPhase: Host starting game...")
      // Set countdown start timestamp as Unix timestamp (milliseconds)
      const countdownStartTime = Date.now()

      const { error } = await supabase
        .from("game_rooms")
        .update({
          countdown_start: countdownStartTime,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentPlayer.room_id)

      if (error) {
        console.error("❌ LobbyPhase: Error starting countdown:", error)
        return
      }

      console.log("✅ LobbyPhase: Countdown started successfully with timestamp:", countdownStartTime)
    } catch (error) {
      console.error("❌ LobbyPhase: Error starting countdown:", error)
    }
  }

  // Handle countdown completion
  const handleCountdownComplete = () => {
    console.log("🎯 LobbyPhase: Countdown completed!")
    setShowCountdownPhase(false)
    setCountdown(null)
    // The game will automatically transition to quiz phase via the host's setTimeout
  }

  // Debug log for render decision
  console.log("🎨 LobbyPhase: Render decision:", {
    showCountdownPhase,
    countdown,
    roomCountdownStart: room?.countdown_start,
  })

  // Show countdown phase if countdown is active
  if (showCountdownPhase && countdown !== null) {
    console.log("🎬 LobbyPhase: Rendering CountdownPhase with countdown:", countdown)
    return <CountdownPhase initialCountdown={countdown} onCountdownComplete={handleCountdownComplete} />
  }

  console.log("🏠 LobbyPhase: Rendering normal lobby")

  return (
    <div className="min-h-screen bg-black relative overflow-hidden select-none">
      {/* Blood-stained background */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/5 via-black to-purple-900/5">
        {/* Blood stains */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute w-64 h-64 bg-red-900 rounded-full mix-blend-multiply blur-xl"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: 0.3 + Math.random() * 0.4,
              }}
            />
          ))}
        </div>
      </div>

      {/* Blood drips */}
      {bloodDrips.map((drip) => (
        <div
          key={drip.id}
          className="absolute top-0 w-0.5 h-20 bg-red-600/80 animate-fall"
          style={{
            left: `${drip.left}%`,
            animation: `fall ${drip.speed}s linear ${drip.delay}s infinite`,
            opacity: 0.7 + Math.random() * 0.3,
          }}
        />
      ))}

      {/* Floating skulls and bones */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute text-red-900/20 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              fontSize: `${2 + Math.random() * 3}rem`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${15 + Math.random() * 20}s`,
            }}
          >
            {Math.random() > 0.5 ? <Skull /> : <Bone />}
          </div>
        ))}
      </div>

      {/* Scratches overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJzY3JhdGNoZXMiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSI1MDAiIGhlaWdodD0iNTAwIj48cGF0aCBkPSJNMCAwTDUwMCA1MDAiIHN0cm9rZT0icmdiYSgyNTUsMCwwLDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48cGF0aCBkPSJNMCAxMDBMNTAwIDYwMCIgc3Ryb2tlPSJyZ2JhKDI1NSwwLDAsMC4wMykiIHN0cm9rZS13aWR0aD0iMSIvPjxwYXRoIGQ9Ik0wIDIwMEw1MDAgNzAwIiBzdHJva2U9InJnYmEoMjU1LDAsMCwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI3NjcmF0Y2hlcykiIG9wYWNpdHk9IjAuMyIvPjwvc3ZnPg==')] opacity-20" />

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <HeartPulse className="w-12 h-12 text-red-500 mr-4 animate-pulse" />
            <h1
              className={`text-6xl font-bold font-mono tracking-wider transition-all duration-150 ${
                flickerText ? "text-red-500 opacity-100" : "text-red-900 opacity-30"
              } drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]`}
              style={{ textShadow: "0 0 10px rgba(239, 68, 68, 0.7)" }}
            >
              RUANG TUNGGU
            </h1>
            <HeartPulse className="w-12 h-12 text-red-500 ml-4 animate-pulse" />
          </div>

          <p className="text-red-400/80 text-xl font-mono animate-pulse tracking-wider">{atmosphereText}</p>
        </div>

        {/* Players Grid */}
        <div className="max-w-5xl mx-auto mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {players.map((player) => (
              <div
                key={player.id}
                className="relative bg-black/40 border border-red-900/50 rounded-lg p-4 hover:border-red-500 transition-all duration-300 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]"
              >
                <div className="absolute -top-2 -left-2 text-red-500">
                  <Ghost className="w-5 h-5" />
                </div>

                <SoulStatus
                  player={{
                    ...player,
                    health: player.health || 3,
                    maxHealth: player.maxHealth || 3,
                    score: player.score || 0,
                  }}
                  isCurrentPlayer={player.id === currentPlayer.id}
                  variant="detailed"
                  showDetailed={true}
                />

                {player.isHost && (
                  <div className="absolute -bottom-2 -right-2 text-xs bg-red-900 text-white px-2 py-1 rounded font-mono">
                    TUAN RUMAH
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Game Controls */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center space-x-4 text-red-400 font-mono text-lg">
            <Users className="w-6 h-6" />
            <span className="tracking-wider">{players.length} JIWA TERKUTUK</span>
            <Zap className="w-6 h-6 animate-pulse" />
          </div>

          {currentPlayer.isHost && (
            <div className="space-y-4">
              <Button
                onClick={handleStartGame}
                disabled={(players.length < 2 && !isSoloMode) || countdown !== null}
                className="relative overflow-hidden bg-gradient-to-r from-red-900 to-red-700 hover:from-red-800 hover:to-red-600 text-white font-mono text-xl px-10 py-6 rounded-lg border-2 border-red-700 shadow-[0_0_30px_rgba(239,68,68,0.5)] hover:shadow-[0_0_40px_rgba(239,68,68,0.7)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <span className="relative z-10 flex items-center">
                  <Play className="w-6 h-6 mr-3" />
                  MULAI PENYIKSAAN
                </span>
                <span className="absolute inset-0 bg-red-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                <span className="absolute bottom-0 left-0 right-0 h-1 bg-red-500 animate-pulse" />
              </Button>

              {players.length < 2 && !isSoloMode && (
                <p className="text-red-400 text-sm font-mono animate-pulse tracking-wider">
                  RITUAL MEMBUTUHKAN LEBIH BANYAK KORBAN...
                </p>
              )}
            </div>
          )}

          {!currentPlayer.isHost && (
            <div className="space-y-4">
              {/* <Button
                onClick={gameLogic.toggleReady}
                disabled={countdown !== null}
                className={`relative overflow-hidden font-mono text-xl px-10 py-6 rounded-lg border-2 transition-all duration-300 group ${
                  currentPlayer.isReady
                    ? "bg-gradient-to-r from-green-900 to-green-700 hover:from-green-800 hover:to-green-600 border-green-700 text-white shadow-[0_0_30px_rgba(34,197,94,0.4)]"
                    : "bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 border-gray-700 text-white shadow-[0_0_20px_rgba(107,114,128,0.3)]"
                }`}
              >
                <span className="relative z-10">{currentPlayer.isReady ? "SIAP DISIKSA" : "BERSIAP UNTUK DERITA"}</span>
                <span className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-white" />
              </Button> */}

              <p className="text-red-400/80 text-sm font-mono tracking-wider animate-pulse">
                MENUNGGU PERINTAH KEJAM DARI TUAN RUMAH...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Corner blood splatters */}
      <div className="absolute top-0 left-0 w-64 h-64 opacity-20">
        <div className="absolute w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/70 to-transparent" />
      </div>
      <div className="absolute top-0 right-0 w-64 h-64 opacity-20">
        <div className="absolute w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/70 to-transparent" />
      </div>
      <div className="absolute bottom-0 left-0 w-64 h-64 opacity-20">
        <div className="absolute w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/70 to-transparent" />
      </div>
      <div className="absolute bottom-0 right-0 w-64 h-64 opacity-20">
        <div className="absolute w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/70 to-transparent" />
      </div>

      <style jsx global>{`
        @keyframes fall {
          to {
            transform: translateY(100vh);
          }
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }
      `}</style>
    </div>
  )
}
