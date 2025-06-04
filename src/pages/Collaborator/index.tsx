import { useEffect, useState } from "react";
import { Container, Section, Title, Subtitle, CustomButton } from "./styles";
import CardQuizz from "../Components/CardQuizz";
import httpClient from "../../services/api";
import { useAuth } from "../../auth/AuthContext";
import { Header } from "../Components/Header";
import { toast } from "react-toastify";
import Resultado from "../Components/pdfGenerator";

interface Answer {
  id: number;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: number;
  question: string;
  urlImg: string
  answers: Answer[];
  difficulty: "easy" | "medium" | "hard";
}

interface Quiz {
  id: number;
  title: string;
  difficulty: string;
  questions: Question[];
}

export default function Collaborator() {
  const { user, logout } = useAuth();

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    "easy" | "medium" | "hard" | ""
  >("");
  const [startQuizz, setStartQuizz] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [showResultado, setShowResultado] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (user?.role !== "collaborator") {
      toast.error("Você não está autorizado a acessar essa página");
      logout();
    } else {
      fetchQuizzes();
    }
  }, []);

  const fetchQuizzes = async () => {
    try {
      const response = await httpClient.get<Quiz[]>("quiz/list");
      setQuizzes(response.data);
    } catch (error) {
      console.error("Erro ao buscar quizzes:", error);
    }
  };

  const handleStartQuiz = () => {
    if (!selectedDifficulty) {
      toast.error("Por favor, selecione um nível para iniciar");
      return;
    }

    const allQuestions = quizzes.flatMap((quiz) => quiz);
    const questions = allQuestions.filter(
      (q) => q.difficulty === selectedDifficulty
    );

    const questionsForLevel: Question[] = questions[0]?.questions || [];

    setUserAnswers(Array(questionsForLevel.length).fill(-1));
    setFilteredQuestions(questionsForLevel);
    setStartQuizz(true);
    setCurrentIndex(0);
    setShowResultado(false); // reset resultado ao iniciar quiz
  };

  const handleNext = () => {
    if (currentIndex < filteredQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleAnswerSelected = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...userAnswers];
    newAnswers[questionIndex] = answerIndex;
    setUserAnswers(newAnswers);
  };

  const handleFinish = () => {
    const unanswered = userAnswers.some((answer) => answer === -1);

    if (unanswered) {
      toast.error("Por favor, responda todas as perguntas antes de finalizar");
      return;
    }

    const calculatedScore = filteredQuestions.reduce((acc, question, index) => {
      const correctAnswerIndex = question.answers.findIndex((a) => a.isCorrect);
      return acc + (userAnswers[index] === correctAnswerIndex ? 1 : 0);
    }, 0);

    setScore(calculatedScore);
    setShowResultado(true); // mostra o PDF
    setStartQuizz(false);

    toast.success(
      `Quiz finalizado! Você acertou ${calculatedScore} de ${filteredQuestions.length} perguntas`,
      {
        autoClose: false,
        closeButton: true,
      }
    );
  };

  if (showResultado) {
    // Status simples para exemplo: "Aprovado" se acertar >= 70%
    const status =
      score / filteredQuestions.length >= 0.7 ? "Aprovado" : "Reprovado";

    return (
      <Container>
        <Header />
        <Section style={{ backgroundColor: "#fff" }}>
          <Resultado
            nome={user?.name || "Usuário"}
            pontuacao={score}
            status={status}
          />
          <CustomButton
            onClick={() => {
              setShowResultado(false);
              setSelectedDifficulty("");
              setUserAnswers([]);
              setFilteredQuestions([]);
              setCurrentIndex(0);
            }}
          >
            Voltar para seleção
          </CustomButton>
        </Section>
      </Container>
    );
  }

  return (
    <Container>
      <Header />
      <Section style={{ backgroundColor: "#fff" }}>
        {!startQuizz ? (
          <div
            style={{
              width: "100%",
              alignItems: "center",
              flexDirection: "column",
              justifyContent: "center",
              display: "flex",
            }}
          >
            <Title style={{ marginBottom: -20 }}>Escolha o Nível</Title>
            <Subtitle style={{ color: "gray", marginBottom: 20, fontSize: 16 }}>
              Selecione o nível do quiz para iniciar
            </Subtitle>

            <select
              value={selectedDifficulty}
              onChange={(e) =>
                setSelectedDifficulty(
                  e.target.value as "easy" | "medium" | "hard"
                )
              }
              style={{
                marginBottom: 40,
                padding: 10,
                fontSize: 16,
                borderRadius: 6,
                backgroundColor: "#fff",
                width: "40%",
                borderWidth: 1,
                cursor: "pointer",
              }}
            >
              <option value="" disabled>
                -- Selecione um nível --
              </option>
              <option value="easy">Fácil</option>
              <option value="medium">Médio</option>
              <option value="hard">Difícil</option>
            </select>

            <CustomButton onClick={handleStartQuiz}>Iniciar Quiz</CustomButton>
          </div>
        ) : filteredQuestions.length > 0 ? (
          <div
            style={{
              flexDirection: "row",
              width: "100%",
              display: "flex",
              justifyContent: "space-around",
              padding: 10,
            }}
          >
            {filteredQuestions.length > 0 && (
              <div
                key={filteredQuestions[currentIndex].id}
                style={{ width:'60%' }}
              >
                {filteredQuestions[currentIndex].answers.length === 0 ? (
                  <div>Não há itens</div>
                ) : (
                  <CardQuizz
                    question={filteredQuestions[currentIndex].question}
                    options={filteredQuestions[currentIndex].answers.map(
                      (a) => a.text
                    )}
                    correctAnswerIndex={filteredQuestions[
                      currentIndex
                    ].answers.findIndex((a) => a.isCorrect)}
                    currentIndex={currentIndex}
                    imageUrl={filteredQuestions[currentIndex].urlImg || ''}
                    totalQuestions={filteredQuestions.length}
                    onNext={handleNext}
                    onPrevious={handlePrevious}
                    onFinish={handleFinish}
                    onAnswerSelected={handleAnswerSelected}
                    userId={Number(user?.id)}
                    quizId={quizzes[0].id}
                    category={""}
                  />
                )}
              </div>
            )}
          </div>
        ) : (
          <p>Quiz sem perguntas ou carregando...</p>
        )}
      </Section>
    </Container>
  );
}