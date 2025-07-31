"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Crown, Users, User, Heart, Skull, Zap, AlertTriangle } from "lucide-react"

interface Player {
  id: string
  nickname: string
  character_type: string
  score: number
  is_alive: boolean
  joined_at: string
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
  return (
    <div className="absolute top-4 left-4 z-50 w-80">
      <Card className="bg-black/95 backdrop-blur-xl border border-red-900/80 text-red-100 shadow-lg shadow-red-900/30">
        <CardHeader className="pb-3 border-b border-red-900/50">
          <CardTitle className="flex items-center gap-2 text-lg text-red-400">
            <Crown className="w-5 h-5 text-yellow-600" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-600">
              HOST COMMAND
            </span>
          </CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <Badge variant="outline" className="border-red-500 text-red-400 bg-red-900/20">
              <Skull className="w-3 h-3 mr-1" />
              ROOM: {roomCode}
            </Badge>
            <div className="flex items-center gap-1 text-red-300">
              <Users className="w-4 h-4" />
              <span>
                {players.length}/{gameRoom?.max_players || 40}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {players.length === 0 ? (
            <div className="text-center py-4">
              <User className="w-8 h-8 text-red-900 mx-auto mb-2" />
              <p className="text-sm text-red-800">WAITING FOR SACRIFICES...</p>
              <p className="text-xs text-red-900 mt-1">
                SHARE ROOM CODE: <span className="font-mono font-bold text-red-700">{roomCode}</span>
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin scrollbar-track-red-900/20 scrollbar-thumb-red-900/50">
              {players.map((player, index) => {
                const character = getCharacterByType(player.character_type)
                const workingPath = getWorkingImagePath(character)
                const playerState = playerStates[player.id]
                const healthState = playerHealthStates[player.id]
                const isBeingAttacked = playerState?.isBeingAttacked || false
                const health = playerState?.health ?? healthState?.health ?? 3
                const isRecentAttack = recentAttacks.has(player.id)
                const isZombieTarget = zombieState.targetPlayerId === player.id

                return (
                  <div
                    key={player.id}
                    className={`relative flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                      isZombieTarget
                        ? "bg-red-900/40 border border-red-600 shadow-lg shadow-red-900/50"
                        : isBeingAttacked
                          ? "bg-red-900/30 border border-red-800/70"
                          : health === 0
                            ? "bg-black/40 border border-gray-900"
                            : isRecentAttack
                              ? "bg-red-800/20 border border-red-800/50"
                              : "bg-red-900/10 hover:bg-red-900/20 border border-red-900/30"
                    }`}
                  >
                    {/* Blood splatter effect for attacked players */}
                    {isBeingAttacked && (
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute w-4 h-4 bg-red-700 rounded-full top-1 left-2 opacity-70"></div>
                        <div className="absolute w-3 h-3 bg-red-800 rounded-full top-3 right-3 opacity-60"></div>
                        <div className="absolute w-2 h-2 bg-red-900 rounded-full bottom-2 left-4 opacity-50"></div>
                      </div>
                    )}

                    <div className="relative z-10">
                      <div
                        className={`w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                          isZombieTarget
                            ? "border-red-600 shadow-lg shadow-red-600/70"
                            : isBeingAttacked
                              ? "border-red-500 shadow-sm shadow-red-500/40"
                              : health === 0
                                ? "border-gray-700"
                                : "border-red-900/70"
                        }`}
                        style={{
                          backgroundImage: `url(${workingPath})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          imageRendering: "pixelated",
                          filter: health === 0 
                            ? "grayscale(100%) brightness(0.3) contrast(1.2)" 
                            : isBeingAttacked 
                              ? "brightness(1.2) contrast(1.1)" 
                              : "none",
                        }}
                      />
                      <div
                        className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-black transition-all duration-300 ${
                          health > 0 
                            ? "bg-green-600 shadow-sm shadow-green-500/50" 
                            : "bg-red-900 shadow-sm shadow-red-900/70"
                        }`}
                      />
                      {isZombieTarget && (
                        <div className="absolute inset-0 bg-red-600/40 rounded-full animate-ping" />
                      )}
                    </div>

                    <div className="relative z-10 flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p
                          className={`text-sm font-medium truncate ${
                            health === 0 
                              ? "text-gray-500 line-through" 
                              : isBeingAttacked 
                                ? "text-red-300 font-bold animate-pulse" 
                                : "text-red-100"
                          }`}
                        >
                          {player.nickname}
                        </p>
                        {isZombieTarget && (
                          <span className="text-red-500 animate-pulse">
                            <AlertTriangle className="w-4 h-4 fill-red-900" />
                          </span>
                        )}
                        {isBeingAttacked && (
                          <span className="text-red-400 animate-pulse">
                            <Zap className="w-4 h-4 fill-red-500/30" />
                          </span>
                        )}
                        {isRecentAttack && !isBeingAttacked && (
                          <span className="text-orange-400">
                            <Skull className="w-4 h-4" />
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          {[...Array(3)].map((_, heartIndex) => (
                            <Heart
                              key={heartIndex}
                              className={`w-3 h-3 transition-all duration-300 ${
                                heartIndex < health 
                                  ? "text-red-600 fill-red-600" 
                                  : "text-red-900/70 fill-red-900/40"
                              }`}
                            />
                          ))}
                          <span className={`text-xs ml-1 ${
                            health > 1 ? "text-red-300" : "text-red-700 font-bold"
                          }`}>
                            {health}/3
                          </span>
                        </div>
                        <span className="text-xs text-red-400">SCORE: {player.score}</span>
                      </div>
                      {healthState && (
                        <div className="text-xs text-green-500 mt-1 font-mono">SYNCED</div>
                      )}
                    </div>

                    <div className="relative z-10 text-xs text-red-900 font-bold">#{index + 1}</div>
                    {isZombieTarget && (
                      <Skull className="w-5 h-5 text-red-600 animate-pulse" />
                    )}
                    {health === 0 && (
                      <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                        <Skull className="w-6 h-6 text-red-900/80" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}