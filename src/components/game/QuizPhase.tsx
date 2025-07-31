
"use client"

import { useState, useEffect } from "react"
import { Clock, Skull, Zap, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getQuestionByIndex, getTotalQuestions } from "@/data/horror-questions"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import ZombieFeedback from "./ZombieFeedback"

interface QuizPhaseProps {
  room: any
  gameState: any
  currentPlayer: any
  players: any[]
  gameLogic: any
  isSoloMode: boolean
  wrongAnswers: number
  resumeState?: {
    health: number
    correctAnswers: number
    currentIndex: number
    isResuming: boolean
  }
}

export default function QuizPhase({
  room,
  gameState,
  currentPlayer,
  players,
  gameLogic,
  isSoloMode,
  wrongAnswers,
  resumeState,
}: QuizPhaseProps) {
  const router = useRouter()
  const params = useParams()
  const roomCode = params.roomCode as string

  const [timeLeft, setTimeLeft] = useState(300) // 5 menit (300 detik) untuk seluruh sesi
  const [isClient, setIsClient] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(resumeState?.currentIndex || 0)
  const [playerHealth, setPlayerHealth] = useState(resumeState?.health || 3)
  const [correctAnswers, setCorrectAnswers] = useState(resumeState?.correctAnswers || 0)
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [canSkipFeedback, setCanSkipFeedback] = useState(false)
  const [isProcessingAnswer, setIsProcessingAnswer] = useState(false)

  const currentQuestion = getQuestionByIndex(currentQuestionIndex)
  const totalQuestions = getTotalQuestions()
  const pulseIntensity = timeLeft <= 30 ? (31 - timeLeft) / 30 : 0

  const FEEDBACK_DURATION = 1000

  const getDangerLevel = () => {
    if (playerHealth <= 1) return 3
    if (playerHealth <= 2) return 2
    return 1
  }

  const dangerLevel = getDangerLevel()

  const saveGameCompletion = async (
    finalHealth: number,
    finalCorrect: number,
    totalAnswered: number,
    isEliminated = false,
  ) => {
    try {
      const { error } = await supabase.from("game_completions").insert({
        player_id: currentPlayer.id,
        room_id: room.id,
        final_health: finalHealth,
        correct_answers: finalCorrect,
        total_questions_answered: totalAnswered,
        is_eliminated: isEliminated,
        completion_type: isEliminated ? "eliminated" : finalCorrect === totalQuestions ? "completed" : "partial",
        completed_at: new Date().toISOString(),
      })

      if (error) {
        console.error("Error saving game completion:", error)
      } else {
        console.log("Game completion saved successfully")
      }
    } catch (error) {
      console.error("Error in saveGameCompletion:", error)
    }
  }

  const saveAnswerAndUpdateHealth = async (answer: string, isCorrectAnswer: boolean) => {
    try {
      setIsProcessingAnswer(true)

      const { error: answerError } = await supabase.from("player_answers").insert({
        player_id: currentPlayer.id,
        room_id: room.id,
        question_index: currentQuestionIndex,
        answer: answer,
        is_correct: isCorrectAnswer,
      })

      if (answerError) {
        console.error("Error saving answer:", answerError)
        return false
      }

      if (!isCorrectAnswer) {
        const { data: attackResult, error: attackError } = await supabase.rpc("handle_wrong_answer_attack", {
          p_player_id: currentPlayer.id,
          p_room_id: room.id,
          p_question_index: currentQuestionIndex,
          p_answer: answer,
          p_player_nickname: currentPlayer.nickname,
        })

        if (attackError) {
          console.error("Error handling attack:", attackError)
          return false
        }

        console.log("Attack result:", attackResult)

        if (attackResult && attackResult.new_health !== undefined) {
          setPlayerHealth(attackResult.new_health)
          return attackResult.new_health
        }
      }

      return true
    } catch (error) {
      console.error("Error in saveAnswerAndUpdateHealth:", error)
      return false
    } finally {
      setIsProcessingAnswer(false)
    }
  }

  const syncHealthFromDatabase = async () => {
    try {
      const { data, error } = await supabase.rpc("get_player_health", {
        p_player_id: currentPlayer.id,
        p_room_id: room.id,
      })

      if (error) {
        console.error("Error getting player health:", error)
        return
      }

      if (data !== null && data !== playerHealth) {
        console.log(`Health synced from database: ${data}`)
        setPlayerHealth(data)
      }
    } catch (error) {
      console.error("Error syncing health:", error)
    }
  }

  const redirectToResults = (
    health: number,
    correct: number,
    total: number,
    isEliminated = false,
    isPerfect = false,
  ) => {
    console.log(
      `Redirecting to results: health=${health}, correct=${correct}, total=${total}, eliminated=${isEliminated}, perfect=${isPerfect}`,
    )

    // Simpan penyelesaian game sebelum pengalihan
    saveGameCompletion(health, correct, total, isEliminated).then(() => {
      const urlParams = new URLSearchParams({
        health: health.toString(),
        correct: correct.toString(),
        total: total.toString(),
        nickname: encodeURIComponent(currentPlayer.nickname), // Tambahkan nickname
        ...(isEliminated && { eliminated: "true" }),
        ...(isPerfect && { perfect: "true" }),
      })

      router.push(`/game/${roomCode}/results?${urlParams.toString()}`)
    })
  }

  useEffect(() => {
    syncHealthFromDatabase()
    const healthSyncInterval = setInterval(syncHealthFromDatabase, 2000)
    return () => clearInterval(healthSyncInterval)
  }, [currentPlayer.id, room.id])

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (timeLeft > 0 && !isAnswered) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0) {
      setIsAnswered(true)
      redirectToResults(playerHealth, correctAnswers, currentQuestionIndex, playerHealth <= 0)
    }
  }, [timeLeft, isAnswered, playerHealth, correctAnswers, currentQuestionIndex])

  useEffect(() => {
    if (showFeedback) {
      const skipTimer = setTimeout(() => {
        setCanSkipFeedback(true)
      }, 600)
      return () => clearTimeout(skipTimer)
    }
  }, [showFeedback])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space" && canSkipFeedback && showFeedback) {
        e.preventDefault()
        skipFeedback()
      }
    }
    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [canSkipFeedback, showFeedback])

  const skipFeedback = () => {
    setShowFeedback(false)
    setCanSkipFeedback(false)

    if (playerHealth <= 0) {
      redirectToResults(0, correctAnswers, currentQuestionIndex + 1, true)
    } else if (currentQuestionIndex + 1 >= totalQuestions) {
      redirectToResults(playerHealth, correctAnswers, totalQuestions, false, correctAnswers === totalQuestions)
    } else {
      nextQuestion()
    }
  }

  const handleWrongAnswer = async () => {
    if (isProcessingAnswer) return

    setIsAnswered(true)
    setIsCorrect(false)
    setShowFeedback(true)
    setCanSkipFeedback(false)

    const result = await saveAnswerAndUpdateHealth(selectedAnswer || "TIME_UP", false)
    let newHealth = playerHealth
    if (!result) {
      newHealth = Math.max(0, playerHealth - 1)
      setPlayerHealth(newHealth)
    } else if (typeof result === "number") {
      newHealth = result
    }

    setTimeout(() => {
      if (showFeedback) {
        setShowFeedback(false)
        if (newHealth <= 0) {
          redirectToResults(0, correctAnswers, currentQuestionIndex + 1, true)
        } else if (currentQuestionIndex + 1 >= totalQuestions) {
          redirectToResults(newHealth, correctAnswers, totalQuestions, false, correctAnswers === totalQuestions)
        } else {
          nextQuestion()
        }
      }
    }, FEEDBACK_DURATION)
  }

  const handleCorrectAnswer = async () => {
    if (isProcessingAnswer) return

    const newCorrectAnswers = correctAnswers + 1
    setCorrectAnswers(newCorrectAnswers)
    setIsAnswered(true)
    setIsCorrect(true)
    setShowFeedback(true)
    setCanSkipFeedback(false)

    await saveAnswerAndUpdateHealth(selectedAnswer || "", true)

    setTimeout(() => {
      if (showFeedback) {
        setShowFeedback(false)
        if (currentQuestionIndex + 1 >= totalQuestions) {
          redirectToResults(playerHealth, newCorrectAnswers, totalQuestions, false, newCorrectAnswers === totalQuestions)
        } else {
          nextQuestion()
        }
      }
    }, FEEDBACK_DURATION)
  }

  const nextQuestion = () => {
    setCurrentQuestionIndex(currentQuestionIndex + 1)
    setSelectedAnswer(null)
    setIsAnswered(false)
  }

  const handleAnswerSelect = async (answer: string) => {
    if (isAnswered || !currentQuestion || isProcessingAnswer) return

    setSelectedAnswer(answer)

    if (answer === currentQuestion.correctAnswer) {
      await handleCorrectAnswer()
    } else {
      await handleWrongAnswer()
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`
  }

  const getAnswerButtonClass = (option: string) => {
    if (!isAnswered) {
      return "bg-gray-800 hover:bg-gray-700 border-gray-600 hover:border-red-500 text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]"
    }

    if (option === currentQuestion?.correctAnswer) {
      return "bg-green-600 border-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.5)]"
    }

    if (option === selectedAnswer && option !== currentQuestion?.correctAnswer) {
      return "bg-red-600 border-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]"
    }

    return "bg-gray-700 border-gray-600 text-gray-400"
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Skull className="w-16 h-16 text-red-500 mx-auto mb-4 animate-pulse" />
          <p className="text-white font-mono text-xl">Memuat pertanyaan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div
        className={`absolute inset-0 transition-all duration-1000 ${
          dangerLevel === 3
            ? "bg-gradient-to-br from-red-900/40 via-black to-red-950/40"
            : dangerLevel === 2
              ? "bg-gradient-to-br from-red-950/25 via-black to-purple-950/25"
              : "bg-gradient-to-br from-red-950/15 via-black to-purple-950/15"
        }`}
        style={{
          opacity: 0.3 + pulseIntensity * 0.4,
          filter: `hue-rotate(${pulseIntensity * 30}deg)`,
        }}
      />

      {isClient && (timeLeft <= 30 || dangerLevel >= 2) && (
        <div className="absolute inset-0">
          {[...Array(Math.floor((pulseIntensity + dangerLevel) * 5))].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-red-500 rounded-full animate-ping opacity-30"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 1}s`,
                animationDuration: `${0.8 + Math.random() * 1}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 container mx-auto px-4 py-8 pb-24">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <Skull className="w-8 h-8 text-red-500 mr-3 animate-pulse" />
            <h1 className="text-3xl font-bold text-white font-mono tracking-wider">UJIAN KEGELAPAN</h1>
            <Skull className="w-8 h-8 text-red-500 ml-3 animate-pulse" />
          </div>

          <div className="max-w-md mx-auto mb-4">
            <div className="flex items-center justify-center space-x-4 mb-2">
              <span className="text-white font-mono text-lg">
                Pertanyaan {currentQuestionIndex + 1} dari {totalQuestions}
              </span>
            </div>
            <Progress value={((currentQuestionIndex + 1) / totalQuestions) * 100} className="h-2 bg-gray-800" />
          </div>

          <div className="max-w-md mx-auto mb-6">
            <div className="flex items-center justify-center space-x-4 mb-3">
              <Clock className={`w-6 h-6 ${timeLeft <= 30 ? "text-red-500 animate-pulse" : "text-yellow-500"}`} />
              <span
                className={`text-2xl font-mono font-bold ${
                  timeLeft <= 30 ? "text-red-500 animate-pulse" : "text-white"
                }`}
              >
                {formatTime(timeLeft)}
              </span>
              {timeLeft <= 15 && <AlertTriangle className="w-6 h-6 text-red-500 animate-bounce" />}
            </div>
            <Progress value={(timeLeft / 300) * 100} className="h-3 bg-gray-800" />
          </div>

          <div className="flex items-center justify-center space-x-4 mb-4">
            <span className="text-white font-mono">Nyawa:</span>
            <div className="flex space-x-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className={`w-6 h-6 rounded-full border-2 transition-all duration-300 ${
                    i < playerHealth
                      ? playerHealth <= 1
                        ? "bg-red-500 border-red-400 animate-pulse"
                        : "bg-green-500 border-green-400"
                      : "bg-gray-600 border-gray-500"
                  }`}
                />
              ))}
            </div>
            <span className="text-gray-400 font-mono text-sm">Benar: {correctAnswers}</span>
            {isProcessingAnswer && (
              <span className="text-yellow-400 font-mono text-xs animate-pulse">Memproses...</span>
            )}
          </div>
        </div>

        <Card className="max-w-4xl mx-auto mb-8 bg-gray-900/90 border-red-900/50 backdrop-blur-sm">
          <div className="p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-purple-500/5" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`text-xs font-mono px-2 py-1 rounded ${
                    currentQuestion.difficulty === "mudah"
                      ? "bg-green-600"
                      : currentQuestion.difficulty === "sedang"
                        ? "bg-yellow-600"
                        : "bg-red-600"
                  } text-white`}
                >
                  {currentQuestion.difficulty.toUpperCase()}
                </span>
                <span className="text-xs font-mono text-gray-400 bg-gray-800 px-2 py-1 rounded">
                  {currentQuestion.category.replace("-", " ").toUpperCase()}
                </span>
              </div>

              <div className="flex items-start space-x-4 mb-8">
                <Zap className="w-8 h-8 text-purple-500 animate-pulse flex-shrink-0 mt-1" />
                <h2 className="text-2xl font-bold text-white leading-relaxed">{currentQuestion.question}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestion.options.map((option: string, index: number) => (
                  <Button
                    key={index}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={isAnswered || isProcessingAnswer}
                    className={`${getAnswerButtonClass(option)} p-6 text-left justify-start font-mono text-lg border-2 transition-all duration-300 relative overflow-hidden group ${
                      isProcessingAnswer ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <div className="flex items-center space-x-3 relative z-10">
                      <span className="w-8 h-8 rounded-full border-2 border-current flex-items-center justify-center text-sm font-bold">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span>{option}</span>
                      {isAnswered && option === currentQuestion.correctAnswer && (
                        <CheckCircle className="w-5 h-5 ml-auto animate-pulse" />
                      )}
                      {isAnswered && option === selectedAnswer && option !== currentQuestion.correctAnswer && (
                        <XCircle className="w-5 h-5 ml-auto animate-pulse" />
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <ZombieFeedback isCorrect={isCorrect} isVisible={showFeedback} canSkip={canSkipFeedback} onSkip={skipFeedback} />

      {isClient && (timeLeft <= 15 || dangerLevel >= 3) && (
        <div
          className="absolute inset-0 bg-red-500/10 animate-pulse pointer-events-none"
          style={{ animationDuration: `${Math.max(0.5, timeLeft * 0.3)}s` }}
        />
      )}
    </div>
  )
}
