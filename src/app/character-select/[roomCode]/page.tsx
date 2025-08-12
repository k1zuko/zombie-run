"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skull, Bone, HeartPulse, Ghost, Zap, Clock, BookOpen } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const validChaserTypes = ["zombie", "monster1", "monster2", "monster3", "darknight"] as const;
type ChaserType = typeof validChaserTypes[number];

interface GameRoom {
  id: string;
  room_code: string;
  title: string | null;
  status: "waiting" | "playing" | "finished";
  max_players: number;
  duration: number | null;
  question_count: number | null;
  chaser_type: ChaserType;
}

const chaserOptions = [
  { 
    value: "zombie" as const, 
    name: "Zombie", 
    gif: "/images/zombie.gif", 
    alt: "Zombie Pengejar",
    description: "Lambat tapi tak kenal lelah. Akan terus mengejar tanpa henti."
  },
  { 
    value: "monster1" as const, 
    name: "Mutant Gila", 
    gif: "/images/monster1.gif", 
    alt: "Mutant Gila Pengejar",
    description: "Bergerak cepat dengan pola tak terduga. Sulit ditebak."
  },
  { 
    value: "monster2" as const, 
    name: "Anjing Neraka", 
    gif: "/images/monster2.gif", 
    alt: "Anjing Neraka Pengejar",
    description: "Mengendus mangsanya dari jarak jauh. Kecepatan meningkat saat mendekati korban."
  },
  { 
    value: "monster3" as const, 
    name: "Samurai Pembantai", 
    gif: "/images/monster3.gif", 
    alt: "Samurai Pembantai Pengejar",
    description: "Bergerak dengan presisi mematikan. Menyerang secara tiba-tiba."
  },
  { 
    value: "darknight" as const, 
    name: "Raja Kegelapan", 
    gif: "/images/darknight.gif", 
    alt: "Raja Kegelapan Pengejar",
    description: "Mengendalikan kegelapan itu sendiri. Kecepatan dan pola gerakan berubah-ubah."
  },
];

