"use client"

import { motion, AnimatePresence } from "framer-motion"

interface GameEffect {
  id: string
  type: string
  x: number
  y: number
}

interface GameEffectsProps {
  effects: GameEffect[]
}

export default function GameEffects({ effects }: GameEffectsProps) {
  return (
    <AnimatePresence>
      {effects.map((effect) => (
        <motion.div
          key={effect.id}
          className="fixed text-2xl z-50 pointer-events-none font-bold"
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: 1,
            scale: [0, 2, 1.5],
            y: [-20, -60, -100],
          }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: 2 }}
        >
          {effect.type === "correct" && <span className="text-green-400 drop-shadow-lg">✅ +100</span>}
          {effect.type === "wrong" && <span className="text-red-400 drop-shadow-lg">❌ SALAH</span>}
          {effect.type === "caught" && <span className="text-red-500 drop-shadow-lg">👻 TERTANGKAP!</span>}
          {effect.type === "escape" && <span className="text-yellow-400 drop-shadow-lg">⚡ KABUR!</span>}
          {effect.type === "boost" && <span className="text-green-400 drop-shadow-lg">🏃 KABUR!</span>}
        </motion.div>
      ))}
    </AnimatePresence>
  )
}
