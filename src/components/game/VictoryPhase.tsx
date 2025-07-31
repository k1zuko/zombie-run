"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Trophy, Zap, Star } from "lucide-react"

interface VictoryPhaseProps {
  currentPlayer: any
  gameLogic: any
  questionsAnswered: number
}

export default function VictoryPhase({ currentPlayer, gameLogic, questionsAnswered }: VictoryPhaseProps) {
  const { showVictoryAnimation, showRunBooster, activateRunBooster, boostProgress, isBoostActive } = gameLogic

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-yellow-400 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: window.innerHeight + 10,
              opacity: 0,
            }}
            animate={{
              y: -10,
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 3,
              delay: Math.random() * 2,
              repeat: Number.POSITIVE_INFINITY,
            }}
          />
        ))}
      </div>

      <Card className="bg-black/80 backdrop-blur-lg border-purple-500/50 p-8 max-w-md w-full mx-4">
        <div className="text-center space-y-6">
          {/* Victory Title */}
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", duration: 0.8 }}>
            <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">Congratulations!</h1>
            <p className="text-purple-300">You've completed all {questionsAnswered} questions!</p>
          </motion.div>

          {/* Player Stats */}
          <div className="bg-purple-900/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-white">
              <span>Score:</span>
              <span className="font-bold text-yellow-400">{currentPlayer?.score || 0}</span>
            </div>
            <div className="flex justify-between text-white">
              <span>Correct Answers:</span>
              <span className="font-bold text-green-400">{questionsAnswered}</span>
            </div>
            <div className="flex justify-between text-white">
              <span>Power-ups Earned:</span>
              <span className="font-bold text-blue-400">{currentPlayer?.power_ups || 0}</span>
            </div>
          </div>

          {/* Jumping Character Animation */}
          {showVictoryAnimation && (
            <motion.div
              className="relative h-32 flex items-end justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center"
                animate={{
                  y: [-20, -60, -20],
                  rotate: [0, 360, 720],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              >
                <Star className="w-8 h-8 text-white" />
              </motion.div>

              {/* Jump trail effect */}
              <motion.div
                className="absolute bottom-0 w-8 h-2 bg-white/30 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 0.1, 0.3],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          )}

          {/* Run Booster Button */}
          {showRunBooster && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
              <Button
                onClick={activateRunBooster}
                disabled={isBoostActive}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-3 px-6 rounded-lg transform transition-all duration-200 hover:scale-105"
              >
                <Zap className="w-5 h-5 mr-2" />
                {isBoostActive ? "Boosting..." : "Activate Run Booster!"}
              </Button>

              {/* Boost Progress */}
              {isBoostActive && (
                <div className="space-y-2">
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <motion.div
                      className="bg-gradient-to-r from-orange-400 to-red-500 h-3 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${boostProgress}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                  <p className="text-sm text-orange-300">Boost Power: {Math.round(boostProgress)}%</p>
                </div>
              )}

              {boostProgress >= 100 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <h3 className="text-xl font-bold text-green-400 mb-2">🎉 Game Complete! 🎉</h3>
                  <p className="text-gray-300">You are now the ultimate robot runner!</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </Card>
    </div>
  )
}
