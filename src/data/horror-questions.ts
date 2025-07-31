export interface HorrorQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: string
  category: "mitologi" | "film-horror" | "supernatural" | "psikologi" | "okultisme"
  difficulty: "mudah" | "sedang" | "sulit"
}

export const horrorQuestions: HorrorQuestion[] = [
  {
    id: "q1",
    question: "Makhluk apa yang dipercaya berubah wujud saat bulan purnama?",
    options: ["Vampir", "Manusia Serigala", "Zombie", "Hantu"],
    correctAnswer: "Manusia Serigala",
    category: "mitologi",
    difficulty: "mudah",
  },
  {
    id: "q2",
    question: "Dalam mitologi Indonesia, apa nama hantu wanita yang meninggal saat melahirkan?",
    options: ["Kuntilanak", "Pocong", "Genderuwo", "Tuyul"],
    correctAnswer: "Kuntilanak",
    category: "mitologi",
    difficulty: "mudah",
  },
  {
    id: "q3",
    question: "Apa nama fobia terhadap kegelapan?",
    options: ["Arachnophobia", "Claustrophobia", "Nyctophobia", "Acrophobia"],
    correctAnswer: "Nyctophobia",
    category: "psikologi",
    difficulty: "sedang",
  },
  {
    id: "q4",
    question: "Hantu apa yang digambarkan dengan kain kafan putih dan melompat-lompat?",
    options: ["Kuntilanak", "Pocong", "Wewe Gombel", "Leak"],
    correctAnswer: "Pocong",
    category: "mitologi",
    difficulty: "mudah",
  },
  {
    id: "q5",
    question: "Dalam film horror Indonesia, siapa sutradara yang terkenal dengan film 'Pengabdi Setan'?",
    options: ["Joko Anwar", "Rizal Mantovani", "Kimo Stamboel", "Rocky Soraya"],
    correctAnswer: "Joko Anwar",
    category: "film-horror",
    difficulty: "sedang",
  },
  {
    id: "q6",
    question: "Apa nama makhluk halus dalam budaya Jawa yang suka mengganggu anak kecil?",
    options: ["Wewe Gombel", "Sundel Bolong", "Banaspati", "Buto Ijo"],
    correctAnswer: "Wewe Gombel",
    category: "mitologi",
    difficulty: "sedang",
  },
  {
    id: "q7",
    question: "Kondisi psikologis apa yang membuat seseorang merasa sudah mati atau tidak ada?",
    options: ["Sindrom Capgras", "Sindrom Cotard", "Sindrom Fregoli", "Sindrom Alice in Wonderland"],
    correctAnswer: "Sindrom Cotard",
    category: "psikologi",
    difficulty: "sulit",
  },
  {
    id: "q8",
    question: "Dalam kepercayaan okultisme, apa nama praktik berkomunikasi dengan arwah orang mati?",
    options: ["Ramalan", "Nekromansi", "Alkimia", "Astrologi"],
    correctAnswer: "Nekromansi",
    category: "okultisme",
    difficulty: "sulit",
  },
  {
    id: "q9",
    question: "Apa nama hantu dalam mitologi Indonesia yang berbentuk bola api?",
    options: ["Banaspati", "Leak", "Penanggalan", "Asuang"],
    correctAnswer: "Banaspati",
    category: "mitologi",
    difficulty: "sedang",
  },
  {
    id: "q10",
    question: "Dalam film horror klasik, monster apa yang takut dengan bawang putih dan salib?",
    options: ["Werewolf", "Vampir", "Zombie", "Mummy"],
    correctAnswer: "Vampir",
    category: "film-horror",
    difficulty: "mudah",
  },
]

export function getQuestionByIndex(index: number): HorrorQuestion | null {
  return horrorQuestions[index] || null
}

export function getTotalQuestions(): number {
  return horrorQuestions.length
}

export function getRandomQuestion(): HorrorQuestion {
  return horrorQuestions[Math.floor(Math.random() * horrorQuestions.length)]
}
