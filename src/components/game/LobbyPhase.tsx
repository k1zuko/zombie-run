
"use client";

import { useState, useEffect } from "react";
import { Users, Skull, Zap, Play, Ghost, Bone, HeartPulse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import SoulStatus from "./SoulStatus";
import CountdownPhase from "../CountDownPhase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import Image from "next/image";

interface Player {
  id: string;
  nickname: string;
  isHost?: boolean;
  isReady?: boolean;
  health?: number;
  maxHealth?: number;
  score?: number;
  room_id?: string;
  character_type?: string;
}

interface LobbyPhaseProps {
  currentPlayer: Player;
  players: Player[];
  gameLogic: any;
  isSoloMode: boolean;
  wrongAnswers?: number;
}

const characterOptions = [
  { value: "robot1", name: "Hijau", gif: "/character/character.gif", alt: "Karakter Hijau" },
  { value: "robot2", name: "Biru", gif: "/character/character1.gif", alt: "Karakter Biru" },
  { value: "robot3", name: "Merah", gif: "/character/character2.gif", alt: "Karakter Merah" },
  { value: "robot4", name: "Ungu", gif: "/character/character3.gif", alt: "Karakter Ungu" },
  { value: "robot5", name: "Oranye", gif: "/character/character4.gif", alt: "Karakter Oranye" },
  { value: "robot6", name: "Kuning", gif: "/character/character5.gif", alt: "Karakter Kuning" },
  { value: "robot7", name: "Abu-abu", gif: "/character/character6.gif", alt: "Karakter Abu-abu" },
  { value: "robot8", name: "Pink", gif: "/character/character7.gif", alt: "Karakter Pink" },
  { value: "robot9", name: "Cokelat", gif: "/character/character8.gif", alt: "Karakter Cokelat" },
  { value: "robot10", name: "Emas", gif: "/character/character9.gif", alt: "Karakter Emas" },
];

export default function LobbyPhase({
  currentPlayer,
  players,
  gameLogic,
  isSoloMode,
  wrongAnswers = 0,
}: LobbyPhaseProps) {
  const [flickerText, setFlickerText] = useState(true);
  const [bloodDrips, setBloodDrips] = useState<Array<{ id: number; left: number; speed: number; delay: number }>>([]);
  const [atmosphereText, setAtmosphereText] = useState("Dinding-dinding berbisik tentang dosa-dosamu...");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [room, setRoom] = useState<any>(null);
  const [showCountdownPhase, setShowCountdownPhase] = useState(false);
  const [isCharacterDialogOpen, setIsCharacterDialogOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(currentPlayer.character_type || "robot1");

  const atmosphereTexts = [
    "Dinding-dinding berbisik tentang dosa-dosamu...",
    "Darah menetes dari langit-langit...",
    "Mereka mengawasimu...",
    "Udara berbau besi dan penyesalan...",
    "Detak jantungmu terdengar terlalu keras...",
    "Jangan menoleh ke belakang...",
    "Bayangan-bayangan lapar malam ini...",
    "Mereka hampir tiba...",
    "Kau bisa merasakannya merayap di kulitmu?",
    "Jiwamu sudah hilang...",
  ];

  // Mengambil data ruangan
  useEffect(() => {
    const fetchRoom = async () => {
      if (!currentPlayer.room_id) return;

      try {
        console.log("🏠 LobbyPhase: Mengambil data ruangan untuk room_id:", currentPlayer.room_id);
        const { data, error } = await supabase.from("game_rooms").select("*").eq("id", currentPlayer.room_id).single();

        if (error) {
          console.error("❌ LobbyPhase: Gagal mengambil ruangan:", error);
          return;
        }

        console.log("✅ LobbyPhase: Data ruangan berhasil diambil:", data);
        setRoom(data);
      } catch (error) {
        console.error("❌ LobbyPhase: Gagal mengambil ruangan:", error);
      }
    };

    fetchRoom();
  }, [currentPlayer.room_id]);

  // Langganan real-time untuk pembaruan ruangan
  useEffect(() => {
    if (!currentPlayer.room_id) return;

    console.log("🔗 LobbyPhase: Menyiapkan langganan real-time untuk room_id:", currentPlayer.room_id);

    const channel = supabase
      .channel(`lobby_${currentPlayer.room_id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_rooms",
          filter: `id=eq.${currentPlayer.room_id}`,
        },
        (payload) => {
          console.log("📡 LobbyPhase: Pembaruan ruangan diterima:", payload);
          console.log("📡 LobbyPhase: Data ruangan baru:", payload.new);
          setRoom(payload.new);
        },
      )
      .subscribe((status) => {
        console.log("📡 LobbyPhase: Status langganan:", status);
      });

    return () => {
      console.log("🔌 LobbyPhase: Membersihkan langganan");
      supabase.removeChannel(channel);
    };
  }, [currentPlayer.room_id]);

  // Menangani countdown berdasarkan countdown_start ruangan
  useEffect(() => {
    console.log("⏰ LobbyPhase: Memeriksa countdown_start:", room?.countdown_start);

    if (!room?.countdown_start) {
      console.log("⏰ LobbyPhase: Tidak ada countdown_start, menyembunyikan fase countdown");
      setCountdown(null);
      setShowCountdownPhase(false);
      return;
    }

    const countdownStart = room.countdown_start;
    const now = Date.now();
    const elapsed = Math.floor((now - countdownStart) / 1000);
    const remaining = Math.max(0, 5 - elapsed);

    console.log("⏰ LobbyPhase: Perhitungan countdown:", {
      countdownStart,
      now,
      elapsed,
      remaining,
    });

    if (remaining > 0) {
      console.log("🚀 LobbyPhase: Memulai countdown dengan sisa", remaining, "detik");
      setCountdown(remaining);
      setShowCountdownPhase(true);

      const timer = setInterval(() => {
        const currentNow = Date.now();
        const currentElapsed = Math.floor((currentNow - countdownStart) / 1000);
        const currentRemaining = Math.max(0, 5 - currentElapsed);

        console.log("⏰ LobbyPhase: Tick countdown:", currentRemaining);
        setCountdown(currentRemaining);

        if (currentRemaining <= 0) {
          console.log("⏰ LobbyPhase: Countdown selesai");
          clearInterval(timer);
          setCountdown(null);
          setShowCountdownPhase(false);
        }
      }, 100);

      return () => clearInterval(timer);
    } else {
      console.log("⏰ LobbyPhase: Countdown sudah selesai");
      setCountdown(null);
      setShowCountdownPhase(false);
    }
  }, [room?.countdown_start]);

  // Menghasilkan efek tetesan darah
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

  // Efek flicker dan teks atmosfer
  useEffect(() => {
    const flickerInterval = setInterval(
      () => {
        setFlickerText((prev) => !prev);
      },
      100 + Math.random() * 150,
    );

    const textInterval = setInterval(() => {
      setAtmosphereText(atmosphereTexts[Math.floor(Math.random() * atmosphereTexts.length)]);
    }, 2500);

    return () => {
      clearInterval(flickerInterval);
      clearInterval(textInterval);
    };
  }, []);

  // Menangani pemilihan karakter
  const handleCharacterSelect = async () => {
    try {
      const { error } = await supabase
        .from("players")
        .update({ character_type: selectedCharacter })
        .eq("id", currentPlayer.id);

      if (error) {
        console.error("❌ LobbyPhase: Gagal memperbarui karakter:", error);
        alert("Gagal memperbarui karakter: " + error.message);
        return;
      }

      console.log(`✅ LobbyPhase: Karakter diperbarui menjadi ${selectedCharacter} untuk pemain ${currentPlayer.id}`);
      setIsCharacterDialogOpen(false);
    } catch (error) {
      console.error("❌ LobbyPhase: Gagal memperbarui karakter:", error);
      alert("Gagal memperbarui karakter: " + (error instanceof Error ? error.message : "Kesalahan tidak diketahui"));
    }
  };

  // Fungsi mulai permainan untuk host
  const handleStartGame = async () => {
    if (!currentPlayer.isHost || !currentPlayer.room_id) return;

    try {
      console.log("🎮 LobbyPhase: Host memulai permainan...");
      const countdownStartTime = Date.now();

      const { error } = await supabase
        .from("game_rooms")
        .update({
          countdown_start: countdownStartTime,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentPlayer.room_id);

      if (error) {
        console.error("❌ LobbyPhase: Gagal memulai countdown:", error);
        return;
      }

      console.log("✅ LobbyPhase: Countdown berhasil dimulai dengan timestamp:", countdownStartTime);
    } catch (error) {
      console.error("❌ LobbyPhase: Gagal memulai countdown:", error);
    }
  };

  // Menangani penyelesaian countdown
  const handleCountdownComplete = () => {
    console.log("🎯 LobbyPhase: Countdown selesai!");
    setShowCountdownPhase(false);
    setCountdown(null);
  };

  // Urutkan pemain agar currentPlayer muncul pertama
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.id === currentPlayer.id) return -1; // currentPlayer di urutan pertama
    if (b.id === currentPlayer.id) return 1;
    return 0; // Urutan lainnya tetap
  });

  console.log("🔍 LobbyPhase: Current Player:", currentPlayer);
  console.log("🔍 LobbyPhase: Sorted Players:", sortedPlayers);
  console.log("🎨 LobbyPhase: Keputusan render:", {
    showCountdownPhase,
    countdown,
    roomCountdownStart: room?.countdown_start,
  });

  if (showCountdownPhase && countdown !== null) {
    console.log("🎬 LobbyPhase: Merender CountdownPhase dengan countdown:", countdown);
    return <CountdownPhase initialCountdown={countdown} onCountdownComplete={handleCountdownComplete} />;
  }

  console.log("🏠 LobbyPhase: Merender lobi normal");

  return (
    <div className="min-h-screen bg-black relative overflow-hidden select-none">
      {/* Latar belakang bernoda darah */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/5 via-black to-purple-900/5">
        {/* Noda darah */}
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

      {/* Tetesan darah */}
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

      {/* Tengkorak dan tulang melayang */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
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

      {/* Lapisan goresan */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJzY3JhdGNoZXMiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSI1MDAiIGhlaWdodD0iNTAwIj48cGF0aCBkPSJNMCAwTDUwMCA1MDAiIHN0cm9rZT0icmdiYSgyNTUsMCwwLDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48cGF0aCBkPSJNMCAxMDBMNTAwIDYwMCIgc3Ryb2tlPSJyZ2JhKDI1NSwwLDAsMC4wMykiIHN0cm9rZS13aWR0aD0iMSIvPjxwYXRoIGQ9Ik0wIDIwMEw1MDAgNzAwIiBzdHJva2U9InJnYmEoMjU1LDAsMCwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI3NjcmF0Y2hlcykiIG9wYWNpdHk9IjAuMyIvPjwvc3ZnPg==')] opacity-20" />

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <HeartPulse className="w-12 h-12 text-red-500 mr-4 animate-pulse" />
            <h1
              className={`text-6xl font-bold font-mono tracking-wider transition-all duration-150 ${
                flickerText ? "text-red-500 opacity-100" : "text-red-900 opacity-30"
              } drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]`}
              style={{ textShadow: "0 0 10px rgba(239, 68, 68, 0.7)" }}
            >
              RUANG TUNGGU
            </h1>
            <HeartPulse className="w-12 h-12 text-red-500 ml-4 animate-pulse" />
          </div>

          <p className="text-red-400/80 text-xl font-mono animate-pulse tracking-wider">{atmosphereText}</p>
        </div>

        {/* Grid Pemain */}
        <div className="max-w-5xl mx-auto mb-8 md:h-auto h-[calc(100vh-150px)] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {sortedPlayers.map((player) => (
              <div
                key={player.id}
                className="relative bg-black/40 border border-red-900/50 rounded-lg p-4 hover:border-red-500 transition-all duration-300 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]"
              >
                <div className="absolute -top-2 -left-2 text-red-500">
                  <Ghost className="w-5 h-5" />
                </div>

                <SoulStatus
                  player={{
                    ...player,
                    health: player.health || 3,
                    maxHealth: player.maxHealth || 3,
                    score: player.score || 0,
                  }}
                  isCurrentPlayer={player.id === currentPlayer.id}
                  variant="detailed"
                  showDetailed={true}
                />

                {player.isHost && (
                  <div className="absolute -bottom-2 -right-2 text-xs bg-red-900 text-white px-2 py-1 rounded font-mono">
                    TUAN RUMAH
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Kontrol Permainan */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center space-x-4 text-red-400 font-mono text-lg">
            <Users className="w-6 h-6" />
            <span className="tracking-wider">{players.length} JIWA TERKUTUK</span>
            <Zap className="w-6 h-6 animate-pulse" />
          </div>

          <div className="space-y-4">
            {currentPlayer.isHost && (
              <Button
                onClick={handleStartGame}
                disabled={(players.length < 2 && !isSoloMode) || countdown !== null}
                className="relative overflow-hidden bg-gradient-to-r from-red-900 to-red-700 hover:from-red-800 hover:to-red-600 text-white font-mono text-xl px-10 py-6 rounded-lg border-2 border-red-700 shadow-[0_0_30px_rgba(239,68,68,0.5)] hover:shadow-[0_0_40px_rgba(239,68,68,0.7)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <span className="relative z-10 flex items-center">
                  <Play className="w-6 h-6 mr-3" />
                  MULAI PENYIKSAAN
                </span>
                <span className="absolute inset-0 bg-red-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                <span className="absolute bottom-0 left-0 right-0 h-1 bg-red-500 animate-pulse" />
              </Button>
            )}

            {players.length < 2 && !isSoloMode && currentPlayer.isHost && (
              <p className="text-red-400 text-sm font-mono animate-pulse tracking-wider">
                RITUAL MEMBUTUHKAN LEBIH BANYAK KORBAN...
              </p>
            )}

            {!currentPlayer.isHost && (
              <p className="text-red-400/80 text-sm font-mono tracking-wider animate-pulse">
                MENUNGGU PERINTAH KEJAM DARI TUAN RUMAH...
              </p>
            )}
          </div>
        </div>

        {/* Tombol Pilih Karakter */}
        {!currentPlayer.isHost && (
          <>
            {/* Tampilan Smartphone (lebar layar < 768px) */}
            <div className="md:hidden fixed bottom-4 left-0 w-full px-4 z-30 bg-black/80">
              <Button
                onClick={() => setIsCharacterDialogOpen(true)}
                className="w-full relative overflow-hidden bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white font-mono text-base px-4 py-3 rounded-lg border-2 border-gray-700 shadow-[0_0_20px_rgba(107,114,128,0.3)] transition-all duration-300 group"
              >
                <span className="relative z-10">PILIH KARAKTER</span>
                <span className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-white" />
              </Button>
            </div>
            {/* Tampilan Desktop (lebar layar >= 768px) */}
            <div className="hidden md:block fixed bottom-4 left-1/2 transform -translate-x-1/2 z-20 max-w-md w-full px-4">
              <Button
                onClick={() => setIsCharacterDialogOpen(true)}
                className="w-full relative overflow-hidden bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white font-mono text-xl px-10 py-6 rounded-lg border-2 border-gray-700 shadow-[0_0_20px_rgba(107,114,128,0.3)] transition-all duration-300 group"
              >
                <span className="relative z-10">PILIH KARAKTER</span>
                <span className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-white" />
              </Button>
            </div>
          </>
        )}

        {/* Dialog Pemilihan Karakter */}
        <Dialog open={isCharacterDialogOpen} onOpenChange={setIsCharacterDialogOpen}>
          <DialogContent className="bg-black/95 text-white border-red-500/50 max-w-lg rounded-xl p-4 sm:p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
            <DialogHeader>
              <DialogTitle className="text-2xl sm:text-3xl font-bold text-red-400 font-mono tracking-wide">
                Pilih Karakter
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 sm:py-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {characterOptions.map((character) => (
                  <div
                    key={character.value}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setSelectedCharacter(character.value);
                      console.log(`Memilih karakter: ${character.name} (${character.value})`);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && setSelectedCharacter(character.value)}
                    className={`relative flex flex-col items-center p-3 sm:p-4 rounded-lg cursor-pointer transition-all duration-300
                      ${selectedCharacter === character.value ? 'border-2 border-red-500 shadow-[0_0_10px_rgba(255,0,0,0.7)] bg-red-900/30' : 'border border-white/20 bg-white/10 hover:bg-red-500/20 hover:shadow-[0_0_8px_rgba(255,0,0,0.5)]'}
                      hover:scale-105`}
                  >
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 mb-2">
                      <Image
                        src={character.gif}
                        alt={character.alt}
                        fill
                        className="object-contain"
                        unoptimized
                        style={{ imageRendering: "pixelated" }}
                      />
                    </div>
                    <span className="text-white font-mono text-xs sm:text-sm text-center">
                      {character.name}
                    </span>
                    {selectedCharacter === character.value && (
                      <span className="absolute top-1 sm:top-2 right-1 sm:right-2 text-red-400 text-xs font-bold">✔</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <Button
                variant="outline"
                onClick={() => setIsCharacterDialogOpen(false)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-lg w-full sm:w-auto"
              >
                Batal
              </Button>
              <Button
                onClick={handleCharacterSelect}
                className="bg-white text-black hover:bg-gray-200 rounded-lg w-full sm:w-auto"
              >
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Noda darah di sudut */}
      <div className="absolute top-0 left-0 w-64 h-64 opacity-20">
        <div className="absolute w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/70 to-transparent" />
      </div>
      <div className="absolute top-0 right-0 w-64 h-64 opacity-20">
        <div className="absolute w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/70 to-transparent" />
      </div>
      <div className="absolute bottom-0 left-0 w-64 h-64 opacity-20">
        <div className="absolute w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/70 to-transparent" />
      </div>
      <div className="absolute bottom-0 right-0 w-64 h-64 opacity-20">
        <div className="absolute w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/70 to-transparent" />
      </div>

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
          width: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(26, 0, 0, 0.8);
          border-left: 2px solid rgba(255, 0, 0, 0.3);
          box-shadow: inset 0 0 6px rgba(255, 0, 0, 0.2);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #8b0000, #ff0000);
          border-radius: 6px;
          border: 2px solid rgba(255, 0, 0, 0.5);
          box-shadow: 0 0 8px rgba(255, 0, 0, 0.7);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #ff0000, #8b0000);
          box-shadow: 0 0 12px rgba(255, 0, 0, 0.9);
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #ff0000 rgba(26, 0, 0, 0.8);
        }
      `}</style>
    </div>
  );
}
