
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Gamepad2, Users, Play, Hash, Sparkles, Zap, Settings } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { motion } from "framer-motion"

export default function HomePage() {
  const [gameCode, setGameCode] = useState("")
  const [nickname, setNickname] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false)
  const [quizzes, setQuizzes] = useState<any[]>([])
  const router = useRouter()
  const searchParams = useSearchParams();

  useEffect(() => {
    const codeFromUrl = searchParams.get('code');

    if (codeFromUrl) {
      console.log(`Menemukan kode ruangan dari URL: ${codeFromUrl}`);
      setGameCode(codeFromUrl.toUpperCase());
      window.history.replaceState(null, '', '/');
    }
  }, [searchParams]);


  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  const fetchQuizzes = async () => {
    try {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
      if (error) throw error
      setQuizzes(data || [])
    } catch (error) {
      console.error("Error fetching quizzes:", error)
    }
  }

  const handleHostGame = async () => {
    setIsCreating(true)
    await fetchQuizzes()
    setIsQuizDialogOpen(true)
    setIsCreating(false)
  }

  const handleQuizSelect = async (quizId: string) => {
    setIsCreating(true)
    try {
      const roomCode = generateRoomCode()
      const { data, error } = await supabase
        .from("game_rooms")
        .insert({
          room_code: roomCode,
          title: "Zombie Run Game",
          quiz_id: quizId, // Store selected quiz_id
        })
        .select()
        .single()

      if (error) throw error

      router.push(`/character-select/${roomCode}`)
    } catch (error) {
      console.error("Error creating game:", error)
      alert("Gagal membuat game!")
    } finally {
      setIsCreating(false)
      setIsQuizDialogOpen(false)
    }
  }

  const handleJoinGame = async () => {
    if (!gameCode || !nickname) return

    setIsJoining(true)
    try {
      const { data: room, error } = await supabase
        .from("game_rooms")
        .select("*")
        .eq("room_code", gameCode.toUpperCase())
        .single()

      if (error || !room) {
        alert("Kode game tidak ditemukan!")
        return
      }

      const { count } = await supabase.from("players").select("*", { count: "exact" }).eq("room_id", room.id)

      if (count && count >= room.max_players) {
        alert("Room sudah penuh!")
        return
      }

      const { error: playerError } = await supabase.from("players").insert({
        room_id: room.id,
        nickname: nickname,
        character_type: `robot${Math.floor(Math.random() * 4) + 1}`,
      })

      if (playerError) throw playerError

      localStorage.setItem("nickname", nickname)
      localStorage.setItem("roomCode", gameCode.toUpperCase())

      router.push(`/game/${gameCode.toUpperCase()}`)
    } catch (error) {
      console.error("Error joining game:", error)
      alert("Gagal bergabung ke game!")
    } finally {
      setIsJoining(false)
    }
  }

  const handleSettingsClick = () => {
    router.push("/questions")
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_50%,transparent_75%)]" />

      <div className="relative z-14 flex items-center justify-center min-h-screen p-4">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 text-white hover:bg-white/10"
          onClick={handleSettingsClick}
        >
          <Settings className="h-6 w-6" />
        </Button>

        <div className="w-full max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="mr-4"
              >
                <Gamepad2 className="w-16 h-16 text-white" />
              </motion.div>
              <h1 className="text-6xl md:text-8xl font-black bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Zombie Run
              </h1>
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="ml-4"
              >
                <Gamepad2 className="w-16 h-16 text-white" />
              </motion.div>
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-lg md:text-2xl text-gray-400 font-light"
            >
              Kolaborasi game dan kuis seru untuk menguji pengetahuanmu!
            </motion.p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              whileHover={{ scale: 1.02 }}
              className="group"
            >
              <Card className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300 h-full">
                <CardHeader className="text-center pb-6">
                  <motion.div
                    className="w-20 h-20 bg-gradient-to-br from-gray-800 to-black border-2 border-white rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-2xl group-hover:shadow-white/20 transition-all duration-300"
                    whileHover={{ rotate: -5 }}
                  >
                    <Hash className="w-10 h-10 text-white" />
                  </motion.div>
                  <CardTitle className="text-3xl font-bold text-white mb-2">Join Game</CardTitle>
                  <CardDescription className="text-gray-400 text-lg">
                    Ayo gabung seru-seruan!
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-0">
                  <div className="space-y-4">
                    <div>
                      <Input
                        placeholder="Masukkan kode game"
                        value={gameCode}
                        onChange={(e) => {
                          let value = e.target.value;

                          try {
                            if (value.includes('http') && value.includes('?code=')) {
                              const url = new URL(value);
                              const codeFromUrl = url.searchParams.get('code');

                              if (codeFromUrl) {
                                value = codeFromUrl;
                              }
                            }
                          } catch (error) {
                            console.warn("Bukan URL yang valid, melanjutkan seperti biasa.");
                          }

                          const processedCode = value.toUpperCase().slice(0, 6);
                          setGameCode(processedCode);
                        }}
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 text-center text-xl font-mono h-12 rounded-xl focus:border-white/40 focus:ring-white/20"
                      // maxLength={6}
                      />
                    </div>
                    <div>
                      <Input
                        placeholder="Nama kamu"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 text-center text-xl font-mono h-12 rounded-xl focus:border-white/40 focus:ring-white/20"
                        maxLength={20}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleJoinGame}
                    disabled={!gameCode || !nickname || isJoining}
                    className="w-full bg-black border-2 border-white text-white hover:bg-white hover:text-black font-bold py-4 text-lg rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isJoining ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        className="w-5 h-5 mr-2"
                      >
                        <Zap className="w-5 h-5" />
                      </motion.div>
                    ) : (
                      <Hash className="w-5 h-5 mr-2" />
                    )}
                    {isJoining ? "Bergabung..." : "Bergabung ke Game"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Host Game Card */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              whileHover={{ scale: 1.02 }}
              className="group"
            >
              <Card className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300 h-full">
                <CardHeader className="text-center pb-6">
                  <motion.div
                    className="w-20 h-20 bg-gradient-to-br from-white to-gray-300 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-2xl group-hover:shadow-white/20 transition-all duration-300"
                    whileHover={{ rotate: 5 }}
                  >
                    <Users className="w-10 h-10 text-black" />
                  </motion.div>
                  <CardTitle className="text-3xl font-bold text-white mb-2">Host Game</CardTitle>
                  <CardDescription className="text-gray-400 text-lg">
                    Buat ruangan baru dan undang temanmu untuk main bareng.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    onClick={handleHostGame}
                    disabled={isCreating}
                    className="w-full bg-white text-black hover:bg-gray-200 font-bold py-4 text-lg rounded-xl transition-all duration-300 group-hover:shadow-lg disabled:opacity-50 cursor-pointer"
                  >
                    {isCreating ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        className="w-5 h-5 mr-2"
                      >
                        <Zap className="w-5 h-5" />
                      </motion.div>
                    ) : (
                      <Play className="w-5 h-5 mr-2" />
                    )}
                    {isCreating ? "Membuat Game..." : "Buat Game Baru"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="text-center mt-16"
          >
          </motion.div>
        </div>
      </div>

      <Dialog open={isQuizDialogOpen} onOpenChange={setIsQuizDialogOpen}>
        <DialogContent className="bg-black/95 text-white border-red-500/50 max-w-4xl rounded-xl p-6 shadow-[0_0_15px_rgba(255,0,0,0.5)] max-h-[80vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-red-400 font-mono tracking-wider">
              Pilih Kuis
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes.map((quiz) => (
              <Card
                key={quiz.id}
                className="bg-black/40 border-red-500/20 hover:border-red-500 cursor-pointer"
                onClick={() => handleQuizSelect(quiz.id)}
              >
                <CardHeader>
                  <CardTitle className="text-red-400 font-mono">{quiz.theme}</CardTitle>
                  <CardDescription className="text-red-400/80">{quiz.description || "Kuis seru untuk dimainkan!"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-red-400 text-sm font-mono">Durasi: {quiz.duration} menit</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(26, 0, 0, 0.8);
          border-left: 2px solid rgba(255, 0, 0, 0.3);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #8b0000, #ff0000);
          border-radius: 4px;
        }
      `}</style>
    </div>
  )
}