export default function CharacterSelectPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = params.roomCode as string;

  const [room, setRoom] = useState<GameRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [gameDuration, setGameDuration] = useState<string>("600");
  const [questionCount, setQuestionCount] = useState<string>("20");
  const [chaserType, setChaserType] = useState<ChaserType>("zombie");
  const [flickerText, setFlickerText] = useState(true);
  const [bloodDrips, setBloodDrips] = useState<Array<{ id: number; left: number; speed: number; delay: number }>>([]);
  const [sounds, setSounds] = useState<{ whisper: HTMLAudioElement | null; heartbeat: HTMLAudioElement | null }>({ whisper: null, heartbeat: null });
  const [selectedChaser, setSelectedChaser] = useState<typeof chaserOptions[number] | null>(null);

  useEffect(() => {
    // Initialize sounds
    setSounds({
      whisper: new Audio('/sounds/whisper.mp3'),
      heartbeat: new Audio('/sounds/heartbeat.mp3')
    });

    return () => {
      sounds.whisper?.pause();
      sounds.heartbeat?.pause();
    };
  }, []);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const { data, error } = await supabase
          .from("game_rooms")
          .select("*, chaser_type")
          .eq("room_code", roomCode)
          .single();

        if (error || !data) {
          console.error("Room tidak ditemukan:", error);
          router.push("/");
          return;
        }

        const fetchedChaserType = validChaserTypes.includes(data.chaser_type) ? data.chaser_type : "zombie";
        setRoom({ ...data, chaser_type: fetchedChaserType });
        setGameDuration(data.duration?.toString() || "600");
        setQuestionCount(data.question_count?.toString() || "20");
        setChaserType(fetchedChaserType);
        setIsLoading(false);
      } catch (error) {
        console.error("Error mengambil room:", error);
        router.push("/");
      }
    };

    fetchRoom();
  }, [roomCode, router]);

  useEffect(() => {
    const generateBlood = () => {
      const newBlood = Array.from({ length: 15 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        speed: 0.5 + Math.random() * 2,
        delay: Math.random() * 5,
      }));
      setBloodDrips(newBlood);
    };

    generateBlood();
    const bloodInterval = setInterval(() => {
      generateBlood();
    }, 8000);

    return () => clearInterval(bloodInterval);
  }, []);

  useEffect(() => {
    const flickerInterval = setInterval(
      () => {
        setFlickerText((prev) => !prev);
      },
      100 + Math.random() * 150,
    );

    return () => clearInterval(flickerInterval);
  }, []);

  useEffect(() => {
    if (selectedChaser) {
      sounds.whisper?.play().catch(e => console.log("Autoplay prevented:", e));
      sounds.heartbeat?.play().catch(e => console.log("Autoplay prevented:", e));
    }

    return () => {
      sounds.whisper?.pause();
      sounds.heartbeat?.pause();
    };
  }, [selectedChaser]);

  const saveSettings = async () => {
    if (!room) return;

    const validatedChaserType = validChaserTypes.includes(chaserType) ? chaserType : "zombie";
    try {
      const { error } = await supabase
        .from("game_rooms")
        .update({
          duration: parseInt(gameDuration),
          question_count: parseInt(questionCount),
          chaser_type: validatedChaserType,
          updated_at: new Date().toISOString(),
        })
        .eq("id", room.id);

      if (error) throw error;

      router.push(`/host/${roomCode}`);
    } catch (error) {
      console.error("Error menyimpan pengaturan:", error);
      alert("Gagal menyimpan pengaturan!");
    }
  };

  const handleChaserSelect = (chaser: typeof chaserOptions[number]) => {
    setChaserType(chaser.value);
    setSelectedChaser(chaser);
    
    // Play selection sound
    const selectSound = new Audio('/sounds/select.mp3');
    selectSound.volume = 0.6;
    selectSound.play().catch(e => console.log("Sound play prevented:", e));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/static-noise.gif')] opacity-20 pointer-events-none" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full relative z-10"
        >
          <div className="absolute inset-0 rounded-full border-4 border-red-900 border-l-transparent border-r-transparent animate-ping" />
        </motion.div>
        <motion.p 
          className="absolute bottom-1/4 text-red-400 font-mono text-sm"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Memuat ruang horor...
        </motion.p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/static-noise.gif')] opacity-15 pointer-events-none" />
        <div className="text-red-400 text-xl font-mono relative z-10 text-center p-6 border border-red-900/50 bg-black/60 backdrop-blur-sm">
          <Skull className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <p>Room tidak ditemukan...</p>
          <p className="text-sm mt-2 text-red-300">Kembali ke lobi</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden select-none">
      {/* Background Audio */}
      <audio src="/musics/background-music-room.mp3" autoPlay loop />
      
      {/* Visual Effects Layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/5 via-black to-purple-900/5">
        <div className="absolute inset-0 opacity-20">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute w-64 h-64 bg-red-900 rounded-full mix-blend-multiply blur-xl"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: 0.3 + Math.random() * 0.4,
              }}
            />
          ))}
        </div>
      </div>

      {/* Blood Drips */}
      {bloodDrips.map((drip) => (
        <div
          key={drip.id}
          className="absolute top-0 w-0.5 h-20 bg-red-600/80 animate-fall"
          style={{
            left: `${drip.left}%`,
            animation: `fall ${drip.speed}s linear ${drip.delay}s infinite`,
            opacity: 0.7 + Math.random() * 0.3,
          }}
        />
      ))}

      {/* Floating Skulls and Bones */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute text-red-900/20 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              fontSize: `${2 + Math.random() * 3}rem`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${15 + Math.random() * 20}s`,
            }}
          >
            {Math.random() > 0.5 ? <Skull /> : <Bone />}
          </div>
        ))}
      </div>

      {/* TV Static Noise */}
      <div className="absolute inset-0 bg-[url('/images/static-noise.gif')] opacity-10 pointer-events-none" />

      {/* Scratch Marks Overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJzY3JhdGNoZXMiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSI1MDAiIGhlaWdodD0iNTAwIj48cGF0aCBkPSJNMCAwTDUwMCA1MDAiIHN0cm9rZT0icmdiYSgyNTUsMCwwLDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48cGF0aCBkPSJNMCAxMDBMNTAwIDYwMCIgc3Ryb2tlPSJyZ2JhKDI1NSwwLDAsMC4wMykiIHN0cm9rZS13aWR0aD0iMSIvPjxwYXRoIGQ9Ik0wIDIwMEw1MDAgNzAwIiBzdHJva2U9InJnYmEoMjU1LDAsMCwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI3NjcmF0Y2hlcykiIG9wYWNpdHk9IjAuMyIvPjwvc3ZnPg==')] opacity-20" />

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-12 max-w-6xl">
        {/* Header with Flickering Title */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-6">
            <HeartPulse className="w-12 h-12 text-red-500 mr-4 animate-pulse" />
            <h1
              className={`text-5xl md:text-6xl font-bold font-mono tracking-widest transition-all duration-150 ${
                flickerText ? "text-red-500 opacity-100" : "text-red-900 opacity-30"
              } drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]`}
              style={{ textShadow: "0 0 10px rgba(239, 68, 68, 0.7)" }}
            >
              PENGATURAN HOROR
            </h1>
            <HeartPulse className="w-12 h-12 text-red-500 ml-4 animate-pulse" />
          </div>
          <p className="text-red-300 font-mono max-w-2xl mx-auto text-sm md:text-base">
            Pilih karakter pengejar dan tentukan parameter permainan yang akan membuat pemain Anda menjerit ketakutan
          </p>
        </motion.div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Game Settings */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6 lg:col-span-1"
          >
            <div className="bg-black/40 border border-red-900/50 p-6 rounded-lg backdrop-blur-sm">
              <div className="flex items-center mb-4">
                <Clock className="w-5 h-5 text-red-500 mr-2" />
                <h2 className="text-xl font-mono text-red-400">Pengaturan Waktu</h2>
              </div>
              
              <div className="mb-6">
                <Label htmlFor="duration" className="text-red-300 mb-2 block font-medium text-sm font-mono">
                  {/* DURASI PERMAINAN */}
                </Label>
                <Select value={gameDuration} onValueChange={setGameDuration}>
                  {/* <SelectTrigger className="w-full bg-black/70 border-red-800/70 text-red-400 rounded-lg hover:bg-red-900/30 transition-colors font-mono">
                    <SelectValue placeholder="Pilih durasi" />
                  </SelectTrigger> */}
                  <SelectContent className="bg-black/95 text-red-400 border-red-800/50 rounded-lg font-mono backdrop-blur-sm">
                    <SelectItem value="180">3 Menit - Cepat & Menegangkan</SelectItem>
                    <SelectItem value="300">5 Menit - Standar</SelectItem>
                    <SelectItem value="420">7 Menit - Panjang</SelectItem>
                    <SelectItem value="600">10 Menit - Sangat Panjang</SelectItem>
                    <SelectItem value="720">12 Menit - Ekstrem</SelectItem>
                    <SelectItem value="900">15 Menit - Tantangan Akhir</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="questionCount" className="text-red-300 mb-2 block font-medium text-sm font-mono">
                  JUMLAH SOAL
                </Label>
                <Select value={questionCount} onValueChange={setQuestionCount}>
                  <SelectTrigger className="w-full bg-black/70 border-red-800/70 text-red-400 rounded-lg hover:bg-red-900/30 transition-colors font-mono">
                    <SelectValue placeholder="Pilih jumlah soal" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/95 text-red-400 border-red-800/50 rounded-lg font-mono backdrop-blur-sm">
                    <SelectItem value="10">10 Soal - Cepat Selesai</SelectItem>
                    <SelectItem value="20">20 Soal - Standar</SelectItem>
                    <SelectItem value="30">30 Soal - Banyak</SelectItem>
                    <SelectItem value="40">40 Soal - Sangat Banyak</SelectItem>
                    <SelectItem value="50">50 Soal - Ekstrem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-black/40 border border-red-900/50 p-6 rounded-lg backdrop-blur-sm">
              <div className="flex items-center mb-4">
                <Zap className="w-5 h-5 text-red-500 mr-2" />
                <h2 className="text-xl font-mono text-red-400">Kesimpulan</h2>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between text-red-300 font-mono text-sm">
                  <span>Durasi Permainan:</span>
                  <span className="text-red-400">
                    {gameDuration === "180" ? "3 Menit" :
                     gameDuration === "300" ? "5 Menit" :
                     gameDuration === "420" ? "7 Menit" :
                     gameDuration === "600" ? "10 Menit" :
                     gameDuration === "720" ? "12 Menit" : "15 Menit"}
                  </span>
                </div>
                <div className="flex justify-between text-red-300 font-mono text-sm">
                  <span>Jumlah Soal:</span>
                  <span className="text-red-400">{questionCount} Soal</span>
                </div>
                <div className="flex justify-between text-red-300 font-mono text-sm">
                  <span>Karakter Pengejar:</span>
                  <span className="text-red-400">
                    {chaserOptions.find(c => c.value === chaserType)?.name || "Belum dipilih"}
                  </span>
                </div>
              </div>

              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="mt-6"
              >
                <Button
                  onClick={saveSettings}
                  className="w-full bg-gradient-to-r from-red-800 to-red-600 hover:from-red-700 hover:to-red-500 text-white rounded-lg font-mono text-lg py-6 shadow-lg shadow-red-900/30 transition-all"
                >
                  MULAI 
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Right Column - Character Selection */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <div className="bg-black/40 border border-red-900/50 p-6 rounded-lg h-full backdrop-blur-sm">
              <div className="flex items-center mb-6">
                <Ghost className="w-5 h-5 text-red-500 mr-2" />
                <h2 className="text-xl font-mono text-red-400">PILIH PENGEJAR</h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                {chaserOptions.map((chaser) => (
                  <motion.div
                    key={chaser.value}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => handleChaserSelect(chaser)}
                      onKeyDown={(e) => e.key === "Enter" && handleChaserSelect(chaser)}
                      className={`relative flex flex-col items-center p-4 rounded-lg cursor-pointer transition-all duration-300 border ${
                        chaserType === chaser.value
                          ? "border-red-500 shadow-[0_0_15px_rgba(255,0,0,0.7)] bg-red-900/40"
                          : "border-red-500/30 bg-black/40 hover:bg-red-900/20 hover:shadow-[0_0_10px_rgba(255,0,0,0.5)]"
                      } h-full`}
                    >
                      <div className="relative w-24 h-24 mb-3">
                        <Image
                          src={chaser.gif}
                          alt={chaser.alt}
                          fill
                          className="object-contain"
                          unoptimized
                          style={{ imageRendering: "pixelated" }}
                        />
                      </div>
                      <span className="text-red-400 font-mono text-center font-bold mb-1">{chaser.name}</span>
                      <span className="text-red-300 font-mono text-xs text-center opacity-80">{chaser.description}</span>
                      {chaserType === chaser.value && (
                        <motion.span 
                          className="absolute top-2 right-2 text-red-400"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          ✔
                        </motion.span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Selected Character Details */}
              {selectedChaser && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-black/50 border border-red-900/50 rounded-lg"
                >
                  <div className="flex items-center">
                    <Skull className="w-5 h-5 text-red-500 mr-2" />
                    <h3 className="text-lg font-mono text-red-400">KARAKTER TERPILIH: {selectedChaser.name}</h3>
                  </div>
                  <p className="text-red-300 font-mono text-sm mt-2">{selectedChaser.description}</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <motion.div 
        className="absolute bottom-4 left-0 right-0 text-center text-red-900/50 font-mono text-xs"
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 5, repeat: Infinity }}
      >
        PERINGATAN: Permainan ini mengandung unsur horor yang mungkin tidak cocok untuk semua pemain
      </motion.div>

      {/* Global Styles */}
      <style jsx global>{`
        @keyframes fall {
          to {
            transform: translateY(100vh);
          }
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(10, 0, 0, 0.8);
          border-left: 1px solid rgba(255, 0, 0, 0.2);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #600000, #ff0000);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #800000, #ff3030);
        }
      `}</style>
    </div>
  );
}