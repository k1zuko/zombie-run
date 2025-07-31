"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { supabase } from "@/lib/supabase"

interface GameLogicProps {
  room: any
  gameState: any
  players: any[]
  currentPlayer: any
}

export function useGameLogic({ room, gameState, players, currentPlayer }: GameLogicProps) {
  // Component mount tracking
  const isMountedRef = useRef(true)

  const [isGameOver, setIsGameOver] = useState(false)
  const [showCaptureAnimation, setShowCaptureAnimation] = useState(false)
  const [wrongAnswers, setWrongAnswers] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const toggleReady = useCallback(async () => {
    if (!currentPlayer || !room || isSubmitting) {
      return false
    }

    try {
      setIsSubmitting(true)

      const { error } = await supabase
        .from("players")
        .update({
          is_ready: !currentPlayer.isReady,
        })
        .eq("id", currentPlayer.id)

      if (error) {
        console.error("Error toggling ready state:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Error in toggleReady:", error)
      return false
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false)
      }
    }
  }, [currentPlayer, room, isSubmitting])

  const submitAnswer = useCallback(
    async (answer: string, isCorrect: boolean) => {
      // Enhanced validation
      if (!currentPlayer?.id || !room?.id || !gameState || isSubmitting) {
        console.log("submitAnswer: validation failed", {
          hasCurrentPlayer: !!currentPlayer?.id,
          hasRoom: !!room?.id,
          hasGameState: !!gameState,
          isSubmitting,
        })
        return false
      }

      try {
        setIsSubmitting(true)
        console.log(`🎯 Submitting answer: "${answer}", correct: ${isCorrect}`)

        // 1. Insert answer to database
        const { error: answerError } = await supabase.from("player_answers").insert({
          player_id: currentPlayer.id,
          room_id: room.id,
          question_index: gameState.currentQuestion || 0,
          answer: answer,
          is_correct: isCorrect,
        })

        if (answerError) {
          console.error("❌ Error submitting answer:", answerError)
          return false
        }

        console.log("✅ Answer submitted to database successfully")

        // 2. Update player stats
        const updates: any = {}

        if (isCorrect) {
          updates.correct_answers = (currentPlayer.correctAnswers || 0) + 1
          updates.score = (currentPlayer.score || 0) + 10
          console.log("🎉 Correct answer - updating stats:", updates)
        } else {
          updates.wrong_answers = (currentPlayer.wrongAnswers || 0) + 1
          console.log("💀 Wrong answer - updating stats:", updates)

          // Update local state for wrong answers
          if (isMountedRef.current) {
            setWrongAnswers((prev) => prev + 1)
          }

          // 3. Handle health system for wrong answers
          try {
            console.log("🩺 Processing health update for wrong answer...")

            // Get or create current health state
            let { data: healthState, error: healthError } = await supabase
              .from("player_health_states")
              .select("*")
              .eq("player_id", currentPlayer.id)
              .eq("room_id", room.id)
              .single()

            if (healthError && healthError.code !== "PGRST116") {
              console.error("Error fetching health state:", healthError)
            }

            // Create health state if it doesn't exist
            if (!healthState) {
              console.log("🆕 Creating new health state...")
              const { data: newHealthState, error: createError } = await supabase
                .from("player_health_states")
                .insert({
                  player_id: currentPlayer.id,
                  room_id: room.id,
                  health: 2, // Start with 3, reduce to 2 for first wrong answer
                  is_being_attacked: true,
                  last_attack_time: new Date().toISOString(),
                })
                .select()
                .single()

              if (createError) {
                console.error("❌ Error creating health state:", createError)
              } else {
                healthState = newHealthState
                console.log("✅ Health state created:", healthState)
              }
            } else {
              // Update existing health state
              const newHealth = Math.max(0, healthState.health - 1)
              console.log(`🩺 Updating health: ${healthState.health} -> ${newHealth}`)

              const { error: updateError } = await supabase
                .from("player_health_states")
                .update({
                  health: newHealth,
                  is_being_attacked: true,
                  last_attack_time: new Date().toISOString(),
                })
                .eq("player_id", currentPlayer.id)
                .eq("room_id", room.id)

              if (updateError) {
                console.error("❌ Error updating health state:", updateError)
              } else {
                console.log("✅ Health state updated successfully")
              }

              // Update player alive status if health reaches 0
              if (newHealth <= 0) {
                console.log("💀 Player eliminated - updating alive status")
                updates.is_alive = false
              }
            }

            // 4. Create attack event for host visualization
            const { error: attackError } = await supabase.from("player_attacks").insert({
              room_id: room.id,
              target_player_id: currentPlayer.id,
              damage: 1,
              attack_type: "wrong_answer",
              attack_data: {
                question_index: gameState.currentQuestion || 0,
                player_nickname: currentPlayer.nickname,
                answer_given: answer,
              },
            })

            if (attackError) {
              console.error("❌ Error creating attack event:", attackError)
            } else {
              console.log("✅ Attack event created for host visualization")
            }
          } catch (healthError) {
            console.error("❌ Error in health system:", healthError)
            // Don't fail the entire submission if health system fails
          }
        }

        // 5. Update player in database
        if (Object.keys(updates).length > 0) {
          const { error: playerError } = await supabase.from("players").update(updates).eq("id", currentPlayer.id)

          if (playerError) {
            console.error("❌ Error updating player stats:", playerError)
            // Don't return false, answer was submitted successfully
          } else {
            console.log("✅ Player stats updated successfully")
          }
        }

        console.log("🎯 Answer submission completed successfully")
        return true
      } catch (error) {
        console.error("❌ Critical error in submitAnswer:", error)
        return false
      } finally {
        if (isMountedRef.current) {
          setIsSubmitting(false)
        }
      }
    },
    [currentPlayer, room, gameState, isSubmitting],
  )

  const nextQuestion = useCallback(
    async (currentIndex: number) => {
      if (!room?.id || !gameState || isSubmitting) {
        console.log("nextQuestion: validation failed", {
          hasRoom: !!room?.id,
          hasGameState: !!gameState,
          isSubmitting,
        })
        return false
      }

      try {
        setIsSubmitting(true)
        console.log(`📝 Moving to next question: ${currentIndex} -> ${currentIndex + 1}`)

        const { error } = await supabase
          .from("game_states")
          .update({
            current_question: currentIndex + 1,
            time_remaining: 30,
          })
          .eq("room_id", room.id)

        if (error) {
          console.error("❌ Error updating question:", error)
          return false
        }

        console.log("✅ Question updated successfully")
        return true
      } catch (error) {
        console.error("❌ Error in nextQuestion:", error)
        return false
      } finally {
        if (isMountedRef.current) {
          setIsSubmitting(false)
        }
      }
    },
    [room, gameState, isSubmitting],
  )

  const startGame = useCallback(async () => {
    if (!room?.id || !currentPlayer?.isHost || isSubmitting) {
      return false
    }

    try {
      setIsSubmitting(true)

      // Update room status
      const { error: roomError } = await supabase
        .from("game_rooms")
        .update({
          status: "playing",
          current_phase: "quiz",
        })
        .eq("id", room.id)

      if (roomError) {
        console.error("Error starting game:", roomError)
        return false
      }

      // Update game state
      const { error: stateError } = await supabase
        .from("game_states")
        .update({
          phase: "quiz",
          current_question: 0,
          time_remaining: 30,
        })
        .eq("room_id", room.id)

      if (stateError) {
        console.error("Error updating game state:", stateError)
        return false
      }

      return true
    } catch (error) {
      console.error("Error in startGame:", error)
      return false
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false)
      }
    }
  }, [room, currentPlayer, isSubmitting])

  const restartGame = useCallback(async () => {
    if (!room?.id || isSubmitting) {
      return false
    }

    try {
      setIsSubmitting(true)

      // Reset local state first
      if (isMountedRef.current) {
        setIsGameOver(false)
        setShowCaptureAnimation(false)
        setWrongAnswers(0)
      }

      // Reset room
      const { error: roomError } = await supabase
        .from("game_rooms")
        .update({
          status: "waiting",
          current_phase: "lobby",
        })
        .eq("id", room.id)

      if (roomError) {
        console.error("Error restarting room:", roomError)
        return false
      }

      // Reset game state
      const { error: stateError } = await supabase
        .from("game_states")
        .update({
          phase: "lobby",
          current_question: 0,
          time_remaining: 30,
          current_correct_answers: 0,
        })
        .eq("room_id", room.id)

      if (stateError) {
        console.error("Error resetting game state:", stateError)
        return false
      }

      // Reset all players
      const { error: playersError } = await supabase
        .from("players")
        .update({
          score: 0,
          correct_answers: 0,
          wrong_answers: 0,
          is_alive: true,
        })
        .eq("room_id", room.id)

      if (playersError) {
        console.error("Error resetting players:", playersError)
        return false
      }

      // Reset health states
      const { error: healthError } = await supabase.from("player_health_states").delete().eq("room_id", room.id)

      if (healthError) {
        console.error("Error resetting health states:", healthError)
        // Don't fail restart for this
      }

      return true
    } catch (error) {
      console.error("Error in restartGame:", error)
      return false
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false)
      }
    }
  }, [room, isSubmitting])

  const leaveGame = useCallback(async () => {
    if (!currentPlayer?.id || !room?.id || isSubmitting) {
      return false
    }

    try {
      setIsSubmitting(true)

      const { error } = await supabase.from("players").delete().eq("id", currentPlayer.id)

      if (error) {
        console.error("Error leaving game:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Error in leaveGame:", error)
      return false
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false)
      }
    }
  }, [currentPlayer, room, isSubmitting])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  return {
    isGameOver,
    setIsGameOver,
    showCaptureAnimation,
    setShowCaptureAnimation,
    wrongAnswers,
    setWrongAnswers,
    isSubmitting,
    toggleReady,
    submitAnswer,
    nextQuestion,
    startGame,
    restartGame,
    leaveGame,
  }
}
