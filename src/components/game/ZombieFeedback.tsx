"use client"

import { useEffect, useState } from "react"
import { Skull, Zap } from "lucide-react"
import Image from "next/image"

interface ZombieFeedbackProps {
  isCorrect: boolean | null
  isVisible: boolean
}

export default function ZombieFeedback({ isCorrect, isVisible }: ZombieFeedbackProps) {
  const [animationKey, setAnimationKey] = useState(0)
  const [showEffects, setShowEffects] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setAnimationKey((prev) => prev + 1)
      setShowEffects(true)
      const timer = setTimeout(() => setShowEffects(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, isCorrect])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 border-t border-gray-700 backdrop-blur-sm z-50 shadow-[0_-10px_30px_0_rgba(0,0,0,0.3)]">
      <div className="container mx-auto px-4 py-3">
        <div className="relative h-28 overflow-hidden">
          {/* Background track */}
          <div className="absolute bottom-4 left-0 right-0 h-3 bg-gray-800 rounded-full">
            <div className="absolute h-full w-full bg-gradient-to-r from-transparent via-gray-600/50 to-transparent" />
            {/* Track obstacles */}
            <div className="absolute left-20 bottom-4 w-3 h-5 bg-red-500 rounded-t-md" />
            <div className="absolute left-45% bottom-4 w-4 h-6 bg-yellow-500 rounded-t-md" />
            <div className="absolute left-70% bottom-4 w-5 h-4 bg-blue-500 rounded-t-md" />
          </div>

          {/* Character runner (target yang dikejar) */}
          <div
            key={`character-${animationKey}`}
            className={`absolute bottom-6 transition-all ${isCorrect ? "animate-run-fast" : "animate-run-slow"}`}
            style={{
              width: "70px",
              height: "70px",
              animation: isCorrect
                ? "runFast 1.8s cubic-bezier(0.2, 0.8, 0.4, 1) forwards"
                : "runSlow 2.2s ease-out forwards",
            }}
          >
            <Image
              src="/character/character.gif"
              alt="Running character"
              width={70}
              height={70}
              unoptimized
              className="object-contain"
            />
          </div>

          {/* Zombie chaser (yang mengejar) */}
          {isCorrect === false && (
            <div
              key={`zombie-${animationKey}`}
              className="absolute bottom-6 animate-float"
              style={{
                width: "80px",
                height: "80px",
                animation: "chaseZombie 2.2s cubic-bezier(0.4, 0.1, 0.2, 1) forwards",
                left: "-80px",
              }}
            >
              <Image
                src="/zombie.gif"
                alt="Chasing zombie"
                width={80}
                height={80}
                unoptimized
                className="animate-pulse object-contain filter-red"
              />
            </div>
          )}

          {/* Feedback text */}
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <div className={`flex items-center space-x-2 ${isCorrect ? "text-green-400" : "text-red-400"}`}>
              {isCorrect ? (
                <>
                  <div className="relative">
                    <Zap className="w-5 h-5 animate-pulse" />
                    <div className="absolute inset-0 rounded-full bg-green-400/20 animate-ping" />
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm font-bold tracking-wider block">KAMU AMAN!</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="relative">
                    <Skull className="w-5 h-5 animate-pulse" />
                    <div className="absolute inset-0 rounded-full bg-red-400/20 animate-ping" />
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm font-bold tracking-wider block">ZOMBI MENDEKAT!</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Speed lines effect */}
          {isCorrect && showEffects && (
            <div className="absolute left-0 right-0 bottom-0 h-full overflow-hidden">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute bottom-0 w-1 h-10 bg-white/30"
                  style={{
                    left: `${Math.random() * 100}%`,
                    transform: `rotate(${Math.random() * 30 - 15}deg)`,
                    animation: `speedLine 0.8s ease-out ${i * 0.05}s forwards`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes runFast {
          0% {
            left: -70px;
            transform: scaleX(1) rotate(0deg);
          }
          20% {
            transform: scaleX(1) translateY(-10px) rotate(-5deg);
          }
          40% {
            transform: scaleX(1) translateY(0) rotate(5deg);
          }
          60% {
            transform: scaleX(1) translateY(-8px) rotate(-3deg);
          }
          80% {
            transform: scaleX(1) translateY(-2px) rotate(2deg);
          }
          100% {
            left: calc(100% + 70px);
            transform: scaleX(1) translateY(0) rotate(0deg);
          }
        }
        @keyframes runSlow {
          0% {
            left: -70px;
            transform: scaleX(1) translateY(0);
          }
          30% {
            transform: scaleX(1) translateY(-5px);
          }
          50% {
            transform: scaleX(1) translateY(0);
          }
          70% {
            transform: scaleX(1) translateY(-3px);
          }
          100% {
            left: 60%;
            transform: scaleX(1) translateY(0);
          }
        }
        @keyframes chaseZombie {
          0% {
            left: -100px;
            opacity: 0;
            transform: translateY(0);
          }
          20% {
            opacity: 1;
            transform: translateY(-5px);
          }
          40% {
            transform: translateY(0);
          }
          60% {
            transform: translateY(-8px);
          }
          80% {
            transform: translateY(-3px);
          }
          100% {
            left: 30%;
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes speedLine {
          0% {
            opacity: 0.8;
            transform: translateY(0) rotate(15deg);
          }
          100% {
            opacity: 0;
            transform: translateY(-100px) rotate(15deg);
          }
        }
        .animate-float {
          animation: float 2s ease-in-out infinite;
        }
        .filter-red {
          filter: hue-rotate(-30deg) brightness(1.1) drop-shadow(0 0 4px rgba(255, 0, 0, 0.5));
        }
      `}</style>
    </div>
  )
}