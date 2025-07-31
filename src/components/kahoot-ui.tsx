"use client"

import { motion } from "framer-motion"
import type React from "react"

interface KahootUIProps {
  children: React.ReactNode
  variant?: "quiz" | "boost" | "arena" | "lobby"
}

export function KahootUI({ children, variant = "quiz" }: KahootUIProps) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Kahoot Purple Starry Background */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 1px, transparent 1px),
            radial-gradient(circle at 80% 40%, rgba(255,255,255,0.08) 1px, transparent 1px),
            radial-gradient(circle at 40% 80%, rgba(255,255,255,0.12) 1px, transparent 1px),
            radial-gradient(circle at 60% 20%, rgba(255,255,255,0.06) 1px, transparent 1px),
            radial-gradient(circle at 90% 70%, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "100px 100px, 150px 150px, 120px 120px, 80px 80px, 200px 200px",
        }}
      />

      {/* Large Glowing Orbs */}
      <motion.div
        className="absolute top-20 left-20 w-40 h-40 rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 40%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{
          duration: 6,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute bottom-32 right-32 w-32 h-32 rounded-full opacity-15"
        style={{
          background: "radial-gradient(circle, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.08) 40%, transparent 70%)",
        }}
        animate={{
          scale: [1.1, 1, 1.1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 8,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />

      {/* Floating Stars */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Number.POSITIVE_INFINITY,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}

interface KahootCardProps {
  children: React.ReactNode
  className?: string
  variant?: "white" | "colored"
}

export function KahootCard({ children, className = "", variant = "white" }: KahootCardProps) {
  return (
    <motion.div
      className={`
        ${variant === "white" ? "bg-white" : "bg-white/95"} 
        rounded-2xl shadow-2xl backdrop-blur-sm border border-white/20
        ${className}
      `}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  )
}

interface KahootButtonProps {
  children: React.ReactNode
  onClick?: () => void
  color: "red" | "blue" | "yellow" | "green"
  disabled?: boolean
  className?: string
  icon?: React.ReactNode
}

export function KahootButton({ children, onClick, color, disabled = false, className = "", icon }: KahootButtonProps) {
  const colors = {
    red: "bg-red-500 hover:bg-red-600 text-white",
    blue: "bg-blue-500 hover:bg-blue-600 text-white",
    yellow: "bg-yellow-500 hover:bg-yellow-600 text-white",
    green: "bg-green-500 hover:bg-green-600 text-white",
  }

  const shapes = {
    red: "clip-path: polygon(0 0, 100% 0, 85% 100%, 0% 100%)", // Triangle
    blue: "clip-path: polygon(20% 0%, 100% 0%, 100% 100%, 0% 100%)", // Diamond
    yellow: "border-radius: 50%", // Circle
    green: "border-radius: 0.5rem", // Square
  }

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${colors[color]}
        font-bold text-lg p-6 w-full h-24 flex items-center justify-start
        shadow-lg transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      style={
        color === "red"
          ? { clipPath: "polygon(15% 0%, 100% 0%, 100% 100%, 0% 100%)" }
          : color === "blue"
            ? { clipPath: "polygon(0% 0%, 85% 0%, 100% 100%, 15% 100%)" }
            : color === "yellow"
              ? { borderRadius: "50%" }
              : { borderRadius: "0.5rem" }
      }
      whileHover={!disabled ? { scale: 1.05, y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
    >
      {icon && <span className="mr-4 text-2xl">{icon}</span>}
      <span className="flex-1 text-left">{children}</span>
    </motion.button>
  )
}

interface BoostButtonProps {
  onPress: () => void
  onRelease: () => void
  progress: number
  disabled?: boolean
}

export function BoostButton({ onPress, onRelease, progress, disabled }: BoostButtonProps) {
  return (
    <div className="flex flex-col items-center">
      <motion.button
        onMouseDown={onPress}
        onMouseUp={onRelease}
        onTouchStart={onPress}
        onTouchEnd={onRelease}
        disabled={disabled}
        className="relative w-32 h-32 rounded-full bg-gradient-to-b from-green-400 to-green-600 shadow-2xl border-4 border-pink-300 disabled:opacity-50"
        whileHover={!disabled ? { scale: 1.1 } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
        animate={{
          boxShadow:
            progress > 0
              ? "0 0 30px rgba(34, 197, 94, 0.8), 0 0 60px rgba(34, 197, 94, 0.4)"
              : "0 10px 30px rgba(0,0,0,0.3)",
        }}
      >
        {/* Button Surface with Lightning Pattern */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-b from-green-300 to-green-500 flex items-center justify-center">
          <motion.div
            className="text-white text-3xl font-bold"
            animate={{ rotate: progress > 0 ? [0, 360] : 0 }}
            transition={{ duration: 1, repeat: progress > 0 ? Number.POSITIVE_INFINITY : 0 }}
          >
            ⚡
          </motion.div>
        </div>

        {/* Progress Ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle cx="50%" cy="50%" r="58" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="4" />
          <motion.circle
            cx="50%"
            cy="50%"
            r="58"
            fill="none"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 58}`}
            strokeDashoffset={`${2 * Math.PI * 58 * (1 - progress / 100)}`}
            transition={{ duration: 0.1 }}
          />
        </svg>
      </motion.button>
    </div>
  )
}
