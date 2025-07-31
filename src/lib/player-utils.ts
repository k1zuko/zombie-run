export interface PlayerWithHealth {
  id: string
  nickname: string
  health: number
  maxHealth: number
  score: number
  isHost?: boolean
  isReady?: boolean
  hasAnswered?: boolean
  status?: "alive" | "dead" | "spectating"
  powerUps?: string[]
}

export function createPlayerWithDefaults(player: any): PlayerWithHealth {
  return {
    ...player,
    health: player.health ?? 3,
    maxHealth: player.maxHealth ?? 3,
    score: player.score ?? 0,
    status: player.health <= 0 ? "dead" : "alive",
    powerUps: player.powerUps ?? [],
  }
}

export function damagePlayer(player: PlayerWithHealth, damage = 1): PlayerWithHealth {
  const newHealth = Math.max(0, player.health - damage)
  return {
    ...player,
    health: newHealth,
    status: newHealth <= 0 ? "dead" : "alive",
  }
}

export function healPlayer(player: PlayerWithHealth, healing = 1): PlayerWithHealth {
  const newHealth = Math.min(player.maxHealth, player.health + healing)
  return {
    ...player,
    health: newHealth,
    status: newHealth > 0 ? "alive" : player.status,
  }
}

export function isPlayerAlive(player: PlayerWithHealth): boolean {
  return player.health > 0 && player.status !== "dead"
}

export function getHealthPercentage(player: PlayerWithHealth): number {
  return (player.health / player.maxHealth) * 100
}
