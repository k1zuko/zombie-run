// "use client"

// import { motion } from "framer-motion"
// import { Card, CardContent } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { Skull, Users, Clock, Zap } from "lucide-react"
// import type { Player } from "@/lib/supabase"

// interface LobbyPhaseProps {
//   currentPlayer: Player | null
//   players: Player[]
//   isSoloMode: boolean
//   wrongAnswers: number
// }

// const characterEmojis = {
//   robot1: "👻",
//   robot2: "🧟",
//   robot3: "💀",
//   robot4: "🎃",
// } as const

// const FLOATING_SPIRITS = ["👻", "🦇", "🕷️", "💀", "⚡", "🌙"] as const

// export default function LobbyPhase({ currentPlayer, players, isSoloMode }: LobbyPhaseProps) {
//   if (!currentPlayer) {
//     return (
//       <div className="min-h-screen flex items-center justify-center p-4">
//         <div className="text-center">
//           <div className="text-6xl mb-4 animate-pulse">⏳</div>
//           <div className="text-red-400 text-xl">Awakening your soul...</div>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
//       {/* Enhanced floating spirits */}
//       <div className="absolute inset-0 pointer-events-none">
//         {Array.from({ length: 8 }, (_, i) => (
//           <motion.div
//             key={i}
//             className="absolute text-3xl opacity-30"
//             initial={{
//               x: `${5 + i * 12}%`,
//               y: `${85 - i * 10}%`,
//             }}
//             animate={{
//               y: -120,
//               opacity: [0.1, 0.6, 0.1],
//               rotate: [0, 360],
//               scale: [0.8, 1.2, 0.8],
//             }}
//             transition={{
//               duration: 10 + i * 1.5,
//               repeat: Number.POSITIVE_INFINITY,
//               delay: i * 0.8,
//               ease: "easeInOut",
//             }}
//             style={{
//               filter: "drop-shadow(0 0 12px rgba(220, 38, 38, 0.6))",
//             }}
//           >
//             {FLOATING_SPIRITS[i % FLOATING_SPIRITS.length]}
//           </motion.div>
//         ))}
//       </div>

//       <div className="relative z-10 max-w-2xl w-full space-y-8">
//         {/* Enhanced title with better typography */}
//         <motion.div
//           initial={{ opacity: 0, scale: 0.8 }}
//           animate={{ opacity: 1, scale: 1 }}
//           transition={{ duration: 1, ease: "easeOut" }}
//           className="text-center"
//         >
//           <motion.h1
//             className="text-7xl md:text-8xl font-black mb-6 bg-gradient-to-r from-red-500 via-red-400 to-orange-500 bg-clip-text text-transparent"
//             animate={{
//               textShadow: [
//                 "0 0 20px rgba(220, 38, 38, 0.5)",
//                 "0 0 40px rgba(220, 38, 38, 0.8)",
//                 "0 0 20px rgba(220, 38, 38, 0.5)",
//               ],
//             }}
//             transition={{
//               duration: 3,
//               repeat: Number.POSITIVE_INFINITY,
//               ease: "easeInOut",
//             }}
//           >
//             GHOST HUNT
//           </motion.h1>
//           <motion.p
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.5 }}
//             className="text-red-300 text-xl font-medium leading-relaxed"
//           >
//             The ritual chamber awaits... Prepare your soul for the ultimate test
//           </motion.p>
//         </motion.div>

//         {/* Enhanced player card */}
//         <motion.div
//           initial={{ opacity: 0, y: 50 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.4, duration: 0.8 }}
//         >
//           <Card className="bg-black/90 backdrop-blur-xl border-2 border-red-800/50 shadow-2xl shadow-red-900/25 overflow-hidden">
//             <CardContent className="p-8 text-center relative">
//               {/* Enhanced card glow effect */}
//               <div className="absolute inset-0 bg-gradient-to-br from-red-950/30 via-transparent to-red-950/10 rounded-lg" />

//               {/* Animated character */}
//               <motion.div
//                 className="text-8xl mb-6 relative z-10"
//                 animate={{
//                   scale: [1, 1.15, 1],
//                   filter: [
//                     "drop-shadow(0 0 15px rgba(220, 38, 38, 0.5))",
//                     "drop-shadow(0 0 30px rgba(220, 38, 38, 0.8))",
//                     "drop-shadow(0 0 15px rgba(220, 38, 38, 0.5))",
//                   ],
//                 }}
//                 transition={{
//                   duration: 2.5,
//                   repeat: Number.POSITIVE_INFINITY,
//                   ease: "easeInOut",
//                 }}
//               >
//                 {characterEmojis[currentPlayer.character_type as keyof typeof characterEmojis]}
//               </motion.div>

//               <h2 className="text-4xl font-bold text-white mb-6 relative z-10">{currentPlayer.nickname}</h2>

//               <Badge
//                 variant="secondary"
//                 className="bg-red-900/50 text-red-200 border border-red-700/50 px-6 py-3 text-lg font-semibold relative z-10 mb-6"
//               >
//                 💀 Soul Ready for Sacrifice
//               </Badge>

