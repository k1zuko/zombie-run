"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"

interface GameCharacterProps {
  characterType: string
  isMoving?: boolean
  isBoostActive?: boolean
  isInSafeZone?: boolean
  size?: "small" | "medium" | "large"
  showEffects?: boolean
  position?: { x: number; y: number }
}

export function GameCharacter({
  characterType,
  isMoving = false,
  isBoostActive = false,
  isInSafeZone = false,
  size = "medium",
  showEffects = true,
  position = { x: 50, y: 50 },
}: GameCharacterProps) {
  const [particles, setParticles] = useState<Array<{ id: string; x: number; y: number }>>([])

  const sizeClasses = {
    small: "w-8 h-8 text-2xl",
    medium: "w-12 h-12 text-3xl",
    large: "w-16 h-16 text-4xl",
  }

  const characterDesigns = {
    robot1: {
      emoji: "🤖",
      color: "from-blue-400 to-cyan-400",
      glowColor: "rgba(59, 130, 246, 0.6)",
      boostColor: "rgba(34, 197, 94, 0.8)",
    },
    robot2: {
      emoji: "🦾",
      color: "from-purple-400 to-pink-400",
      glowColor: "rgba(147, 51, 234, 0.6)",
      boostColor: "rgba(234, 179, 8, 0.8)",
    },
    robot3: {
      emoji: "🚀",
      color: "from-red-400 to-orange-400",
      glowColor: "rgba(239, 68, 68, 0.6)",
      boostColor: "rgba(34, 197, 94, 0.8)",
    },
    robot4: {
      emoji: "⚡",
      color: "from-yellow-400 to-amber-400",
      glowColor: "rgba(234, 179, 8, 0.6)",
      boostColor: "rgba(59, 130, 246, 0.8)",
    },
  }

  const character = characterDesigns[characterType as keyof typeof characterDesigns] || characterDesigns.robot1

  // Generate boost particles
  useEffect(() => {
    if (isBoostActive && showEffects) {
      const interval = setInterval(() => {
        const newParticle = {
          id: Math.random().toString(36).substr(2, 9),
          x: Math.random() * 40 - 20,
          y: Math.random() * 40 - 20,
        }
        setParticles((prev) => [...prev, newParticle])

        setTimeout(() => {
          setParticles((prev) => prev.filter((p) => p.id !== newParticle.id))
        }, 1000)
      }, 100)

      return () => clearInterval(interval)
    }
  }, [isBoostActive, showEffects])

  return (
    <div className="relative">
      {/* Character Container */}
      <motion.div
        className={`relative ${sizeClasses[size]} flex items-center justify-center`}
        animate={{
          scale: isMoving ? [1, 1.1, 1] : isBoostActive ? [1, 1.3, 1.1] : 1,
          rotate: isMoving ? [0, -5, 5, 0] : 0,
          y: isBoostActive ? [0, -10, 0] : 0,
        }}
        transition={{
          duration: isBoostActive ? 0.5 : 0.3,
          repeat: isBoostActive ? 3 : 0,
        }}
      >
        {/* Glow Effect */}
        <motion.div
          className={`absolute inset-0 rounded-full bg-gradient-to-r ${character.color} opacity-30 blur-md`}
          animate={{
            scale: isInSafeZone ? [1, 1.5, 1] : isBoostActive ? [1, 2, 1] : 1,
            opacity: isInSafeZone ? [0.3, 0.8, 0.3] : isBoostActive ? [0.3, 1, 0.3] : 0.3,
          }}
          transition={{
            duration: 1,
            repeat: isInSafeZone || isBoostActive ? Number.POSITIVE_INFINITY : 0,
          }}
        />

        {/* Character Body */}
        <motion.div
          className="relative z-10 flex items-center justify-center"
          style={{
            filter: isBoostActive
              ? `drop-shadow(0 0 20px ${character.boostColor})`
              : isInSafeZone
                ? `drop-shadow(0 0 15px ${character.glowColor})`
                : `drop-shadow(0 0 8px ${character.glowColor})`,
          }}
        >
          {character.emoji}
        </motion.div>

        {/* Boost Particles */}
        {showEffects &&
          particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute w-1 h-1 bg-yellow-400 rounded-full"
              initial={{
                x: particle.x,
                y: particle.y,
                opacity: 1,
                scale: 0,
              }}
              animate={{
                x: particle.x * 3,
                y: particle.y * 3,
                opacity: 0,
                scale: 1,
              }}
              transition={{ duration: 1 }}
            />
          ))}

        {/* Safe Zone Indicator */}
        {isInSafeZone && showEffects && (
          <motion.div
            className="absolute -top-6 left-1/2 transform -translate-x-1/2"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
          >
            <div className="bg-green-500/80 text-white text-xs px-2 py-1 rounded-full font-bold">SAFE</div>
          </motion.div>
        )}

        {/* Boost Indicator */}
        {isBoostActive && showEffects && (
          <motion.div
            className="absolute -top-8 left-1/2 transform -translate-x-1/2"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
          >
            <div className="bg-yellow-500/80 text-black text-xs px-2 py-1 rounded-full font-bold">BOOST!</div>
          </motion.div>
        )}
      </motion.div>

      {/* Movement Trail Effect */}
      {isMoving && showEffects && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${character.glowColor} 0%, transparent 70%)`,
          }}
          animate={{
            scale: [0.8, 1.2, 0.8],
            opacity: [0.6, 0.2, 0.6],
          }}
          transition={{
            duration: 0.5,
            repeat: Number.POSITIVE_INFINITY,
          }}
        />
      )}
    </div>
  )
}
