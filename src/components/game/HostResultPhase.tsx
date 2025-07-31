"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Skull, Trophy, Crown, Medal, Star, Home, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Player {
  id: string
  nickname: string
  health: number
  maxHealth: number
  score: number
  correctAnswers: number
  isHost?: boolean
  character_type?: string
  status?: "alive" | "dead" | "spectating"
}

interface HostResultsPhaseProps {
  players: Player[]
  gameLogic: any
  roomCode: string
}

// Character emojis mapping
const characterEmojis = {
  ghost: "👻",
  vampire: "🧛‍♂️",
  witch: "🧙‍♀️",
  zombie: "🧟‍♂️",
  demon: "😈",
  skeleton: "💀",
  werewolf: "🐺",
  mummy: "🏺",
}

export default function HostResultsPhase({ players, gameLogic, roomCode }: HostResultsPhaseProps) {
  const [animationPhase, setAnimationPhase] = useState(0)
  const [celebrationText, setCelebrationText] = useState("RITUAL BERAKHIR!")
  const [currentLevel] = useState(1)

  const celebrationTexts = [
    "RITUAL BERAKHIR!",
    "JIWA-JIWA TELAH DINILAI!",
    "KEGELAPAN SURUT!",
    "PENGETAHUAN TELAH DIUJI!",
    "UJIAN SELESAI!",
  ]

  // Sort players by score
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score)

  useEffect(() => {
    // Animation phases: 0 = fade in, 1 = results, 2 = actions
    const phaseTimer = setTimeout(
      () => {
        if (animationPhase < 2) {
          setAnimationPhase(animationPhase + 1)
        }
      },
      animationPhase === 0 ? 1500 : 1000,
    )

    return () => clearTimeout(phaseTimer)
  }, [animationPhase])

  useEffect(() => {
    const textInterval = setInterval(() => {
      setCelebrationText(celebrationTexts[Math.floor(Math.random() * celebrationTexts.length)])
    }, 3000)

    return () => clearInterval(textInterval)
  }, [])

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="w-8 h-8 text-yellow-500" />
      case 1:
        return <Medal className="w-8 h-8 text-gray-400" />
      case 2:
        return <Star className="w-8 h-8 text-amber-600" />
      default:
        return <Skull className="w-8 h-8 text-gray-600" />
    }
  }

  const getRankColor = (index: number) => {
    switch (index) {
      case 0:
        return "bg-yellow-900/30 border-yellow-500/50 shadow-lg shadow-yellow-500/20"
      case 1:
        return "bg-gray-800/30 border-gray-400/50 shadow-lg shadow-gray-400/20"
      case 2:
        return "bg-orange-900/30 border-orange-600/50 shadow-lg shadow-orange-600/20"
      default:
        return "bg-black/40 border-gray-600/30"
    }
  }

  const getCharacterEmoji = (characterType: string | undefined) => {
    return characterEmojis[characterType as keyof typeof characterEmojis] || "👻"
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-red-900 opacity-90" />

      {/* Floating celebration particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-2xl"
            initial={{
              x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1920),
              y: (typeof window !== "undefined" ? window.innerHeight : 1080) + 50,
              opacity: 0,
            }}
            animate={{
              y: -100,
              opacity: [0, 1, 0],
              rotate: [0, 360],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Number.POSITIVE_INFINITY,
              delay: i * 0.1,
            }}
          >
            {["👻", "🎃", "💀", "⚡", "🌟"][Math.floor(Math.random() * 5)]}
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Phase 0: Dramatic entrance */}
        {animationPhase >= 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mb-8"
          >
            {/* Main trophy */}
            <div className="relative mb-8">
              <Trophy className="w-32 h-32 text-yellow-500 mx-auto animate-pulse drop-shadow-[0_0_40px_rgba(234,179,8,0.8)]" />
              <div className="absolute inset-0 w-32 h-32 mx-auto bg-yellow-500/20 rounded-full blur-xl animate-pulse" />
            </div>

            {/* Title */}
            <h1 className="text-6xl font-black mb-4 bg-gradient-to-r from-red-500 to-orange-600 bg-clip-text text-transparent drop-shadow-lg animate-pulse">
              {celebrationText}
            </h1>

            <p className="text-gray-300 text-xl">Jiwa-jiwa yang Selamat & Papan Skor Akhir</p>
          </motion.div>
        )}

        {/* Phase 1: Results */}
        {animationPhase >= 1 && (
          <div
            className={`transition-all duration-1000 ${
              animationPhase >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            {/* Winner announcement */}
            {sortedPlayers.length > 0 && (
              <Card className="max-w-2xl mx-auto mb-8 bg-gray-900/90 border-yellow-500/50 backdrop-blur-sm">
                <div className="p-8 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-purple-500/10" />

                  <div className="relative z-10 text-center">
                    <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-pulse" />
                    <h2 className="text-3xl font-bold text-white font-mono mb-2">CHAMPION OF DARKNESS</h2>
                    <div className="flex items-center justify-center gap-4 mb-2">
                      <motion.div
                        className="text-4xl"
                        animate={{
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Number.POSITIVE_INFINITY,
                        }}
                      >
                        {getCharacterEmoji(sortedPlayers[0]?.character_type)}
                      </motion.div>
                      <p className="text-2xl text-yellow-400 font-mono">{sortedPlayers[0]?.nickname}</p>
                    </div>
                    <p className="text-gray-400 mt-2">
                      Score: {sortedPlayers[0]?.score} • {sortedPlayers[0]?.correctAnswers || 0} jiwa diselamatkan
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Leaderboard */}
            <Card className="bg-black/70 backdrop-blur-xl border border-red-800/50">
              <CardHeader>
                <CardTitle className="text-white text-2xl text-center flex items-center justify-center gap-2">
                  <Skull className="w-6 h-6 text-red-400" />🏆 Leaderboard Final
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sortedPlayers.map((player, index) => (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 backdrop-blur-sm transition-all duration-300 hover:scale-105 ${getRankColor(
                        index,
                      )}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2">
                          {getRankIcon(index)}
                          <span className="text-2xl font-bold text-white font-mono">#{index + 1}</span>
                        </div>

                        <motion.div
                          className="text-3xl"
                          animate={{
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Number.POSITIVE_INFINITY,
                            delay: index * 0.2,
                          }}
                        >
                          {getCharacterEmoji(player.character_type)}
                        </motion.div>

                        <div>
                          <div className="text-white font-bold text-lg flex items-center gap-2">
                            {player.nickname}
                            {player.status === "dead" && <Skull className="w-4 h-4 text-red-500" />}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {player.correctAnswers || 0} jiwa diselamatkan • Level {currentLevel} tercapai
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-500">Nyawa:</span>
                            <div className="flex space-x-1">
                              {[...Array(player.maxHealth)].map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-2 h-2 rounded-full ${i < player.health ? "bg-red-500" : "bg-gray-600"}`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-white font-bold text-2xl">{player.score}</div>
                        <div className="text-gray-400 text-sm">poin</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Phase 2: Action buttons */}
        {animationPhase >= 2 && (
          <div className="text-center space-y-6 animate-fade-in mt-8">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={gameLogic.restartGame}
                className="bg-purple-600 hover:bg-purple-700 text-white font-mono text-lg px-8 py-3 rounded-lg border border-purple-500 shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] transition-all duration-300"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                MAIN LAGI
              </Button>

              <Button
                onClick={() => (window.location.href = "/")}
                className="bg-gray-700 hover:bg-gray-600 text-white font-mono text-lg px-8 py-3 rounded-lg border border-gray-500 shadow-[0_0_20px_rgba(107,114,128,0.3)] hover:shadow-[0_0_30px_rgba(107,114,128,0.5)] transition-all duration-300"
              >
                <Home className="w-5 h-5 mr-2" />
                KEMBALI KE BERANDA
              </Button>
            </div>

            <p className="text-gray-500 text-sm font-mono animate-pulse">Kegelapan menunggu kembalinya kalian...</p>
          </div>
        )}
      </div>

      {/* Corner magical effects */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-transparent rounded-br-full animate-pulse" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-yellow-500/20 to-transparent rounded-bl-full animate-pulse" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-tr-full animate-pulse" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-purple-500/20 to-transparent rounded-tl-full animate-pulse" />

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
      `}</style>
    </div>
  )
}
