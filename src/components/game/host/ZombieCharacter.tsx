"use client"

import Image from "next/image"
import { useRef } from "react"

interface ZombieState {
  isAttacking: boolean
  targetPlayerId: string | null
  attackProgress: number
  basePosition: number
  currentPosition: number
}

interface ZombieCharacterProps {
  zombieState: ZombieState
  animationTime: number
  gameMode: "normal" | "panic"
  centerX: number
}

export default function ZombieCharacter({
  zombieState,
  animationTime,
  gameMode,
  centerX,
}: ZombieCharacterProps) {
  const attackRef = useRef<HTMLDivElement>(null)

  // Animasi normal saat tidak menyerang
  const normalMovement = {
    x: Math.sin(animationTime * 0.3) * (gameMode === "panic" ? 120 : 25),
    y: Math.sin(animationTime * 0.8) * (gameMode === "panic" ? 45 : 12),
    rotation: Math.sin(animationTime * (gameMode === "panic" ? 0.2 : 0.1)) * (gameMode === "panic" ? 15 : 10),
    scale: gameMode === "panic" ? 1.8 : 1.6
  }

  // Animasi saat menyerang (lebih terkontrol)
  const attackMovement = {
    x: Math.sin(animationTime * 0.5) * 10, // Gerakan horizontal lebih kecil
    y: Math.sin(animationTime * 1.5) * 5,  // Gerakan vertikal lebih kecil
    rotation: Math.sin(animationTime * 2) * 8, // Rotasi lebih kecil
    scale: 1.8 // Skala tetap
  }

  // Pilih animasi berdasarkan state
  const currentMovement = zombieState.isAttacking ? attackMovement : normalMovement

  return (
    <div
      ref={attackRef}
      className="absolute z-40 origin-bottom"
      style={{
        left: `${centerX - zombieState.currentPosition + currentMovement.x}px`,
        top: '82%',
        transform: `translateY(${currentMovement.y}px)`,
        transition: zombieState.isAttacking ? 'transform 0.05s linear' : 'transform 0.1s ease-out'
      }}
    >
      <div className="relative">
        {zombieState.isAttacking && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 rounded text-xs bg-red-700/90 text-white animate-pulse border border-red-400">
            ATTACKING! 🧟‍♂️
          </div>
        )}
        
        {/* Efek darah saat menyerang */}
        {zombieState.isAttacking && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-1 h-6 bg-red-600 animate-drip">
            <div className="absolute bottom-0 w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
          </div>
        )}
        
        <Image
          src="/images/zombie.gif"
          alt="Zombie"
          width={120}
          height={120}
          className="drop-shadow-lg"
          unoptimized
          style={{
            imageRendering: "pixelated",
            filter: zombieState.isAttacking
              ? "brightness(1.3) contrast(1.5) saturate(1.3) drop-shadow(0 0 15px rgba(255,50,50,0.7))"
              : gameMode === "panic"
                ? "brightness(1.2) contrast(1.4) saturate(1.2)"
                : "brightness(1.1) contrast(1.2)",
            transform: `scale(${currentMovement.scale}) rotate(${currentMovement.rotation}deg)`,
            transformOrigin: 'bottom center',
            transition: 'all 0.1s ease-out'
          }}
        />
        
        {/* Efek trail darah saat menyerang */}
        {zombieState.isAttacking && [...Array(3)].map((_, i) => (
          <div key={`blood-trail-${i}`} className="absolute top-0 left-0">
            <Image
              src="/images/zombie.gif"
              alt="Blood Trail"
              width={120}
              height={120}
              className="absolute"
              unoptimized
              style={{
                imageRendering: "pixelated",
                opacity: 0.3 - (i * 0.1),
                filter: "brightness(0.7) contrast(1.1)",
                transform: `translateX(${-10 - i * 8}px) scale(${0.9 - i * 0.1})`,
                animation: `fadeOut 0.5s ${i * 0.1}s forwards`
              }}
            />
          </div>
        ))}
        
        {/* Efek aura */}
        <div
          className={`absolute -inset-2 rounded-full blur-sm ${
            zombieState.isAttacking 
              ? "bg-red-500 opacity-20 animate-pulse-slow"
              : gameMode === "panic"
                ? "bg-red-500 opacity-10"
                : "bg-green-500 opacity-5"
          }`}
        />
      </div>
      
      <style jsx>{`
        @keyframes drip {
          0% { height: 0; opacity: 1; }
          50% { height: 6px; opacity: 1; }
          100% { height: 12px; opacity: 0; }
        }
        .animate-drip {
          animation: drip 0.6s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        .animate-pulse {
          animation: pulse 0.5s infinite;
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.25; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 1.5s infinite;
        }
        
        @keyframes fadeOut {
          0% { opacity: 0.3; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}