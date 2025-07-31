"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react"

interface GameControlsProps {
  movePlayer: (direction: "up" | "down" | "left" | "right") => void
  isMoving: boolean
  isCaught?: boolean
  disabled?: boolean
  title?: string
  description?: string
}

export default function GameControls({
  movePlayer,
  isMoving,
  isCaught = false,
  disabled = false,
  title = "👻 Kontrol Hantu",
  description,
}: GameControlsProps) {
  const isDisabled = isMoving || isCaught || disabled

  return (
    <Card className="bg-black/70 backdrop-blur-xl border border-red-800/30">
      <CardContent className="p-4">
        <div className="text-center mb-3">
          <h3 className="text-white font-bold text-sm">{title}</h3>
          {description && <p className="text-gray-400 text-xs">{description}</p>}
        </div>
        <div className="grid grid-cols-3 gap-2 max-w-48 mx-auto">
          <div></div>
          <Button
            onTouchStart={() => movePlayer("up")}
            onClick={() => movePlayer("up")}
            disabled={isDisabled}
            className="bg-red-900/30 hover:bg-red-800/40 text-white border border-red-700/50 h-12 active:scale-95 disabled:opacity-50"
          >
            <ArrowUp className="w-5 h-5" />
          </Button>
          <div></div>
          <Button
            onTouchStart={() => movePlayer("left")}
            onClick={() => movePlayer("left")}
            disabled={isDisabled}
            className="bg-red-900/30 hover:bg-red-800/40 text-white border border-red-700/50 h-12 active:scale-95 disabled:opacity-50"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Button
            onTouchStart={() => movePlayer("down")}
            onClick={() => movePlayer("down")}
            disabled={isDisabled}
            className="bg-red-900/30 hover:bg-red-800/40 text-white border border-red-700/50 h-12 active:scale-95 disabled:opacity-50"
          >
            <ArrowDown className="w-5 h-5" />
          </Button>
          <Button
            onTouchStart={() => movePlayer("right")}
            onClick={() => movePlayer("right")}
            disabled={isDisabled}
            className="bg-red-900/30 hover:bg-red-800/40 text-white border border-red-700/50 h-12 active:scale-95 disabled:opacity-50"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
