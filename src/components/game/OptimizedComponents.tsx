"use client"

import React from "react"
import { motion } from "framer-motion"

// Memoized background component
export const GameBackground = React.memo(function GameBackground({
  variant = "default",
  opacity = 0.3,
}: {
  variant?: "default" | "lobby" | "quiz" | "minigame" | "finished"
  opacity?: number
}) {
  const gradients = {
    default: "from-gray-900 via-black to-green-900",
    lobby: "from-gray-900 via-black to-green-900",
    quiz: "from-gray-900 via-black to-red-900",
    minigame: "from-gray-900 via-black to-green-900",
    finished: "from-gray-900 via-black to-red-900",
  }

  return (
    <>
      <div className={`absolute inset-0 bg-gradient-to-br ${gradients[variant]}`} />
      <div
        className="absolute inset-0 bg-[url('/placeholder.svg?height=1080&width=1920')] bg-cover bg-center"
        style={{ opacity }}
      />
      <motion.div
        className="absolute inset-0 bg-gradient-to-t from-gray-800/60 via-transparent to-gray-900/40"
        animate={{ opacity: [opacity, opacity + 0.3, opacity] }}
        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
      />
    </>
  )
})

// Memoized floating spirits component
export const FloatingSpirits = React.memo(function FloatingSpirits({
  count = 6,
  spirits = ["👻", "🦇", "🕷️"],
}: {
  count?: number
  spirits?: string[]
}) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl opacity-20"
          initial={{
            x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1920),
            y: (typeof window !== "undefined" ? window.innerHeight : 1080) + 50,
          }}
          animate={{
            y: -50,
            x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1920),
            rotate: [0, 360],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 8 + Math.random() * 5,
            repeat: Number.POSITIVE_INFINITY,
            delay: i * 1.5,
          }}
        >
          {spirits[Math.floor(Math.random() * spirits.length)]}
        </motion.div>
      ))}
    </div>
  )
})

// Memoized progress bar component
export const GameProgressBar = React.memo(function GameProgressBar({
  timeLeft,
  maxTime,
  color = "red",
}: {
  timeLeft: number
  maxTime: number
  color?: "red" | "green" | "blue"
}) {
  const colors = {
    red: "from-red-600 to-orange-600",
    green: "from-green-600 to-blue-600",
    blue: "from-blue-600 to-purple-600",
  }

  const borderColors = {
    red: "border-red-900/50",
    green: "border-green-900/50",
    blue: "border-blue-900/50",
  }

  return (
    <div className={`absolute top-0 left-0 right-0 h-2 bg-black/70 z-50 border-b ${borderColors[color]}`}>
      <motion.div
        className={`h-full bg-gradient-to-r ${colors[color]}`}
        animate={{ width: `${(timeLeft / maxTime) * 100}%` }}
        transition={{ duration: 0.5 }}
      />
    </div>
  )
})
