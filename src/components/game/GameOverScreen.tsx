"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Skull, Eye, Zap, RotateCcw, Home, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface GameOverScreenProps {
  currentPlayer: any
  wrongAnswers: number
  restartGame: () => void
  gameLogic: any
}

export default function GameOverScreen({ currentPlayer, wrongAnswers, restartGame, gameLogic }: GameOverScreenProps) {
  const params = useParams()
  const roomCode = params.roomCode as string

  const [animationPhase, setAnimationPhase] = useState(0)
  const [glitchText, setGlitchText] = useState("GAME OVER")

  const glitchTexts = ["GAME OVER", "G4M3 0V3R", "GΔMΣ ØVΣR", "G∆ME ØV∑R", "GAME OVER"]

  useEffect(() => {
    // Animation phases: 0 = fade in, 1 = main display, 2 = options
    const phaseTimer = setTimeout(
      () => {
        if (animationPhase < 2) {
          setAnimationPhase(animationPhase + 1)
        }
      },
      animationPhase === 0 ? 2000 : 1000,
    )
    return () => clearTimeout(phaseTimer)
  }, [animationPhase])

  useEffect(() => {
    const glitchInterval = setInterval(() => {
      setGlitchText(glitchTexts[Math.floor(Math.random() * glitchTexts.length)])
    }, 150)
    return () => clearInterval(glitchInterval)
  }, [])

  const getDeathMessage = () => {
    if (wrongAnswers >= 3) {
      return "Your mind has been consumed by the darkness..."
    }
    return "The shadows have claimed another soul..."
  }

  const getDeathCause = () => {
    if (wrongAnswers >= 3) {
      return `Incorrect answers: ${wrongAnswers}/3`
    }
    return "Time ran out in the void..."
  }

  // Redirect to results page with eliminated status
  const redirectToResults = () => {
    const params = new URLSearchParams({
      health: (currentPlayer.health || 0).toString(),
      correct: (currentPlayer.correct_answers || 0).toString(),
      total: "10", // Assuming 10 total questions
      eliminated: "true",
    })
    window.location.href = `/game/${roomCode}/results?${params.toString()}`
  }

  // Redirect to results page with restart action
  const redirectToRestart = () => {
    const params = new URLSearchParams({
      health: (currentPlayer.health || 0).toString(),
      correct: (currentPlayer.correct_answers || 0).toString(),
      total: "10",
      eliminated: "true",
      action: "restart",
    })
    window.location.href = `/game/${roomCode}/results?${params.toString()}`
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-950/30 via-black to-purple-950/30" />

      {/* Floating death particles */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-red-500/40 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Lightning effects */}
      <div className="absolute inset-0">
        {[...Array(8)].map((_, i) => (
          <Zap
            key={i}
            className="absolute w-8 h-8 text-purple-500/30 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center max-w-2xl mx-auto px-4">
        {/* Phase 0: Dramatic entrance */}
        {animationPhase >= 0 && (
          <div
            className={`transition-all duration-2000 ${
              animationPhase >= 1 ? "opacity-100 scale-100" : "opacity-0 scale-150"
            }`}
          >
            {/* Main skull */}
            <div className="relative mb-8">
              <Skull className="w-32 h-32 text-red-500 mx-auto animate-pulse drop-shadow-[0_0_40px_rgba(239,68,68,0.8)]" />
              <div className="absolute inset-0 w-32 h-32 mx-auto">
                <Eye className="w-8 h-8 text-yellow-400 absolute top-8 left-10 animate-ping" />
                <Eye
                  className="w-8 h-8 text-yellow-400 absolute top-8 right-10 animate-ping"
                  style={{ animationDelay: "0.5s" }}
                />
              </div>
              {/* Glowing aura */}
              <div className="absolute inset-0 w-32 h-32 mx-auto bg-red-500/20 rounded-full blur-xl animate-pulse" />
            </div>

            {/* Glitch title */}
            <h1 className="text-6xl font-bold font-mono tracking-wider mb-6 text-red-500 animate-pulse">
              {glitchText}
            </h1>
          </div>
        )}

        {/* Phase 1: Death details */}
        {animationPhase >= 1 && (
          <div
            className={`transition-all duration-1000 ${
              animationPhase >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <Card className="bg-gray-900/90 border-red-900/50 backdrop-blur-sm mb-8">
              <div className="p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-purple-500/10" />
                <div className="relative z-10 space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white font-mono mb-2">SOUL DEPARTED</h2>
                    <p className="text-gray-300 text-lg">{currentPlayer.nickname}</p>
                  </div>

                  <div className="border-t border-gray-700 pt-6">
                    <p className="text-red-400 text-lg mb-2 font-mono">{getDeathMessage()}</p>
                    <p className="text-gray-500 font-mono">{getDeathCause()}</p>
                  </div>

                  {/* Death statistics */}
                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-700">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-500 font-mono">{wrongAnswers}</div>
                      <div className="text-gray-400 text-sm font-mono">Wrong Answers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-500 font-mono">{currentPlayer.score || 0}</div>
                      <div className="text-gray-400 text-sm font-mono">Final Score</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Phase 2: Action buttons */}
        {animationPhase >= 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={redirectToResults}
                className="bg-blue-600 hover:bg-blue-700 text-white font-mono text-lg px-8 py-3 rounded-lg border border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all duration-300"
              >
                <Trophy className="w-5 h-5 mr-2" />
                VIEW RESULTS
              </Button>

              <Button
                onClick={redirectToRestart}
                className="bg-red-600 hover:bg-red-700 text-white font-mono text-lg px-8 py-3 rounded-lg border border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all duration-300"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                RESURRECT
              </Button>

              <Button
                onClick={() => (window.location.href = "/")}
                className="bg-gray-700 hover:bg-gray-600 text-white font-mono text-lg px-8 py-3 rounded-lg border border-gray-500 shadow-[0_0_20px_rgba(107,114,128,0.3)] hover:shadow-[0_0_30px_rgba(107,114,128,0.5)] transition-all duration-300"
              >
                <Home className="w-5 h-5 mr-2" />
                ESCAPE
              </Button>
            </div>
            <p className="text-gray-500 text-sm font-mono animate-pulse">Will you dare to face the darkness again?</p>
          </div>
        )}
      </div>

      {/* Corner death effects */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-red-500/20 to-transparent rounded-br-full animate-pulse" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-bl-full animate-pulse" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-tr-full animate-pulse" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-red-500/20 to-transparent rounded-tl-full animate-pulse" />

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
