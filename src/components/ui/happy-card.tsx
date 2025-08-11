// src/components/ui/happy-card.tsx

import { cn } from "@/lib/utils" // Utility for combining classNames (assumed to exist)
import { ReactNode } from "react"
import { motion } from "framer-motion"

interface HappyCardProps {
  variant?: "sunny" | "star" | "cloud" | "rainbow" // Variants for different styles
  glowing?: boolean // Adds a glowing effect
  animated?: boolean // Enables subtle animations
  className?: string // Custom classes for additional styling
  children: ReactNode // Content inside the card
}

export function HappyCard({
  variant = "sunny",
  glowing = false,
  animated = false,
  className,
  children,
}: HappyCardProps) {
  // Define variant-specific styles
  const variantStyles = {
    sunny: "bg-yellow-100/80 border-yellow-300 shadow-[0_0_15px_rgba(255,215,0,0.5)]",
    star: "bg-blue-100/80 border-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.5)]",
    cloud: "bg-white/80 border-gray-200 shadow-[0_0_15px_rgba(200,200,200,0.5)]",
    rainbow: "bg-gradient-to-r from-pink-100 via-yellow-100 to-blue-100 border-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.5)]",
  }

  // Animation variants for the card
  const cardVariants = {
    initial: { scale: 0.95, opacity: 0.8 },
    animate: {
      scale: animated ? [1, 1.02, 1] : 1,
      opacity: 1,
      transition: {
        duration: animated ? 2 : 0.5,
        repeat: animated ? Infinity : 0,
        repeatType: "reverse" as const,
      },
    },
  }

  return (
    <motion.div
      className={cn(
        "rounded-2xl border-2 p-4 backdrop-blur-sm",
        variantStyles[variant],
        glowing && "shadow-[0_0_20px_rgba(255,215,0,0.7)]",
        className
      )}
      variants={cardVariants}
      initial="initial"
      animate="animate"
    >
      <div className="relative">
        {/* Optional decorative elements */}
        {variant === "sunny" && (
          <div className="absolute -top-2 -left-2 w-6 h-6 bg-yellow-400 rounded-full opacity-50" />
        )}
        {variant === "star" && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-400 rounded-full opacity-50" />
        )}
        {variant === "cloud" && (
          <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-gray-200 rounded-full opacity-50" />
        )}
        {variant === "rainbow" && (
          <div className="absolute -top-2 -left-2 w-6 h-6 bg-pink-400 rounded-full opacity-50" />
        )}
        {children}
      </div>
    </motion.div>
  )
}