//               {/* Enhanced solo mode warning */}
//               {isSoloMode && (
//                 <motion.div
//                   className="mt-6 p-6 bg-red-950/40 border-2 border-red-700/50 rounded-xl relative z-10"
//                   animate={{
//                     borderColor: ["rgba(185, 28, 28, 0.5)", "rgba(220, 38, 38, 0.8)", "rgba(185, 28, 28, 0.5)"],
//                   }}
//                   transition={{
//                     duration: 2,
//                     repeat: Number.POSITIVE_INFINITY,
//                   }}
//                 >
//                   <div className="flex items-center justify-center gap-3 mb-3">
//                     <Skull className="w-6 h-6 text-red-400" />
//                     <p className="text-red-300 text-lg font-bold">SOLO RITUAL MODE</p>
//                     <Skull className="w-6 h-6 text-red-400" />
//                   </div>
//                   <p className="text-red-400 text-sm">Five wrong answers will seal your doom forever!</p>
//                 </motion.div>
//               )}
//             </CardContent>
//           </Card>
//         </motion.div>

//         {/* Enhanced player count and stats */}
//         <motion.div
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           transition={{ delay: 0.8 }}
//           className="grid grid-cols-1 md:grid-cols-3 gap-4"
//         >
//           <Card className="bg-black/80 border-2 border-red-800/30 p-4 hover:border-red-600/50 transition-all duration-300">
//             <div className="text-center">
//               <Users className="w-8 h-8 text-red-400 mx-auto mb-2" />
//               <div className="text-2xl font-bold text-white">{players.length}</div>
//               <div className="text-sm text-red-300 font-semibold">Souls Gathered</div>
//             </div>
//           </Card>

//           <Card className="bg-black/80 border-2 border-red-800/30 p-4 hover:border-red-600/50 transition-all duration-300">
//             <div className="text-center">
//               <Clock className="w-8 h-8 text-red-400 mx-auto mb-2" />
//               <div className="text-2xl font-bold text-white">Ready</div>
//               <div className="text-sm text-red-300 font-semibold">Status</div>
//             </div>
//           </Card>

//           <Card className="bg-black/80 border-2 border-red-800/30 p-4 hover:border-red-600/50 transition-all duration-300">
//             <div className="text-center">
//               <Zap className="w-8 h-8 text-red-400 mx-auto mb-2" />
//               <div className="text-2xl font-bold text-white">∞</div>
//               <div className="text-sm text-red-300 font-semibold">Dark Power</div>
//             </div>
//           </Card>
//         </motion.div>

//         {/* Waiting indicator */}
//         <motion.div
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           transition={{ delay: 1.2 }}
//           className="text-center"
//         >
//           <motion.div
//             animate={{
//               scale: [1, 1.1, 1],
//               opacity: [0.5, 1, 0.5],
//             }}
//             transition={{
//               duration: 2,
//               repeat: Number.POSITIVE_INFINITY,
//             }}
//             className="text-red-300 text-lg font-semibold"
//           >
//             Waiting for the ritual to begin...
//           </motion.div>
//         </motion.div>
//       </div>
//     </div>
//   )
// }
"use client"

import { useEffect, useState } from "react"
import { Skull, Eye, Zap } from "lucide-react"

export default function LoadingScreen() {
  const [dots, setDots] = useState("")
  const [glitchText, setGlitchText] = useState("LOADING")

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."))
    }, 500)

    const glitchInterval = setInterval(() => {
      const glitchChars = ["L0AD1NG", "L04D1N6", "LOADING", "L∅∆D1NG", "LØ∆ÐING"]
      setGlitchText(glitchChars[Math.floor(Math.random() * glitchChars.length)])
    }, 200)

    return () => {
      clearInterval(interval)
      clearInterval(glitchInterval)
    }
  }, [])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-950/20 via-black to-purple-950/20" />

      {/* Floating particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-red-500/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Main loading content */}
      <div className="text-center z-10 space-y-8">
        {/* Skull icon with glow */}
        <div className="relative">
          <Skull className="w-24 h-24 text-red-500 mx-auto animate-pulse drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]" />
          <div className="absolute inset-0 w-24 h-24 mx-auto">
            <Eye className="w-6 h-6 text-yellow-400 absolute top-6 left-7 animate-ping" />
            <Eye
              className="w-6 h-6 text-yellow-400 absolute top-6 right-7 animate-ping"
              style={{ animationDelay: "0.5s" }}
            />
          </div>
        </div>

        {/* Glitch loading text */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-white font-mono tracking-wider">
            <span className="inline-block animate-pulse text-red-500">{glitchText}</span>
            <span className="text-red-400">{dots}</span>
          </h1>

          {/* Loading bar */}
          <div className="w-64 h-2 bg-gray-800 rounded-full mx-auto overflow-hidden border border-red-900/50">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"
              style={{ width: "100%", animation: "loading 2s ease-in-out infinite" }}
            />
          </div>
        </div>

        {/* Atmospheric text */}
        <p className="text-gray-400 text-sm font-mono tracking-wide animate-pulse">Summoning dark forces...</p>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-4 left-4">
        <Zap className="w-6 h-6 text-purple-500 animate-pulse" />
      </div>
      <div className="absolute top-4 right-4">
        <Zap className="w-6 h-6 text-purple-500 animate-pulse" style={{ animationDelay: "1s" }} />
      </div>
      <div className="absolute bottom-4 left-4">
        <Zap className="w-6 h-6 text-purple-500 animate-pulse" style={{ animationDelay: "0.5s" }} />
      </div>
      <div className="absolute bottom-4 right-4">
        <Zap className="w-6 h-6 text-purple-500 animate-pulse" style={{ animationDelay: "1.5s" }} />
      </div>

      <style jsx>{`
        @keyframes loading {
          0%, 100% { width: 20%; }
          50% { width: 100%; }
        }
      `}</style>
    </div>
  )
}
