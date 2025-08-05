"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Crown, Users, User, Heart, Skull, Zap, AlertTriangle, Ghost, RadioTower, Bone, Crosshair } from "lucide-react"
import { useEffect, useState } from "react"

interface Player {
  id: string
  nickname: string
  character_type: string
  score: number
  is_alive: boolean
  joined_at: string
  is_connected?: boolean
}

interface GameRoom {
  id: string
  room_code: string
  title: string
  status: string
  max_players: number
  current_phase: string
}

interface PlayerHealthState {
  id: string
  player_id: string
  room_id: string
  health: number
  max_health: number
  is_being_attacked: boolean
  last_attack_time: string
  synced?: boolean
}

interface PlayerState {
  id: string
  health: number
  isBeingAttacked: boolean
  position: number
  lastAttackTime: number
  attackIntensity: number
}

interface ZombieState {
  isAttacking: boolean
  targetPlayerId: string | null
  attackProgress: number
  basePosition: number
  currentPosition: number
}

interface PlayersPanelProps {
  players: Player[]
  gameRoom: GameRoom | null
  roomCode: string
  playerStates: { [playerId: string]: PlayerState }
  playerHealthStates: { [playerId: string]: PlayerHealthState }
  zombieState: ZombieState
  recentAttacks: Set<string>
  getCharacterByType: (type: string) => any
  getWorkingImagePath: (character: any) => string
}

