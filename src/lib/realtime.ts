import { supabase } from "./supabase"
import type { RealtimeChannel } from "@supabase/supabase-js"

export class GameRealtime {
  private channels: Map<string, RealtimeChannel> = new Map()

  subscribeToRoom(
    roomId: string,
    callbacks: {
      onPlayersChange?: () => void
      onGameStateChange?: () => void
      onRoomChange?: () => void
    },
  ) {
    const channelName = `room_${roomId}`

    // Unsubscribe existing channel if any
    this.unsubscribeFromRoom(roomId)

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          callbacks.onPlayersChange?.()
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_states",
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          callbacks.onGameStateChange?.()
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_rooms",
          filter: `id=eq.${roomId}`,
        },
        () => {
          callbacks.onRoomChange?.()
        },
      )
      .subscribe()

    this.channels.set(roomId, channel)
    return channel
  }

  unsubscribeFromRoom(roomId: string) {
    const channel = this.channels.get(roomId)
    if (channel) {
      channel.unsubscribe()
      this.channels.delete(roomId)
    }
  }

  unsubscribeAll() {
    this.channels.forEach((channel) => {
      channel.unsubscribe()
    })
    this.channels.clear()
  }

  // Broadcast custom events
  async broadcastEvent(roomId: string, event: string, payload: any) {
    const channel = this.channels.get(roomId)
    if (channel) {
      await channel.send({
        type: "broadcast",
        event,
        payload,
      })
    }
  }

  // Listen to custom events
  onBroadcast(roomId: string, event: string, callback: (payload: any) => void) {
    const channel = this.channels.get(roomId)
    if (channel) {
      channel.on("broadcast", { event }, ({ payload }) => {
        callback(payload)
      })
    }
  }
}

export const gameRealtime = new GameRealtime()
