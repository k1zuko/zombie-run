"use client";

import Image from "next/image";
import { useRef } from "react";

interface ZombieState {
  isAttacking: boolean;
  targetPlayerId: string | null;
  attackProgress: number;
  basePosition: number;
  currentPosition: number;
}

interface ZombieCharacterProps {
  zombieState: ZombieState;
  animationTime: number;
  gameMode: "normal" | "panic";
  centerX: number;
}

export default function ZombieCharacter({
  zombieState,
  animationTime,
  gameMode,
  centerX,
}: ZombieCharacterProps) {
  const attackRef = useRef<HTMLDivElement>(null);
  const ZOMBIE_SPEED = 30;

  const normalMovement = {
    x: Math.sin(animationTime * 0.4) * (gameMode === "panic" ? 140 : 30),
    y: Math.sin(animationTime * 1.0) * (gameMode === "panic" ? 50 : 15),
    rotation: Math.sin(animationTime * (gameMode === "panic" ? 0.3 : 0.15)) * (gameMode === "panic" ? 20 : 12),
    scale: gameMode === "panic" ? 2.0 : 1.8,
  };

  const attackMovement = {
    x: Math.sin(animationTime * 0.8) * 15,
    y: Math.sin(animationTime * 2.0) * 8,
    rotation: Math.sin(animationTime * 3) * 10,
    scale: 2.2,
  };

  const currentMovement = zombieState.isAttacking ? attackMovement : normalMovement;

  return (
    <div
      ref={attackRef}
      className="absolute z-40 origin-bottom"
      style={{
        left: `${centerX - zombieState.currentPosition + currentMovement.x}px`,
        top: "80%",
        transform: `translateY(${currentMovement.y}px)`,
        transition: zombieState.isAttacking ? "transform 0.05s linear" : "transform 0.1s ease-out",
      }}
    >
      <div className="relative">
        {/* Indikator serangan */}
        {zombieState.isAttacking && (
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-3 py-1.5 rounded text-sm bg-red-800/90 text-white animate-pulse border border-red-500 shadow-lg">
            MENYERANG! 🧟‍♂️
          </div>
        )}

        {/* Efek darah saat menyerang */}
        {zombieState.isAttacking && (
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-2 h-8 bg-red-600 animate-drip">
            <div className="absolute bottom-0 w-4 h-4 bg-red-600 rounded-full animate-pulse"></div>
          </div>
        )}

        <Image
          src="/images/zombie.gif"
          alt="Zombie"
          width={140}
          height={140}
          className="drop-shadow-lg"
          unoptimized
          style={{
            imageRendering: "pixelated",
            filter: zombieState.isAttacking
              ? "brightness(1.4) contrast(1.6) saturate(1.4) drop-shadow(0 0 20px rgba(255,50,50,0.8))"
              : gameMode === "panic"
                ? "brightness(1.3) contrast(1.5) saturate(1.3) drop-shadow(0 0 10px rgba(255,50,50,0.5))"
                : "brightness(1.1) contrast(1.2)",
            transform: `scale(${currentMovement.scale}) rotate(${currentMovement.rotation}deg)`,
            transformOrigin: "bottom center",
            transition: "all 0.1s ease-out",
          }}
        />

        {/* Jejak zombie saat menyerang */}
        {zombieState.isAttacking &&
          [...Array(4)].map((_, i) => (
            <div key={`blood-trail-${i}`} className="absolute top-0 left-0">
              <Image
                src="/images/zombie.gif"
                alt="Zombie Trail"
                width={140}
                height={140}
                className="absolute"
                unoptimized
                style={{
                  imageRendering: "pixelated",
                  opacity: 0.35 - i * 0.1,
                  filter: "brightness(0.7) contrast(1.1) hue-rotate(10deg)",
                  transform: `translateX(${-15 - i * 10}px) scale(${0.95 - i * 0.1})`,
                  animation: `fadeOut 0.6s ${i * 0.15}s forwards`,
                }}
              />
            </div>
          ))}

        {/* Efek aura */}
        <div
          className={`absolute -inset-3 rounded-full blur-md ${
            zombieState.isAttacking
              ? "bg-red-600 opacity-25 animate-pulse-slow"
              : gameMode === "panic"
                ? "bg-red-500 opacity-15"
                : "bg-green-500 opacity-10"
          }`}
        />

        {/* Indikator kecepatan zombie */}
        <p
          className={`absolute -bottom-8 left-1/2 transform -translate-x-1/2 font-mono text-sm ${
            zombieState.isAttacking ? "text-red-400 animate-pulse" : "text-gray-400"
          }`}
        >
          Kecepatan: {ZOMBIE_SPEED}
        </p>
      </div>

      <style jsx>{`
        @keyframes drip {
          0% {
            height: 0;
            opacity: 1;
          }
          50% {
            height: 8px;
            opacity: 1;
          }
          100% {
            height: 16px;
            opacity: 0;
          }
        }
        .animate-drip {
          animation: drip 0.7s infinite;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 0.9;
          }
          50% {
            opacity: 1;
          }
        }
        .animate-pulse {
          animation: pulse 0.6s infinite;
        }

        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.3;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 1.8s infinite;
        }

        @keyframes fadeOut {
          0% {
            opacity: 0.35;
          }
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}