
// src/components/game/GameOverScreen.tsx
"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { motion, Transition } from "framer-motion"
import Image from "next/image"

const characterGifs = [
  '/character.gif',
  '/character1.gif',
  '/character2.gif',
  '/character3.gif',
  '/character4.gif'
]

export default function GameOverScreen() {
  const params = useParams()
  const router = useRouter()
  const roomCode = params.roomCode as string

  const [countdown, setCountdown] = useState(7)
  const isMountedRef = useRef(true)

  const getRandomCharacterGif = () => {
    return characterGifs[Math.floor(Math.random() * characterGifs.length)]
  }

  // Countdown effect for redirect
  useEffect(() => {
    if (!isMountedRef.current) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push(
            `/game/${roomCode}/results`
          )
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [roomCode, router])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background Layers */}
      <div className="absolute inset-0 bg-[url('/images/dark-clouds.png')] opacity-30 animate-pulse" />
      <div className="absolute inset-0 bg-[url('/images/fog-texture1.png')] opacity-20 animate-[fog_20s_linear_infinite]" />
      <div className="absolute inset-0 bg-gradient-to-b from-red-900/20 via-black to-purple-900/20" />

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-red-900 rounded-full opacity-15 blur-2xl" />
        <div className="absolute top-1/3 right-20 w-24 h-24 bg-red-900 rounded-full opacity-15 blur-2xl" />
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-red-900 rounded-full opacity-15 blur-2xl" />
        <div className="absolute bottom-1/3 right-1/4 w-20 h-20 bg-red-900 rounded-full opacity-15 blur-2xl" />
      </div>

      <div className="absolute top-20 left-10 opacity-25">
        <Image src="/images/tombstone.png" width={80} height={80} alt="Tombstone" />
      </div>
      <div className="absolute top-1/3 right-10 opacity-25">
        <Image src="/images/dead-tree.png" width={120} height={120} alt="Dead tree" />
      </div>
      <div className="absolute bottom-20 left-20 opacity-25">
        <Image src="/images/spooky-tree-2.png" width={100} height={100} alt="Spooky tree" />
      </div>

      {/* Blood Drips Animation */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-red-900 rounded-full"
            initial={{
              x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1000),
              y: -10,
              opacity: 0.7,
            }}
            animate={{
              y: typeof window !== "undefined" ? window.innerHeight + 10 : 1010,
              opacity: [0.7, 0.9, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 3,
              repeat: Infinity,
              repeatType: "loop",
              delay: Math.random() * 5,
            } as Transition}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-center mb-8"
        >
          <h1 className="text-6xl font-bold text-red-600 font-horror tracking-widest drop-shadow-[0_0_12px_rgba(255,0,0,0.8)] animate-[pulse_2s_ease-in-out_infinite]">
            Kamu Telah Binasa
          </h1>
          <p className="text-gray-400 font-mono text-lg mt-4 tracking-widest">
           Mengarahkan ke halaman hasil {countdown} detik...
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
          className="relative"
        >
          <div className="absolute inset-0 bg-red-900/30 rounded-full blur-md animate-pulse" />
          <Image
            src={getRandomCharacterGif()}
            width={200}
            height={200}
            alt="Character"
            className="relative rounded-full border-4 border-red-900/50 shadow-[0_0_20px_rgba(255,0,0,0.5)]"
          />
        </motion.div>
      </div>

      {/* Custom Animations */}
      <style jsx global>{`
        @keyframes fog {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 1000px 1000px;
          }
        }
      `}</style>
    </div>
  )
}
