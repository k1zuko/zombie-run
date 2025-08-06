// File: src/data/quiz-questions.ts
import { supabase } from "@/lib/supabase";

interface Question {
  id: string;
  question_type: "text" | "image";
  question_content: string;
  answers: { id: number; content: string; type: "text" | "image" }[];
  correct_answer: string;
  difficulty?: string;
  category?: string;
}

export async function initializeRandomQuestions(roomId: string): Promise<Question[]> {
  try {
    // Ambil question_count dari game_rooms
    const { data: roomData, error: roomError } = await supabase
      .from("game_rooms")
      .select("question_count")
      .eq("id", roomId)
      .single();

    if (roomError || !roomData) {
      console.error("Gagal mengambil question_count:", roomError);
      return [];
    }

    const questionCount = roomData.question_count || 50;

    // Ambil semua soal untuk room_id
    const { data, error } = await supabase
      .from("quiz_questions")
      .select("id, question_type, question_content, answers, correct_answer")
      .eq("room_id", roomId);

    if (error) {
      console.error("Gagal mengambil soal:", error);
      return [];
    }

    // Acak soal dan ambil sebanyak question_count
    const shuffledQuestions = data
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value)
      .slice(0, questionCount);

    return shuffledQuestions.map((q) => ({
      id: q.id,
      question_type: q.question_type,
      question_content: q.question_content,
      answers: q.answers,
      correct_answer: q.correct_answer,
      difficulty: "mudah",
      category: "umum",
    }));
  } catch (error) {
    console.error("Error di initializeRandomQuestions:", error);
    return [];
  }
}

export async function getQuestionByIndex(index: number, roomId: string): Promise<Question | null> {
  // Ambil daftar soal yang sudah diacak dari state atau database
  const questions = await initializeRandomQuestions(roomId);
  if (index >= questions.length) {
    return null;
  }
  return questions[index];
}

export async function getTotalQuestions(roomId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from("game_rooms")
      .select("question_count")
      .eq("id", roomId)
      .single();

    if (error) {
      console.error("Gagal mengambil question_count:", error);
      return 50; // Fallback
    }

    return data.question_count || 50;
  } catch (error) {
    console.error("Error di getTotalQuestions:", error);
    return 50;
  }
}

export async function getGameDuration(roomId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from("game_rooms")
      .select("duration")
      .eq("id", roomId)
      .single();

    if (error) {
      console.error("Gagal mengambil duration:", error);
      return 300; // Fallback ke 300 detik
    }

    return data.duration || 300;
  } catch (error) {
    console.error("Error di getGameDuration:", error);
    return 300;
  }
}