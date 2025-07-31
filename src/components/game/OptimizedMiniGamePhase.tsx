"use client"

import React, { useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, Target, Shield } from "lucide-react"
import GameControls from "./GameControls"
import { GameBackground, GameProgressBar } from "./OptimizedComponents"
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor"
import type { GameState, Player,SafeZone } from "@/lib/supabase"

interface MinigamePhaseProps {
  gameState: GameState
  currentPlayer: Player
  players: Player[]
  gameLogic: any
}

const characterEmojis = {
  robot1: "👻",
  robot2: "🧟",
  robot3: "💀",
  robot4: "🎃",
} as const

const MinigamePhase = React.memo(function MinigamePhase({
  gameState,
  currentPlayer,
  players,
  gameLogic,
}: MinigamePhaseProps) {
  usePerformanceMonitor("MinigamePhase")

  const { timeLeft, playerPosition, isInSafeZone, currentLevel, safeZones, movePlayer, isMoving, setSafeZones } =
    gameLogic

  // Memoize safe zones generation
  const generateSafeZones = useMemo(() => {
    return (level: number): SafeZone[] => {
      const baseZones: SafeZone[] = [
        { x: 10, y: 10, width: 20, height: 20, occupied: 0, required: Math.ceil(players.length / 4) },
        { x: 70, y: 10, width: 20, height: 20, occupied: 0, required: Math.ceil(players.length / 4) },
        { x: 10, y: 70, width: 20, height: 20, occupied: 0, required: Math.ceil(players.length / 4) },
        { x: 70, y: 70, width: 20, height: 20, occupied: 0, required: Math.ceil(players.length / 4) },
      ]

      if (level >= 2) {
        baseZones.push({ x: 40, y: 40, width: 15, height: 15, occupied: 0, required: Math.ceil(players.length / 6) })
      }

      if (level >= 3) {
        baseZones.push({ x: 25, y: 50, width: 12, height: 12, occupied: 0, required: Math.ceil(players.length / 8) })
        baseZones.push({ x: 65, y: 50, width: 12, height: 12, occupied: 0, required: Math.ceil(players.length / 8) })
      }

      return baseZones
    }
  }, [players.length])

  // Initialize safe zones
  useEffect(() => {
    if (gameState?.phase === "minigame") {
      const zones = generateSafeZones(currentLevel)
      setSafeZones(zones)
    }
  }, [gameState?.phase, currentLevel, generateSafeZones, setSafeZones])

  // Memoize other players to prevent unnecessary re-renders
  const otherPlayers = useMemo(
    () => players.filter((p) => p.id !== currentPlayer.id).slice(0, 8),
    [players, currentPlayer.id],
  )

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <GameBackground variant="minigame" opacity={0.4} />

      {/* Top Progress Bar */}
      <GameProgressBar timeLeft={timeLeft} maxTime={60} color="green" />

      {/* Lives Counter */}
      <div className="absolute top-4 right-4 z-50">
        <Card className="bg-red-900/40 backdrop-blur-xl border border-red-600/50">
          <CardContent className="p-2 flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-400" />
            <span className="text-white font-bold">{gameState.lives_remaining}</span>
          </CardContent>
        </Card>
      </div>

      {/* Level Indicator */}
      <div className="absolute top-4 left-4 z-50">
        <Card className="bg-green-900/40 backdrop-blur-xl border border-green-600/50">
          <CardContent className="p-2 flex items-center gap-2">
            <Target className="w-4 h-4 text-green-400" />
            <span className="text-white font-bold">Level {currentLevel}</span>
          </CardContent>
        </Card>
      </div>

      <div className="relative z-10 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
            <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              ZONA AMAN - LEVEL {currentLevel}
            </h1>
            <p className="text-gray-300">Bekerja sama untuk mengisi semua zona hijau dan selamatkan jiwa!</p>
          </motion.div>

          {/* Game Arena */}
          <Card className="bg-black/80 backdrop-blur-xl border border-green-800/50 mb-6">
            <CardContent className="p-4">
              <div className="relative h-80 bg-gradient-to-br from-gray-900 to-green-900/20 rounded-xl overflow-hidden border-2 border-green-800/30">
                {/* Safe Zones */}
                {safeZones.map((zone: SafeZone, index: number) => (
                  <motion.div
                    key={index}
                    className="absolute bg-green-800/30 border-2 border-green-600 rounded-xl flex flex-col items-center justify-center text-xs font-bold"
                    style={{
                      left: `${zone.x}%`,
                      top: `${zone.y}%`,
                      width: `${zone.width}%`,
                      height: `${zone.height}%`,
                    }}
                    animate={{
                      backgroundColor:
                        zone.occupied >= zone.required ? "rgba(34, 197, 94, 0.5)" : "rgba(34, 197, 94, 0.2)",
                      borderColor: zone.occupied >= zone.required ? "#22c55e" : "#4ade80",
                      boxShadow: zone.occupied >= zone.required ? "0 0 20px rgba(34, 197, 94, 0.8)" : "none",
                    }}
                  >
                    <span className="text-green-300 text-lg">🛡️</span>
                    <span className="text-white text-xs">
                      {zone.occupied}/{zone.required}
                    </span>
                    {zone.occupied >= zone.required && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 text-green-400"
                      >
                        ✅
                      </motion.div>
                    )}
                  </motion.div>
                ))}

                {/* Current Player */}
                <motion.div
                  className="absolute text-3xl z-30 filter drop-shadow-lg"
                  style={{
                    left: `${playerPosition.x}%`,
                    top: `${playerPosition.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  animate={{
                    scale: isMoving ? [1, 1.2, 1] : isInSafeZone ? [1, 1.1, 1] : 1,
                    filter: isInSafeZone
                      ? [
                          "drop-shadow(0 0 10px rgba(34, 197, 94, 0.5))",
                          "drop-shadow(0 0 20px rgba(34, 197, 94, 0.8))",
                          "drop-shadow(0 0 10px rgba(34, 197, 94, 0.5))",
                        ]
                      : "drop-shadow(0 0 5px rgba(255, 255, 255, 0.3))",
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div
                    animate={{
                      boxShadow: isInSafeZone ? "0 0 25px rgba(34, 197, 94, 0.9)" : "none",
                    }}
                    className="rounded-full relative"
                  >
                    {characterEmojis[currentPlayer.character_type as keyof typeof characterEmojis]}
                  </motion.div>
                </motion.div>

                {/* Other Players */}
                {otherPlayers.map((player, index) => (
                  <motion.div
                    key={player.id}
                    className="absolute text-2xl opacity-80 z-10 filter drop-shadow-lg"
                    style={{
                      left: `${player.position_x || 20 + index * 10}%`,
                      top: `${player.position_y || 30 + (index % 3) * 20}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                    animate={{
                      x: [0, 3, -3, 0],
                      y: [0, -2, 2, 0],
                      filter: [
                        "drop-shadow(0 0 5px rgba(255, 255, 255, 0.3))",
                        "drop-shadow(0 0 10px rgba(255, 0, 0, 0.5))",
                        "drop-shadow(0 0 5px rgba(255, 255, 255, 0.3))",
                      ],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Number.POSITIVE_INFINITY,
                      delay: index * 0.3,
                    }}
                  >
                    {characterEmojis[player.character_type as keyof typeof characterEmojis]}
                  </motion.div>
                ))}

                {/* Safe Zone Indicator */}
                {isInSafeZone && (
                  <motion.div
                    className="absolute top-4 left-1/2 transform -translate-x-1/2 text-green-400 font-bold text-lg z-50 bg-black/80 px-4 py-2 rounded-xl border border-green-600/50"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                  >
                    <Shield className="w-5 h-5 inline mr-2" />
                    ZONA AMAN!
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Zone Status */}
          <Card className="bg-black/60 backdrop-blur-xl border border-green-800/30 mb-6">
            <CardContent className="p-4">
              <h3 className="text-white font-bold mb-3 text-center">Status Zona Aman</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {safeZones.map((zone: SafeZone, index: number) => (
                  <div
                    key={index}
                    className={`p-2 rounded-lg text-center ${
                      zone.occupied >= zone.required
                        ? "bg-green-800/30 border border-green-600/50"
                        : "bg-gray-800/30 border border-gray-600/50"
                    }`}
                  >
                    <div className="text-sm font-bold text-white">Zona {index + 1}</div>
                    <div className="text-xs text-gray-300">
                      {zone.occupied}/{zone.required}
                    </div>
                    {zone.occupied >= zone.required && <div className="text-green-400 text-xs">✅ Lengkap</div>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Movement Controls */}
          <GameControls
            movePlayer={movePlayer}
            isMoving={isMoving}
            title="👻 Kontrol Hantu"
            description="Masuk ke zona hijau dan bantu tim selamatkan jiwa!"
          />
        </div>
      </div>
    </div>
  )
})

export default MinigamePhase
