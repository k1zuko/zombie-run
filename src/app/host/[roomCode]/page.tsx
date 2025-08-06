"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Users, Play, Settings, Copy, Check, Clock, Trophy, Zap, Wifi } from "lucide-react"
import { supabase, type GameRoom, type Player } from "@/lib/supabase"
import { motion, AnimatePresence } from "framer-motion"

export default function HostPage() {
  const params = useParams()
  const router = useRouter()
  const roomCode = params.roomCode as string

  const [room, setRoom] = useState<GameRoom | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [copied, setCopied] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected">("connecting")
  const [countdown, setCountdown] = useState<number | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Pengaturan Game
  const [gameDuration, setGameDuration] = useState<string>("600") // Default 10 menit (dalam detik)
  const [questionCount, setQuestionCount] = useState<string>("20") // Default 20 soal

  const TOTAL_QUESTIONS_AVAILABLE = 50; // Total soal yang tersedia

  // Fetch room data
  const fetchRoom = useCallback(async () => {
    if (!roomCode) return

    try {
      const { data, error } = await supabase.from("game_rooms").select("*").eq("room_code", roomCode).single()

      if (error || !data) {
        console.error("Room not found:", error)
        router.push("/")
        return
      }

      console.log("Fetched room:", data)
      setRoom(data)
      setGameDuration(data.duration?.toString() || "600")
      setQuestionCount(data.question_count?.toString() || "20")
      return data
    } catch (error) {
      console.error("Error fetching room:", error)
      router.push("/")
    }
  }, [roomCode, router])

  // Fetch players data
  const fetchPlayers = useCallback(async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .eq("room_id", roomId)
        .order("joined_at", { ascending: true })

      if (error) {
        console.error("Error fetching players:", error)
        return
      }

      console.log("Fetched players:", data)
      setPlayers(data || [])
    } catch (error) {
      console.error("Error fetching players:", error)
    }
  }, [])

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true)
      const roomData = await fetchRoom()
      if (roomData) {
        await fetchPlayers(roomData.id)
      }
      setIsLoading(false)
    }

    initializeData()
  }, [fetchRoom, fetchPlayers])

  // Setup realtime subscriptions
  useEffect(() => {
    if (!room?.id) return

    console.log("Setting up realtime for room:", room.id)

    const channel = supabase
      .channel(`room_${room.id}_host`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          console.log("Players change detected:", payload)
          fetchPlayers(room.id)
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_rooms",
          filter: `id=eq.${room.id}`,
        },
        (payload) => {
          console.log("Room change detected:", payload)
          setRoom(payload.new as GameRoom)
          setGameDuration((payload.new as GameRoom).duration?.toString() || "600")
          setQuestionCount((payload.new as GameRoom).question_count?.toString() || "20")
          if (payload.new.current_phase === "quiz") {
            console.log("Redirecting host to quiz page:", `/game/${roomCode}/host`)
            router.push(`/game/${roomCode}/host`)
          }
        }
      )
      .subscribe((status, err) => {
        console.log("Subscription status:", status, err ? err.message : "")
        if (status === "SUBSCRIBED") {
          setConnectionStatus("connected")
        } else if (status === "CHANNEL_ERROR") {
          setConnectionStatus("disconnected")
          console.error("Subscription error:", err?.message)
        } else {
          setConnectionStatus("connecting")
        }
      })

    return () => {
      console.log("Unsubscribing from channel")
      channel.unsubscribe()
    }
  }, [room?.id, fetchPlayers, roomCode, router])

  const copyRoomCode = async () => {
    await navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const saveSettings = async () => {
    if (!room) return

    try {
      const { error } = await supabase
        .from("game_rooms")
        .update({
          duration: parseInt(gameDuration),
          question_count: parseInt(questionCount),
          updated_at: new Date().toISOString(),
        })
        .eq("id", room.id)

      if (error) {
        throw new Error(`Gagal menyimpan pengaturan: ${error.message}`)
      }

      console.log("Settings saved:", { duration: parseInt(gameDuration), question_count: parseInt(questionCount) })
      setRoom({
        ...room,
        duration: parseInt(gameDuration),
        question_count: parseInt(questionCount),
      })
      setIsSettingsOpen(false)
    } catch (error) {
      console.error("Error saving settings:", error)
      alert("Gagal menyimpan pengaturan: " + (error instanceof Error ? error.message : "Kesalahan tidak diketahui"))
    }
  }

  const startGame = async () => {
    if (!room || players.length === 0) {
      console.error("Cannot start game: No room or players")
      alert("Gagal memulai game: Tidak ada ruangan atau pemain.")
      return
    }

    setIsStarting(true)

    try {
      // Fetch and randomize questions from quiz_questions
      const { data: questions, error: quizError } = await supabase
        .from("quiz_questions")
        .select("id, question_type, question_text, image_url, options, correct_answer");

      if (quizError || !questions || questions.length === 0) {
        throw new Error(`Gagal mengambil soal: ${quizError?.message || "Bank soal kosong"}`);
      }


      // Randomize questions and select based on question_count
      const selectedQuestionCount = parseInt(questionCount);

      const shuffledQuestions = questions
        .map((value) => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value)
        .slice(0, Math.min(selectedQuestionCount, questions.length));


      const formattedQuestions = shuffledQuestions.map((q, index) => ({
        id: q.id,
        question_index: index + 1,
        question_type: q.question_type, // 'TEXT' atau 'IMAGE'
        question_text: q.question_text, // Teks pertanyaan
        image_url: q.image_url,         // URL gambar (bisa null)
        options: q.options,             // Array pilihan jawaban
        correct_answer: q.correct_answer, // Jawaban benar
      }));


      // Update game_rooms with randomized questions and game settings
      const { error: roomError } = await supabase
        .from("game_rooms")
        .update({
          status: "playing",
          current_phase: "quiz",
          questions: formattedQuestions, // Simpan soal yang sudah diformat
          duration: parseInt(gameDuration),
          updated_at: new Date().toISOString(),
        })
        .eq("id", room.id);


      if (roomError) {
        throw new Error(`Gagal memulai game: ${roomError.message}`)
      }

      // Initialize game state
      const { error: stateError } = await supabase.from("game_states").insert({
        room_id: room.id,
        phase: "quiz",
        time_remaining: parseInt(gameDuration),
        lives_remaining: 3,
        target_correct_answers: Math.max(5, players.length * 2),
        current_correct_answers: 0,
        current_question_index: 0,
        status: "playing",
        created_at: new Date().toISOString(),
      })

      if (stateError) {
        throw new Error(`Gagal membuat status permainan: ${stateError.message}`)
      }

      console.log("Game started successfully")
    } catch (error) {
      console.error("Error starting game:", error)
      alert("Gagal memulai game: " + (error instanceof Error ? error.message : "Kesalahan tidak diketahui"))
    } finally {
      setIsStarting(false)
    }
  }

  const characterEmojis = {
    robot1: "🤖",
    robot2: "🦾",
    robot3: "🚀",
    robot4: "⚡",
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          className="w-8 h-8 border-2 border-white border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Room tidak ditemukan</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <audio src="/musics/background-music-room.mp3" autoPlay loop />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.05),transparent_50%)]" />

      <div className="relative z-10 p-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-black mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Zombie Run
            </h1>

            {countdown !== null && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mb-6">
                <div className="text-6xl font-mono text-red-500 animate-pulse drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">
                  {countdown}
                </div>
                <div className="text-xl text-red-400 font-mono mt-2">PERMAINAN DIMULAI DALAM...</div>
              </motion.div>
            )}

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-4 bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20"
            >
              <div className="text-center">
                <div className="text-gray-400 text-sm">Kode Game</div>
                <div className="text-3xl font-mono font-bold text-white tracking-wider">{roomCode}</div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={copyRoomCode}
                className="text-white hover:bg-white/20 rounded-xl"
              >
                <motion.div
                  key={copied ? "check" : "copy"}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </motion.div>
              </Button>

              <div className="flex items-center gap-2">
                <Wifi
                  className={`w-4 h-4 ${connectionStatus === "connected"
                      ? "text-green-400"
                      : connectionStatus === "connecting"
                        ? "text-yellow-400"
                        : "text-red-400"
                    }`}
                />
                <span className="text-xs text-gray-400">
                  {connectionStatus === "connected"
                    ? "Tersambung"
                    : connectionStatus === "connecting"
                      ? "Menghubungkan..."
                      : "Terputus"}
                </span>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-4 gap-4 mb-8"
          >
            <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
              <CardContent className="p-6 text-center">
                <Users className="w-8 h-8 text-white mx-auto mb-2" />
                <motion.div
                  key={players.length}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="text-3xl font-bold text-white mb-1"
                >
                  {players.length}/{room.max_players}
                </motion.div>
                <div className="text-gray-400 text-sm">Pemain</div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
              <CardContent className="p-6 text-center">
                <Clock className="w-8 h-8 text-white mx-auto mb-2" />
                <div className="text-3xl font-bold text-white mb-1">
                  {Math.floor(parseInt(gameDuration) / 60)}:{(parseInt(gameDuration) % 60).toString().padStart(2, "0")}
                </div>
                <div className="text-gray-400 text-sm">Durasi</div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
              <CardContent className="p-6 text-center">
                <Trophy className="w-8 h-8 text-white mx-auto mb-2" />
                <div className="text-3xl font-bold text-white mb-1">{questionCount}</div>
                <div className="text-gray-400 text-sm">Soal</div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-xl border border-white/10">
              <CardContent className="p-6 text-center">
                <Zap className="w-8 h-8 text-white mx-auto mb-2" />
                <div className="text-3xl font-bold text-white mb-1">
                  {countdown !== null ? "Hitung Mundur" : room.status === "waiting" ? "Siap" : "Aktif"}
                </div>
                <div className="text-gray-400 text-sm">Status</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 mb-8">
              <CardHeader>
                <CardTitle className="text-white text-2xl flex items-center gap-3">
                  <Users className="w-6 h-6" />
                  Pemain yang Bergabung
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    {players.length} online
                  </Badge>
                  {connectionStatus === "connected" && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                      className="w-2 h-2 bg-green-400 rounded-full"
                    />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="popLayout">
                  {players.length === 0 ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-12"
                    >
                      <motion.div
                        animate={{
                          scale: [1, 1.1, 1],
                          opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeInOut",
                        }}
                      >
                        <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      </motion.div>
                      <p className="text-gray-400 text-lg mb-2">Menunggu pemain bergabung...</p>
                      <p className="text-gray-600 text-sm">Bagikan kode game untuk mengundang teman!</p>
                    </motion.div>
                  ) : (
                    <motion.div key="players" className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4" layout>
                      <AnimatePresence>
                        {players.map((player, index) => (
                          <motion.div
                            key={player.id}
                            layout
                            initial={{ opacity: 0, scale: 0, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0, y: -20 }}
                            transition={{
                              type: "spring",
                              stiffness: 500,
                              damping: 30,
                              delay: index * 0.05,
                            }}
                            whileHover={{ scale: 1.05 }}
                            className="bg-white/10 rounded-xl p-4 text-center border border-white/10 hover:border-white/20 transition-all duration-300"
                          >
                            <motion.div
                              className="text-3xl mb-2"
                              animate={{
                                rotate: [0, 10, -10, 0],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Number.POSITIVE_INFINITY,
                                delay: index * 0.2,
                              }}
                            >
                              {characterEmojis[player.character_type as keyof typeof characterEmojis] || "🤖"}
                            </motion.div>
                            <div className="text-white font-medium text-sm truncate mb-1">{player.nickname}</div>
                            {player.is_host && (
                              <Badge variant="secondary" className="text-xs bg-white/20 text-white">
                                Host
                              </Badge>
                            )}
                            <div className="text-gray-400 text-xs mt-1">
                              {new Date(player.joined_at).toLocaleTimeString()}
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button
              onClick={() => setIsSettingsOpen(true)}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl px-8 py-3"
            >
              <Settings className="w-5 h-5 mr-2" />
              Pengaturan Permainan
            </Button>

            <Button
              onClick={startGame}
              disabled={players.length === 0 || isStarting || countdown !== null}
              className="bg-white text-black hover:bg-gray-200 font-bold px-12 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {isStarting || countdown !== null ? (
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
              {countdown !== null ? "Memulai..." : isStarting ? "Memulai Permainan..." : "Mulai Permainan"}
            </Button>
          </motion.div>

          {players.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center mt-6"
            >
              <p className="text-gray-500 text-sm">Minimal 1 pemain diperlukan untuk memulai permainan</p>
            </motion.div>
          )}

          {/* Dialog Pengaturan */}
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogContent className="bg-black/95 text-white border-white/20 max-w-md rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Pengaturan Permainan</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-6">
                <div>
                  <Label htmlFor="duration" className="text-white mb-2 block font-medium">
                    Durasi Permainan
                  </Label>
                  <Select value={gameDuration} onValueChange={setGameDuration}>
                    <SelectTrigger className="w-full bg-white/10 border-white/20 text-white rounded-lg">
                      <SelectValue placeholder="Pilih durasi" />
                    </SelectTrigger>
                    <SelectContent className="bg-black/95 text-white border-white/20 rounded-lg">
                      <SelectItem value="180">3 Menit</SelectItem>
                      <SelectItem value="300">5 Menit</SelectItem>
                      <SelectItem value="420">7 Menit</SelectItem>
                      <SelectItem value="600">10 Menit</SelectItem>
                      <SelectItem value="720">12 Menit</SelectItem>
                      <SelectItem value="900">15 Menit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="questionCount" className="text-white mb-2 block font-medium">
                    Jumlah Soal
                  </Label>
                  <Select value={questionCount} onValueChange={setQuestionCount}>
                    <SelectTrigger className="w-full bg-white/10 border-white/20 text-white rounded-lg">
                      <SelectValue placeholder="Pilih jumlah soal" />
                    </SelectTrigger>
                    <SelectContent className="bg-black/95 text-white border-white/20 rounded-lg">
                      <SelectItem value="10">10 Soal</SelectItem>
                      <SelectItem value="20">20 Soal</SelectItem>
                      <SelectItem value="30">30 Soal</SelectItem>
                      <SelectItem value="40">40 Soal</SelectItem>
                      <SelectItem value="50">50 Soal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsSettingsOpen(false)}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-lg"
                >
                  Batal
                </Button>
                <Button
                  onClick={saveSettings}
                  className="bg-white text-black hover:bg-gray-200 rounded-lg"
                >
                  Simpan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}