export default function PlayersPanel({
  players,
  gameRoom,
  roomCode,
  playerStates,
  playerHealthStates,
  zombieState,
  recentAttacks,
  getCharacterByType,
  getWorkingImagePath,
}: PlayersPanelProps) {
  const [pulse, setPulse] = useState(false)
  const [bloodDrips, setBloodDrips] = useState<{id: number, playerId: string, top: number, left: number}[]>([])
  
  // Create blood drip effects when players are attacked
  useEffect(() => {
    const attackedPlayers = players.filter(p => 
      playerStates[p.id]?.isBeingAttacked || recentAttacks.has(p.id)
    )
    
    if (attackedPlayers.length > 0) {
      setPulse(true)
      setTimeout(() => setPulse(false), 300)
      
      // Add blood drips for attacked players
      const newDrips = attackedPlayers.map(p => ({
        id: Date.now() + Math.random(),
        playerId: p.id,
        top: 20 + Math.random() * 30,
        left: 10 + Math.random() * 40
      }))
      
      setBloodDrips(prev => [...prev, ...newDrips])
      
      // Remove drips after animation
      setTimeout(() => {
        setBloodDrips(prev => prev.filter(d => !newDrips.some(nd => nd.id === d.id)))
      }, 2000)
    }
  }, [recentAttacks, playerStates])

  return (
    <div className="absolute top-2 left-2 z-50 w-[260px]">
      <Card className={`
        bg-black/95 backdrop-blur-xl border border-red-900/80 text-red-100 
        shadow-lg shadow-red-900/30 overflow-hidden
        ${pulse ? 'animate-pulse-red' : ''}
      `}>
        <CardHeader className="p-2 border-b border-red-900/50 relative overflow-hidden">
          {/* Blood splatter decoration */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1 left-4 w-2 h-2 bg-red-900/70 rounded-full"></div>
            <div className="absolute top-3 right-6 w-1 h-1 bg-red-800/60 rounded-full"></div>
            <div className="absolute bottom-1 left-8 w-3 h-3 bg-red-900/40 rounded-full"></div>
          </div>
          
          <div className="flex justify-between items-center relative z-10">
            <CardTitle className="flex items-center gap-1 text-xs font-medium text-red-400">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-300 to-red-500 font-bold tracking-wider">
                SURVIVOR TRACKER
              </span>
            </CardTitle>
            <div className="flex items-center gap-1 text-[11px]">
              <Badge variant="outline" className="h-5 px-1.5 border-red-500/50 text-red-400 bg-red-900/20 relative">
                <Skull className="w-3 h-3 mr-1" />
                {roomCode}
                <span className="absolute -right-1 -top-1 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
              </Badge>
              <div className="flex items-center gap-1 text-red-300/80 text-[11px]">
                <Users className="w-3 h-3" />
                <span className="font-mono">
                  {players.filter(p => p.is_alive && (playerStates[p.id]?.health ?? playerHealthStates[p.id]?.health ?? 3) > 0).length}
                  <span className="text-red-500/70">/</span>{gameRoom?.max_players || 40}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-1 relative">
          {/* Animated background elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({length: 3}).map((_, i) => (
              <div 
                key={i}
                className="absolute top-0 h-full w-px bg-red-900/30"
                style={{left: `${10 + i * 80}px`}}
              ></div>
            ))}
          </div>
          
          {players.length === 0 ? (
            <div className="text-center p-4 relative z-10">
              <div className="relative mx-auto w-12 h-12 mb-2">
                <User className="w-10 h-10 text-red-900/80 mx-auto" />
                <Ghost className="absolute top-0 right-0 w-4 h-4 text-red-500 animate-pulse" />
              </div>
              <p className="text-[11px] text-red-800/90 font-medium tracking-wider">AWAITING SACRIFICES...</p>
              <p className="text-[9px] text-red-900/80 mt-2 font-mono">
                ACCESS CODE: <span className="font-bold text-red-700 tracking-widest">{roomCode}</span>
              </p>
              <div className="mt-2 flex justify-center gap-1">
                {[1,2,3].map(i => (
                  <Bone key={i} className="w-3 h-3 text-red-900/60 animate-pulse" style={{animationDelay: `${i * 0.2}s`}} />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-1 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-red-900/50 relative z-10">
              {players
                .filter((player) => {
                  const playerState = playerStates[player.id];
                  const healthState = playerHealthStates[player.id];
                  const health = playerState?.health ?? healthState?.health ?? 3;
                  return player.is_alive && health > 0;
                })
                .map((player, index) => {
                  const character = getCharacterByType(player.character_type)
                  const workingPath = getWorkingImagePath(character)
                  const playerState = playerStates[player.id]
                  const healthState = playerHealthStates[player.id]
                  const isBeingAttacked = playerState?.isBeingAttacked || false
                  const health = playerState?.health ?? healthState?.health ?? 3
                  const isRecentAttack = recentAttacks.has(player.id)
                  const isZombieTarget = zombieState.targetPlayerId === player.id
                  const isSynced = healthState?.synced ?? false
                  const isConnected = player.is_connected ?? true
                  const attackIntensity = playerState?.attackIntensity || 0

                  // Blood drips for this player
                  const playerBloodDrips = bloodDrips.filter(d => d.playerId === player.id)

                  return (
                    <div
                      key={player.id}
                      className={`
                        relative flex items-center gap-1.5 p-1.5 rounded-sm transition-all duration-150
                        ${
                          isZombieTarget
                            ? "bg-gradient-to-r from-red-900/70 via-red-900/50 to-red-900/30 border-l-2 border-red-500"
                            : isBeingAttacked
                              ? "bg-red-900/40 border-l-2 border-red-600"
                              : isRecentAttack
                                ? "bg-red-800/30 border-l-2 border-red-800"
                                : "bg-red-900/10 hover:bg-red-900/20 border-l-2 border-red-900/20"
                        }
                        ${isBeingAttacked ? 'animate-attack-shake' : ''}
                      `}
                    >
                      {/* Blood drips */}
                      {playerBloodDrips.map(drip => (
                        <div 
                          key={drip.id}
                          className="absolute w-1 h-3 bg-red-900/80 rounded-full animate-blood-drip pointer-events-none"
                          style={{
                            top: `${drip.top}px`,
                            left: `${drip.left}px`,
                            animationDuration: `${1 + Math.random()}s`
                          }}
                        ></div>
                      ))}

                      {/* Player avatar with status indicators */}
                      <div className="relative flex-shrink-0">
                        <div
                          className={`
                            w-8 h-8 rounded-full border-2 transition-all duration-150
                            ${
                              isConnected 
                                ? isSynced 
                                  ? "border-green-500/80" 
                                  : "border-yellow-500/80"
                                : "border-red-500/80"
                            }
                            ${
                              isZombieTarget
                                ? "shadow-md shadow-red-600/50 ring-2 ring-red-500/50"
                                : isBeingAttacked
                                  ? "shadow-sm shadow-red-500/30"
                                  : ""
                            }
                          `}
                          style={{
                            backgroundImage: `url(${workingPath})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            imageRendering: "pixelated",
                            filter: isBeingAttacked 
                              ? `brightness(${1.1 + attackIntensity/10}) contrast(1.2)` 
                              : "none",
                            transform: isBeingAttacked ? `scale(${1 + attackIntensity/20})` : 'scale(1)'
                          }}
                        />
                        
                        {/* Status indicators */}
                        {isZombieTarget && (
                          <>
                            <div className="absolute inset-0 bg-red-600/40 rounded-full animate-ping" />
                            <Crosshair className="absolute -top-1 -right-1 w-3 h-3 text-red-500 animate-pulse" />
                          </>
                        )}
                        {!isConnected && (
                          <RadioTower className="absolute -top-1 -right-1 w-3 h-3 text-red-500/80 animate-pulse" />
                        )}
                      </div>

                      {/* Player info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p
                            className={`
                              text-[11px] font-medium truncate
                              ${
                                isBeingAttacked 
                                  ? "text-red-300 font-bold" 
                                  : "text-red-100"
                              }
                              ${isBeingAttacked ? 'tracking-wider' : ''}
                            `}
                          >
                            {player.nickname}
                          </p>
                          {isZombieTarget && (
                            <AlertTriangle className="w-2.5 h-2.5 text-red-500 animate-pulse flex-shrink-0" />
                          )}
                          {isBeingAttacked && (
                            <Zap className="w-2.5 h-2.5 text-red-400 animate-pulse flex-shrink-0" />
                          )}
                        </div>

                        {/* Health bar and score */}
                        <div className="flex items-center justify-between mt-0.5">
                          <div className="flex items-center gap-0.5">
                            {[...Array(3)].map((_, heartIndex) => (
                              <Heart
                                key={heartIndex}
                                className={`w-2.5 h-2.5 transition-all ${
                                  heartIndex < health 
                                    ? "text-red-600 fill-red-600" 
                                    : "text-red-900/70 fill-red-900/40"
                                } ${
                                  isBeingAttacked && heartIndex < health ? 'animate-heartbeat' : ''
                                }`}
                                style={{animationDelay: `${heartIndex * 0.1}s`}}
                              />
                            ))}
                            <span className={`text-[9px] ml-0.5 font-mono ${
                              health > 1 ? "text-red-300/90" : "text-red-700 font-bold"
                            }`}>
                              {health}/3
                            </span>
                          </div>
                          <span className="text-[9px] text-red-400/80 font-mono">
                            <span className="text-red-300">{player.score}</span> XP
                          </span>
                        </div>
                      </div>

                      {/* Player position number */}
                      <div className={`
                        text-[9px] font-bold ml-auto px-1 py-0.5 rounded
                        text-red-100/90 bg-red-900/30
                      `}>
                        #{index + 1}
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Add these to your global CSS */}
      <style jsx global>{`
        @keyframes pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .animate-pulse-red {
          animation: pulse-red 0.5s;
        }
        @keyframes attack-shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          50% { transform: translateX(2px); }
          75% { transform: translateX(-2px); }
          100% { transform: translateX(0); }
        }
        .animate-attack-shake {
          animation: attack-shake 0.1s linear infinite;
        }
        @keyframes blood-drip {
          0% { transform: translateY(-10px); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateY(20px); opacity: 0; }
        }
        .animate-blood-drip {
          animation: blood-drip linear forwards;
        }
        @keyframes heartbeat {
          0% { transform: scale(1); }
          25% { transform: scale(1.1); }
          50% { transform: scale(1); }
          75% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        .animate-heartbeat {
          animation: heartbeat 0.5s infinite;
        }
      `}</style>
    </div>
  )
}