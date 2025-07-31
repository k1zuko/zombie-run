"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"

interface Arena3DProps {
  players: Array<{
    id: string
    nickname: string
    character_type: string
    position_x: number
    position_y: number
    isCurrentPlayer?: boolean
  }>
  robot: {
    x: number
    y: number
    isActive: boolean
  }
  level: number
  timeLeft: number
  safeZones?: Array<{
    x: number
    y: number
    width: number
    height: number
    occupied: number
    required: number
  }>
  showProgressBar?: boolean
  ghostCharacter?: boolean
}

export function Arena3D({
  players,
  robot,
  level,
  timeLeft,
  safeZones,
  showProgressBar = false,
  ghostCharacter = false,
}: Arena3DProps) {
  const [cameraAngle, setCameraAngle] = useState(0)

  // Subtle camera movement for 3D effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCameraAngle((prev) => (prev + 0.3) % 360)
    }, 100)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative w-full h-96">
      {/* Top Progress Bar (like in boost phase) */}
      {showProgressBar && (
        <div className="absolute top-0 left-0 right-0 z-50">
          {/* Ghost Character */}
          {ghostCharacter && (
            <motion.div
              className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50"
              animate={{
                y: [0, -5, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
              }}
            >
              <div className="w-16 h-16 bg-white rounded-full border-4 border-green-400 shadow-lg flex items-center justify-center text-2xl">
                👻
              </div>
              <div className="absolute inset-0 bg-green-400/30 rounded-full blur-md animate-pulse" />
            </motion.div>
          )}

          {/* Progress Bar */}
          <div className="mt-20 mx-8">
            <div className="h-4 bg-gray-800 rounded-full border-2 border-gray-600 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-green-400 to-green-500"
                animate={{ width: `${(timeLeft / 300) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Level and Timer Badges */}
      <div className="absolute top-4 left-4 z-50">
        <div className="bg-green-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
          LEVEL {level}/3
        </div>
      </div>

      <div className="absolute top-4 right-4 z-50">
        <div className="bg-green-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
        </div>
      </div>

      {/* 3D Arena Container */}
      <motion.div
        className="relative w-full h-full mt-16"
        style={{
          perspective: "1000px",
          transform: `rotateX(35deg) rotateY(${cameraAngle * 0.05}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Arena Base Platform */}
        <div
          className="relative w-full h-64 mx-auto"
          style={{
            transform: "translateZ(-40px)",
            transformStyle: "preserve-3d",
          }}
        >
          {/* Pink Tiled Floor */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-pink-300 via-pink-400 to-pink-500 rounded-lg shadow-2xl"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px),
                linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)
              `,
              backgroundSize: "25px 25px, 25px 25px, 5px 5px, 5px 5px",
              transform: "translateZ(0px)",
            }}
          >
            {/* Floor Depth Lines */}
            <div className="absolute inset-0 opacity-30">
              {[...Array(16)].map((_, i) => (
                <div
                  key={`h-${i}`}
                  className="absolute border-b border-pink-600/40"
                  style={{
                    top: `${(i + 1) * 6.25}%`,
                    left: 0,
                    right: 0,
                    height: "1px",
                  }}
                />
              ))}
              {[...Array(20)].map((_, i) => (
                <div
                  key={`v-${i}`}
                  className="absolute border-r border-pink-600/40"
                  style={{
                    left: `${(i + 1) * 5}%`,
                    top: 0,
                    bottom: 0,
                    width: "1px",
                  }}
                />
              ))}
            </div>

            {/* Floor Shadows and Details */}
            <div className="absolute inset-0 opacity-20">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-3 h-3 bg-pink-600/30 rounded-full"
                  style={{
                    left: `${Math.random() * 90 + 5}%`,
                    top: `${Math.random() * 80 + 10}%`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Arena Walls - Gray Metallic */}
          {/* Front Wall */}
          <div
            className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-400 via-gray-300 to-gray-200 border-t-2 border-gray-500"
            style={{
              transform: "rotateX(-90deg) translateZ(6px)",
              transformOrigin: "bottom",
            }}
          />

          {/* Back Wall */}
          <div
            className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-gray-200 via-gray-300 to-gray-400 border-b-2 border-gray-500"
            style={{
              transform: "rotateX(90deg) translateZ(6px)",
              transformOrigin: "top",
            }}
          />

          {/* Left Wall */}
          <div
            className="absolute top-0 bottom-0 left-0 w-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-400 border-r-2 border-gray-500"
            style={{
              transform: "rotateY(90deg) translateZ(6px)",
              transformOrigin: "left",
            }}
          />

          {/* Right Wall */}
          <div
            className="absolute top-0 bottom-0 right-0 w-12 bg-gradient-to-l from-gray-200 via-gray-300 to-gray-400 border-l-2 border-gray-500"
            style={{
              transform: "rotateY(-90deg) translateZ(6px)",
              transformOrigin: "right",
            }}
          />

          {/* Wall Details - Metallic Panels */}
          <div
            className="absolute top-2 left-1/4 w-8 h-4 bg-gray-300 border border-gray-400 rounded opacity-60"
            style={{ transform: "rotateX(90deg) translateZ(6px)" }}
          />
          <div
            className="absolute top-2 right-1/4 w-8 h-4 bg-gray-300 border border-gray-400 rounded opacity-60"
            style={{ transform: "rotateX(90deg) translateZ(6px)" }}
          />

          {/* Safe Zones (if in minigame phase) */}
          {safeZones?.map((zone, index) => (
            <motion.div
              key={index}
              className="absolute bg-green-400/70 border-4 border-green-300 rounded-lg shadow-lg"
              style={{
                left: `${zone.x}%`,
                top: `${zone.y}%`,
                width: `${zone.width}%`,
                height: `${zone.height}%`,
                transform: "translateZ(4px)",
              }}
              animate={{
                backgroundColor: zone.occupied >= zone.required ? "rgba(34, 197, 94, 0.9)" : "rgba(34, 197, 94, 0.5)",
                boxShadow:
                  zone.occupied >= zone.required
                    ? "0 0 30px rgba(34, 197, 94, 0.8), inset 0 0 20px rgba(34, 197, 94, 0.3)"
                    : "0 0 15px rgba(34, 197, 94, 0.4)",
                scale: zone.occupied >= zone.required ? [1, 1.05, 1] : 1,
              }}
              transition={{
                duration: 0.5,
                repeat: zone.occupied >= zone.required ? Number.POSITIVE_INFINITY : 0,
              }}
            >
              {/* Zone Content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white font-bold text-xs bg-black/30 px-2 py-1 rounded">
                  {zone.occupied}/{zone.required}
                </div>
              </div>

              {/* Zone Glow Effect */}
              <div className="absolute inset-0 bg-green-400/20 rounded-lg blur-sm animate-pulse" />
            </motion.div>
          ))}

          {/* Menacing Robot - Enhanced Design */}
          <motion.div
            className="absolute z-40"
            style={{
              left: `${robot.x}%`,
              top: `${robot.y}%`,
              transform: "translate(-50%, -50%) translateZ(20px)",
            }}
            animate={{
              scale: robot.isActive ? [1, 1.15, 1] : 0.8,
              rotateZ: robot.isActive ? [0, 5, -5, 0] : 0,
            }}
            transition={{
              duration: 0.8,
              repeat: robot.isActive ? Number.POSITIVE_INFINITY : 0,
            }}
          >
            {/* Robot Main Body */}
            <div className="relative w-20 h-20">
              {/* Robot Base */}
              <div className="absolute inset-0 bg-gradient-to-b from-gray-600 via-gray-700 to-gray-800 rounded-lg shadow-2xl border-2 border-gray-500">
                {/* Robot Screen/Face - Red with Angry Expression */}
                <div className="absolute top-2 left-2 right-2 h-10 bg-gradient-to-b from-red-500 to-red-700 rounded border-2 border-red-400 flex items-center justify-center overflow-hidden">
                  <motion.div
                    className="text-white text-lg font-bold"
                    animate={{
                      color: robot.isActive ? ["#ffffff", "#ff6b6b", "#ffffff"] : "#ffffff",
                    }}
                    transition={{
                      duration: 0.3,
                      repeat: robot.isActive ? Number.POSITIVE_INFINITY : 0,
                    }}
                  >
                    😠
                  </motion.div>

                  {/* Screen Glitch Effect */}
                  {robot.isActive && (
                    <motion.div
                      className="absolute inset-0 bg-red-300/50"
                      animate={{
                        opacity: [0, 0.8, 0],
                        scaleX: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 0.1,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatDelay: 1,
                      }}
                    />
                  )}
                </div>

                {/* Robot Arms - Mechanical with Cyan Lightning */}
                <motion.div
                  className="absolute -left-3 top-6 w-6 h-8 bg-gradient-to-b from-gray-500 to-gray-700 rounded border border-gray-400"
                  animate={{
                    rotateZ: robot.isActive ? [0, -15, 15, 0] : 0,
                  }}
                  transition={{
                    duration: 0.4,
                    repeat: robot.isActive ? Number.POSITIVE_INFINITY : 0,
                  }}
                >
                  {/* Arm Details */}
                  <div className="absolute top-1 left-1 w-1 h-6 bg-gray-400 rounded" />
                  <div className="absolute top-2 left-2 w-2 h-1 bg-red-400 rounded" />
                </motion.div>

                <motion.div
                  className="absolute -right-3 top-6 w-6 h-8 bg-gradient-to-b from-gray-500 to-gray-700 rounded border border-gray-400"
                  animate={{
                    rotateZ: robot.isActive ? [0, 15, -15, 0] : 0,
                  }}
                  transition={{
                    duration: 0.4,
                    repeat: robot.isActive ? Number.POSITIVE_INFINITY : 0,
                  }}
                >
                  {/* Arm Details */}
                  <div className="absolute top-1 right-1 w-1 h-6 bg-gray-400 rounded" />
                  <div className="absolute top-2 right-2 w-2 h-1 bg-red-400 rounded" />
                </motion.div>

                {/* Robot Body Details */}
                <div className="absolute bottom-2 left-2 right-2 h-4 bg-gray-600 rounded border border-gray-500">
                  <div className="absolute top-1 left-1 w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                  <div className="absolute top-1 right-1 w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                </div>
              </div>

              {/* Cyan Lightning Effects */}
              {robot.isActive && (
                <>
                  <motion.div
                    className="absolute top-12 left-1/2 transform -translate-x-1/2 w-1 h-12 bg-cyan-400 shadow-lg"
                    animate={{
                      opacity: [0, 1, 0],
                      scaleY: [0, 1.5, 0],
                      scaleX: [1, 0.5, 1],
                    }}
                    transition={{
                      duration: 0.2,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatDelay: 0.8,
                    }}
                  />

                  {/* Lightning Branches */}
                  <motion.div
                    className="absolute top-14 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-cyan-300"
                    animate={{
                      opacity: [0, 1, 0],
                      rotateZ: [0, 45, -45, 0],
                    }}
                    transition={{
                      duration: 0.15,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatDelay: 1,
                    }}
                  />
                </>
              )}

              {/* Menacing Aura */}
              {robot.isActive && <div className="absolute inset-0 bg-red-500/20 rounded-lg blur-lg animate-pulse" />}

              {/* Robot Shadow */}
              <div
                className="absolute top-full left-1/2 transform -translate-x-1/2 w-16 h-4 bg-black/30 rounded-full blur-sm"
                style={{ transform: "translateZ(-2px)" }}
              />
            </div>
          </motion.div>

          {/* Players - Enhanced Character Design */}
          {players.map((player, index) => (
            <motion.div
              key={player.id}
              className={`absolute z-30 ${player.isCurrentPlayer ? "z-35" : ""}`}
              style={{
                left: `${player.position_x}%`,
                top: `${player.position_y}%`,
                transform: "translate(-50%, -50%) translateZ(12px)",
              }}
              animate={{
                y: [0, -3, 0],
                scale: player.isCurrentPlayer ? [1, 1.15, 1] : [1, 1.05, 1],
              }}
              transition={{
                duration: 1.2,
                repeat: Number.POSITIVE_INFINITY,
                delay: index * 0.2,
              }}
            >
              {/* Player Character Body */}
              <div className="relative w-10 h-10">
                {/* Character Base */}
                <div
                  className={`absolute inset-0 rounded-full shadow-lg border-2 ${
                    player.character_type === "robot1"
                      ? "bg-gradient-to-b from-blue-400 to-blue-600 border-blue-300"
                      : player.character_type === "robot2"
                        ? "bg-gradient-to-b from-yellow-400 to-yellow-600 border-yellow-300"
                        : player.character_type === "robot3"
                          ? "bg-gradient-to-b from-green-400 to-green-600 border-green-300"
                          : "bg-gradient-to-b from-purple-400 to-purple-600 border-purple-300"
                  }`}
                >
                  {/* Character Face/Details */}
                  <div className="absolute inset-1 bg-white rounded-full flex items-center justify-center border border-gray-200">
                    <div className="text-sm">
                      {player.character_type === "robot1"
                        ? "🤖"
                        : player.character_type === "robot2"
                          ? "👾"
                          : player.character_type === "robot3"
                            ? "🚀"
                            : "⚡"}
                    </div>
                  </div>

                  {/* Character Accessories */}
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-2 bg-gray-300 rounded-t border border-gray-400" />
                </div>

                {/* Player Glow Effect */}
                {player.isCurrentPlayer && (
                  <div className="absolute inset-0 bg-white/50 rounded-full blur-sm animate-pulse" />
                )}

                {/* Player Name Tag */}
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-white font-bold bg-black/60 px-2 py-1 rounded whitespace-nowrap border border-white/20">
                  {player.nickname}
                </div>

                {/* Player Shadow */}
                <div
                  className="absolute top-full left-1/2 transform -translate-x-1/2 w-8 h-2 bg-black/20 rounded-full blur-sm"
                  style={{ transform: "translateZ(-2px)" }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
