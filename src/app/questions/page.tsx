
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { HorrorAccordion, HorrorAccordionContent, HorrorAccordionItem, HorrorAccordionTrigger } from "@/components/ui/horror-accordion"
import { supabase } from "@/lib/supabase"
import { Trash2, Edit, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { HorrorTextarea } from "@/components/ui/HorrorTextarea"
import { HorrorTable, HorrorTableBody, HorrorTableCell, HorrorTableHead, HorrorTableHeader, HorrorTableRow } from "@/components/ui/HorrorTable"

type Quiz = {
  id: string
  theme: string
  description?: string
  duration?: number // Added duration field
}

type Question = {
  id: string
  quiz_id: string
  question_type: string
  question_text: string
  image_url: string | null
  options: string[]
  correct_answer: string
}

export default function QuestionsCRUD() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [questions, setQuestions] = useState<{ [quizId: string]: Question[] }>({})
  const [loading, setLoading] = useState(true)
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null)
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [isAddQuizModalOpen, setIsAddQuizModalOpen] = useState(false)
  const [isAddQuestionModalOpen, setIsAddQuestionModalOpen] = useState(false)
  const [quizFormData, setQuizFormData] = useState({
    theme: "",
    description: "",
    duration: "", // Added duration to form data
  })
  const [questionFormData, setQuestionFormData] = useState({
    question_type: "multiple_choice",
    question_text: "",
    image_url: "",
    options: ["", "", "", ""],
    correct_answer: "",
  })
  const [currentQuizIdForAdd, setCurrentQuizIdForAdd] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchQuizzesAndQuestions()
  }, [])

  const fetchQuizzesAndQuestions = async () => {
    setLoading(true)
    const { data: quizzesData, error: quizzesError } = await supabase
      .from("quizzes")
      .select("id, theme, description, duration") // Added duration to select
      .order("created_at", { ascending: false })

    if (quizzesError) {
      console.error("Error fetching quizzes:", quizzesError)
    } else {
      setQuizzes(quizzesData || [])
      const quizIds = quizzesData?.map(q => q.id) || []
      if (quizIds.length > 0) {
        const { data: questionsData, error: questionsError } = await supabase
          .from("quiz_questions")
          .select("*")
          .in("quiz_id", quizIds)
          .order("created_at", { ascending: false })

        if (questionsError) {
          console.error("Error fetching questions:", questionsError)
        } else {
          const groupedQuestions: { [quizId: string]: Question[] } = {}
          questionsData?.forEach(q => {
            if (!groupedQuestions[q.quiz_id]) {
              groupedQuestions[q.quiz_id] = []
            }
            groupedQuestions[q.quiz_id].push(q)
          })
          setQuestions(groupedQuestions)
        }
      }
    }
    setLoading(false)
  }

  const handleQuizInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setQuizFormData({ ...quizFormData, [name]: name === "duration" ? value : value })
  }

  const handleQuestionInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setQuestionFormData({ ...questionFormData, [e.target.name]: e.target.value })
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...questionFormData.options]
    newOptions[index] = value
    setQuestionFormData({ ...questionFormData, options: newOptions })
  }

  const handleSubmitQuiz = async (e: React.FormEvent) => {
    e.preventDefault()
    const { theme, description, duration } = quizFormData

    if (!theme || !duration) {
      alert("Tema dan durasi harus diisi!")
      return
    }

    if (selectedQuiz) {
      // Update Quiz
      const { error } = await supabase
        .from("quizzes")
        .update({ theme, description, duration: parseInt(duration) })
        .eq("id", selectedQuiz.id)

      if (error) {
        console.error("Error updating quiz:", error)
      } else {
        fetchQuizzesAndQuestions()
        resetQuizForm()
      }
    } else {
      // Create Quiz
      const { data, error } = await supabase
        .from("quizzes")
        .insert({ theme, description, duration: parseInt(duration) })
        .select()
        .single()

      if (error) {
        console.error("Error creating quiz:", error)
      } else {
        fetchQuizzesAndQuestions()
        resetQuizForm()
        setIsAddQuizModalOpen(false)
      }
    }
  }

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    const { question_type, question_text, image_url, options, correct_answer } = questionFormData
    const quiz_id = selectedQuestion?.quiz_id || currentQuizIdForAdd

    if (!quiz_id) return

    if (selectedQuestion) {
      // Update Question
      const { error } = await supabase
        .from("quiz_questions")
        .update({
          question_type,
          question_text,
          image_url: image_url || null,
          options,
          correct_answer,
        })
        .eq("id", selectedQuestion.id)

      if (error) {
        console.error("Error updating question:", error)
      } else {
        fetchQuizzesAndQuestions()
        resetQuestionForm()
      }
    } else {
      // Create Question
      const { error } = await supabase
        .from("quiz_questions")
        .insert({
          quiz_id,
          question_type,
          question_text,
          image_url: image_url || null,
          options,
          correct_answer,
        })

      if (error) {
        console.error("Error creating question:", error)
      } else {
        fetchQuizzesAndQuestions()
        resetQuestionForm()
        setIsAddQuestionModalOpen(false)
      }
    }
  }

  const handleEditQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz)
    setQuizFormData({
      theme: quiz.theme,
      description: quiz.description || "",
      duration: quiz.duration?.toString() || "", // Convert duration to string for input
    })
  }

  const handleDeleteQuiz = async (id: string) => {
    if (confirm("Yakin ingin menghapus quiz ini? Semua soal di dalamnya juga akan dihapus.")) {
      // First delete questions
      await supabase
        .from("quiz_questions")
        .delete()
        .eq("quiz_id", id)

      // Then delete quiz
      const { error } = await supabase
        .from("quizzes")
        .delete()
        .eq("id", id)

      if (error) {
        console.error("Error deleting quiz:", error)
      } else {
        fetchQuizzesAndQuestions()
      }
    }
  }

  const handleEditQuestion = (question: Question) => {
    setSelectedQuestion(question)
    setQuestionFormData({
      question_type: question.question_type,
      question_text: question.question_text,
      image_url: question.image_url || "",
      options: question.options,
      correct_answer: question.correct_answer,
    })
  }

  const handleDeleteQuestion = async (id: string) => {
    if (confirm("Yakin ingin menghapus soal ini?")) {
      const { error } = await supabase
        .from("quiz_questions")
        .delete()
        .eq("id", id)

      if (error) {
        console.error("Error deleting question:", error)
      } else {
        fetchQuizzesAndQuestions()
      }
    }
  }

  const openAddQuestionModal = (quizId: string) => {
    setCurrentQuizIdForAdd(quizId)
    setSelectedQuestion(null)
    resetQuestionForm()
    setIsAddQuestionModalOpen(true)
  }

  const resetQuizForm = () => {
    setSelectedQuiz(null)
    setQuizFormData({
      theme: "",
      description: "",
      duration: "",
    })
  }

  const resetQuestionForm = () => {
    setSelectedQuestion(null)
    setQuestionFormData({
      question_type: "multiple_choice",
      question_text: "",
      image_url: "",
      options: ["", "", "", ""],
      correct_answer: "",
    })
  }

  return (
    <div className="min-h-screen bg-black text-red-200 p-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        Kembali
      </Button>
      <Card className="bg-black/80 border-red-900/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-red-200 font-mono">Daftar Quiz dan Soal</CardTitle>
          <Dialog open={isAddQuizModalOpen} onOpenChange={setIsAddQuizModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Tambah Quiz Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-black/90 border-red-900/50 text-red-200">
              <DialogHeader>
                <DialogTitle className="font-mono">{selectedQuiz ? "Edit Quiz" : "Tambah Quiz Baru"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmitQuiz} className="space-y-4">
                <div>
                  <Label htmlFor="theme" className="font-mono">Tema Quiz</Label>
                  <Input
                    id="theme"
                    name="theme"
                    value={quizFormData.theme}
                    onChange={handleQuizInputChange}
                    className="bg-black/50 border-red-900/50 text-red-200 font-mono focus:border-red-400/50 focus:ring-red-400/20"
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="font-mono">Deskripsi (opsional)</Label>
                  <HorrorTextarea
                    id="description"
                    name="description"
                    value={quizFormData.description}
                    onChange={handleQuizInputChange}
                    className="bg-black/50 border-red-900/50 text-red-200 font-mono focus:border-red-400/50 focus:ring-red-400/20"
                  />
                </div>
                <div>
                  <Label htmlFor="duration" className="font-mono">Durasi (menit)</Label>
                  <Input
                    id="duration"
                    name="duration"
                    type="number"
                    min="1"
                    value={quizFormData.duration}
                    onChange={handleQuizInputChange}
                    className="bg-black/50 border-red-900/50 text-red-200 font-mono focus:border-red-400/50 focus:ring-red-400/20"
                    placeholder="Masukkan durasi (menit)"
                  />
                </div>
                <Button type="submit" className="w-full font-mono">{selectedQuiz ? "Update" : "Simpan"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="font-mono">Memuat...</p>
          ) : (
            <HorrorAccordion type="single" collapsible className="w-full">
              {quizzes.map((quiz) => (
                <HorrorAccordionItem value={quiz.id} key={quiz.id}>
                  <HorrorAccordionTrigger className="flex justify-between">
                    <span>{quiz.theme} {quiz.duration ? `(${quiz.duration} menit)` : ""}</span>
                    <div className="flex gap-2">
                      <span
                        className="inline-flex items-center justify-center size-9 rounded-md bg-black/80 border border-red-900/50 text-red-200 hover:bg-red-900/20 hover:shadow-[0_0_10px_rgba(255,0,0,0.3)] transition-all duration-200 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditQuiz(quiz)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </span>
                      <span
                        className="inline-flex items-center justify-center size-9 rounded-md bg-black/80 border border-red-900/50 text-red-200 hover:bg-red-900/20 hover:shadow-[0_0_10px_rgba(255,0,0,0.3)] transition-all duration-200 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteQuiz(quiz.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </span>
                      <span
                        className="inline-flex items-center justify-center size-9 rounded-md bg-black/80 border border-red-900/50 text-red-200 hover:bg-red-900/20 hover:shadow-[0_0_10px_rgba(255,0,0,0.3)] transition-all duration-200 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          openAddQuestionModal(quiz.id)
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </span>
                    </div>
                  </HorrorAccordionTrigger>
                  <HorrorAccordionContent>
                    <HorrorTable>
                      <HorrorTableHead>
                        <HorrorTableRow>
                          <HorrorTableHeader>Tipe</HorrorTableHeader>
                          <HorrorTableHeader>Soal</HorrorTableHeader>
                          <HorrorTableHeader>Opsi</HorrorTableHeader>
                          <HorrorTableHeader>Jawaban Benar</HorrorTableHeader>
                          <HorrorTableHeader>Aksi</HorrorTableHeader>
                        </HorrorTableRow>
                      </HorrorTableHead>
                      <HorrorTableBody>
                        {(questions[quiz.id] || []).map((q) => (
                          <HorrorTableRow key={q.id}>
                            <HorrorTableCell>{q.question_type}</HorrorTableCell>
                            <HorrorTableCell>{q.question_text}</HorrorTableCell>
                            <HorrorTableCell>{q.options.join(", ")}</HorrorTableCell>
                            <HorrorTableCell>{q.correct_answer}</HorrorTableCell>
                            <HorrorTableCell className="flex gap-2">
                              <Dialog open={selectedQuestion?.id === q.id} onOpenChange={(open) => !open && resetQuestionForm()}>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={() => handleEditQuestion(q)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-black/90 border-red-900/50 text-red-200">
                                  <DialogHeader>
                                    <DialogTitle className="font-mono">Edit Soal</DialogTitle>
                                  </DialogHeader>
                                  <form onSubmit={handleSubmitQuestion} className="space-y-4">
                                    <div>
                                      <Label htmlFor="question_type" className="font-mono">Tipe Soal</Label>
                                      <Input
                                        id="question_type"
                                        name="question_type"
                                        value={questionFormData.question_type}
                                        onChange={handleQuestionInputChange}
                                        className="bg-black/50 border-red-900/50 text-red-200 font-mono focus:border-red-400/50 focus:ring-red-400/20"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="question_text" className="font-mono">Teks Soal</Label>
                                      <HorrorTextarea
                                        id="question_text"
                                        name="question_text"
                                        value={questionFormData.question_text}
                                        onChange={handleQuestionInputChange}
                                        className="bg-black/50 border-red-900/50 text-red-200 font-mono focus:border-red-400/50 focus:ring-red-400/20"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="image_url" className="font-mono">URL Gambar (opsional)</Label>
                                      <Input
                                        id="image_url"
                                        name="image_url"
                                        value={questionFormData.image_url}
                                        onChange={handleQuestionInputChange}
                                        className="bg-black/50 border-red-900/50 text-red-200 font-mono focus:border-red-400/50 focus:ring-red-400/20"
                                      />
                                    </div>
                                    <div>
                                      <Label className="font-mono">Opsi Jawaban (4 opsi)</Label>
                                      {questionFormData.options.map((opt, idx) => (
                                        <Input
                                          key={idx}
                                          placeholder={`Opsi ${idx + 1}`}
                                          value={opt}
                                          onChange={(e) => handleOptionChange(idx, e.target.value)}
                                          className="mt-2 bg-black/50 border-red-900/50 text-red-200 font-mono focus:border-red-400/50 focus:ring-red-400/20"
                                        />
                                      ))}
                                    </div>
                                    <div>
                                      <Label htmlFor="correct_answer" className="font-mono">Jawaban Benar</Label>
                                      <Input
                                        id="correct_answer"
                                        name="correct_answer"
                                        value={questionFormData.correct_answer}
                                        onChange={handleQuestionInputChange}
                                        className="bg-black/50 border-red-900/50 text-red-200 font-mono focus:border-red-400/50 focus:ring-red-400/20"
                                      />
                                    </div>
                                    <Button type="submit" className="w-full font-mono">Update</Button>
                                  </form>
                                </DialogContent>
                              </Dialog>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteQuestion(q.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </HorrorTableCell>
                          </HorrorTableRow>
                        ))}
                      </HorrorTableBody>
                    </HorrorTable>
                  </HorrorAccordionContent>
                </HorrorAccordionItem>
              ))}
            </HorrorAccordion>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Question Modal */}
      <Dialog open={isAddQuestionModalOpen} onOpenChange={setIsAddQuestionModalOpen}>
        <DialogContent className="bg-black/90 border-red-900/50 text-red-200">
          <DialogHeader>
            <DialogTitle className="font-mono">{selectedQuestion ? "Edit Soal" : "Tambah Soal Baru"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitQuestion} className="space-y-4">
            <div>
              <Label htmlFor="question_type" className="font-mono">Tipe Soal</Label>
              <Input
                id="question_type"
                name="question_type"
                value={questionFormData.question_type}
                onChange={handleQuestionInputChange}
                className="bg-black/50 border-red-900/50 text-red-200 font-mono focus:border-red-400/50 focus:ring-red-400/20"
              />
            </div>
            <div>
              <Label htmlFor="question_text" className="font-mono">Teks Soal</Label>
              <HorrorTextarea
                id="question_text"
                name="question_text"
                value={questionFormData.question_text}
                onChange={handleQuestionInputChange}
                className="bg-black/50 border-red-900/50 text-red-200 font-mono focus:border-red-400/50 focus:ring-red-400/20"
              />
            </div>
            <div>
              <Label htmlFor="image_url" className="font-mono">URL Gambar (opsional)</Label>
              <Input
                id="image_url"
                name="image_url"
                value={questionFormData.image_url}
                onChange={handleQuestionInputChange}
                className="bg-black/50 border-red-900/50 text-red-200 font-mono focus:border-red-400/50 focus:ring-red-400/20"
              />
            </div>
            <div>
              <Label className="font-mono">Opsi Jawaban (4 opsi)</Label>
              {questionFormData.options.map((opt, idx) => (
                <Input
                  key={idx}
                  placeholder={`Opsi ${idx + 1}`}
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  className="mt-2 bg-black/50 border-red-900/50 text-red-200 font-mono focus:border-red-400/50 focus:ring-red-400/20"
                />
              ))}
            </div>
            <div>
              <Label htmlFor="correct_answer" className="font-mono">Jawaban Benar</Label>
              <Input
                id="correct_answer"
                name="correct_answer"
                value={questionFormData.correct_answer}
                onChange={handleQuestionInputChange}
                className="bg-black/50 border-red-900/50 text-red-200 font-mono focus:border-red-400/50 focus:ring-red-400/20"
              />
            </div>
            <Button type="submit" className="w-full font-mono">{selectedQuestion ? "Update" : "Simpan"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Quiz Modal */}
      <Dialog open={!!selectedQuiz && !isAddQuizModalOpen} onOpenChange={(open) => !open && resetQuizForm()}>
        <DialogContent className="bg-black/90 border-red-900/50 text-red-200">
          <DialogHeader>
            <DialogTitle className="font-mono">Edit Quiz</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitQuiz} className="space-y-4">
            <div>
              <Label htmlFor="theme" className="font-mono">Tema Quiz</Label>
              <Input
                id="theme"
                name="theme"
                value={quizFormData.theme}
                onChange={handleQuizInputChange}
                className="bg-black/50 border-red-900/50 text-red-200 font-mono focus:border-red-400/50 focus:ring-red-400/20"
              />
            </div>
            <div>
              <Label htmlFor="description" className="font-mono">Deskripsi (opsional)</Label>
              <HorrorTextarea
                id="description"
                name="description"
                value={quizFormData.description}
                onChange={handleQuizInputChange}
                className="bg-black/50 border-red-900/50 text-red-200 font-mono focus:border-red-400/50 focus:ring-red-400/20"
              />
            </div>
            <div>
              <Label htmlFor="duration" className="font-mono">Durasi (menit)</Label>
              <Input
                id="duration"
                name="duration"
                type="number"
                min="1"
                value={quizFormData.duration}
                onChange={handleQuizInputChange}
                className="bg-black/50 border-red-900/50 text-red-200 font-mono focus:border-red-400/50 focus:ring-red-400/20"
                placeholder="Masukkan durasi (menit)"
              />
            </div>
            <Button type="submit" className="w-full font-mono">Update</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
