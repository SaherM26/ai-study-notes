"use client";

import { useEffect, useState } from "react";
import AssistantChat from "./AssistantChat";
const MAX_MATERIAL_LENGTH = 50000;
type Flashcard = {
  question: string;
  answer: string;
};
type QuizQuestion = {
  question: string;
  options: string[];
  answer: string;
};

type StudyResult = {
  summary: string;
  keyPoints: string[];
  questions: QuizQuestion[];
  flashcards: Flashcard[];
};

export default function Home() {
  const [material, setMaterial] = useState("");
  const [result, setResult] = useState<StudyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [sessionId, setSessionId] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const STORAGE_KEY = "studyai-session";

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) return;

      const parsed = JSON.parse(saved);

      if (typeof parsed.material === "string") {
        setMaterial(parsed.material);
      }

      if (parsed.result) {
        setResult(parsed.result);
      }
    } catch (error) {
      console.error("Failed to restore StudyAI session:", error);
    }
  }, []);

  useEffect(() => {
    if (!material && !result) return;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          material,
          result,
        })
      );
    } catch (error) {
      console.error("Failed to save StudyAI session:", error);
    }
  }, [material, result]);
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [".pdf", ".docx", ".txt"];
    const extension = file.name
      .substring(file.name.lastIndexOf("."))
      .toLowerCase();

    if (!allowedTypes.includes(extension)) {
      alert("Please upload a PDF, DOCX, or TXT file.");
      event.target.value = "";
      return;
    }

    setUploading(true);
    setFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload file.");
      }

      if (!data.text) {
        throw new Error("No text could be extracted from this file.");
      }

      if (data.text.length > MAX_MATERIAL_LENGTH) {
        alert(
          `The extracted text is too long. Please upload a shorter document (maximum ${MAX_MATERIAL_LENGTH.toLocaleString()} characters).`
        );
        setMaterial("");
        setFileName("");
        return;
      }

      setMaterial(data.text);

      alert(`"${file.name}" uploaded successfully!`);
    } catch (error) {
      console.error("File upload error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to process the uploaded file."
      );

      setFileName("");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };
  const generateNotes = async () => {
    const trimmedMaterial = material.trim();

    if (!trimmedMaterial) {
      alert("Please enter your study material first.");
      return;
    }

    if (trimmedMaterial.length > MAX_MATERIAL_LENGTH) {
      alert(
        `Please keep your study material under ${MAX_MATERIAL_LENGTH.toLocaleString()} characters.`
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          material: trimmedMaterial,
        }),
      });

      let data: StudyResult | { error?: string } | null = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        const errorMessage =
          data &&
            "error" in data &&
            typeof data.error === "string"
            ? data.error
            : "Failed to generate study notes.";

        throw new Error(errorMessage);
      }

      if (!data || !("summary" in data)) {
        throw new Error(
          "The AI returned an invalid study result."
        );
      }

      setResult(data);
    } catch (error) {
      console.error("Generation error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to generate study notes."
      );
    } finally {
      setLoading(false);
    }
  };

  const editMaterial = () => {
    setResult(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const startNewStudy = () => {
    setMaterial("");
    setResult(null);
    setSessionId((previous) => previous + 1);

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear StudyAI session:", error);
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };
  const copyNotes = async () => {
    if (!result) return;

    const notes = `STUDYAI - STUDY NOTES

SUMMARY
${result.summary}

KEY POINTS
${result.keyPoints
        .map((point, index) => `${index + 1}. ${point}`)
        .join("\n")}

QUESTIONS
${result.questions
        .map(
          (question, index) =>
            `Q${index + 1}. ${question.question}\nOptions: ${question.options.join(
              " | "
            )}\nAnswer: ${question.answer}`
        )
        .join("\n\n")}

FLASHCARDS
${result.flashcards
        .map(
          (card) =>
            `Question: ${card.question}\nAnswer: ${card.answer}`
        )
        .join("\n\n")}
`;

    try {
      await navigator.clipboard.writeText(notes);
      alert("Study notes copied!");
    } catch (error) {
      console.error("Failed to copy notes:", error);
      alert("Failed to copy study notes.");
    }
  };

  const startQuiz = () => {
    setQuizStarted(true);
    setQuizIndex(0);
    setSelectedAnswer(null);
    setQuizScore(0);
    setQuizFinished(false);
  };

  const selectAnswer = (answer: string) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(answer);

    if (answer === result?.questions[quizIndex].answer) {
      setQuizScore((previous) => previous + 1);
    }
  };

  const nextQuestion = () => {
    if (!result) return;

    if (quizIndex < result.questions.length - 1) {
      setQuizIndex((previous) => previous + 1);
      setSelectedAnswer(null);
    } else {
      setQuizFinished(true);
    }
  };

  const restartQuiz = () => {
    startQuiz();
  };

  /* RESULTS PAGE*/

  if (result) {
    return (
      <main className="app results-page">

        <header className="top-header">
          <div>
            <div className="logo">
              Study<span>AI</span>
            </div>

            <p className="tagline">
              Turn your study material into smarter notes.
            </p>
          </div>

          <div className="results-actions">
            <button
              className="copy-notes-button"
              onClick={copyNotes}
            >📋 Copy Notes</button>

            <button
              className="edit-button"
              onClick={editMaterial}
            > ← Edit Material</button>
          </div>
        </header>

        <AssistantChat
          key={sessionId}
          material={material}
          sessionId={sessionId}
        />
        <section className="results-header">
          <div>
            <p className="analysis-label">
              AI ANALYSIS COMPLETE
            </p>
            <h1>Your Study Notes</h1>
            <p className="results-description">
              Your material has been converted into
              revision-friendly content.
            </p>
          </div>
        </section>

        {/* FIRST ROW */}

        <section className="results-grid-three">

          {/* STUDY MATERIAL */}

          <article className="result-card flashcards-card">

            <div className="card-heading">
              <div>
                <h2>
                  <span className="card-icon"> 📚</span> Study Material
                </h2>
                <p> Your original material </p>
              </div>
            </div>

            <div className="content-box material-box">
              {material}
            </div>

          </article>

          {/* SUMMARY */}

          <article className="result-card">

            <div className="card-heading">
              <div>

                <h2>
                  <span className="card-icon"> 📋</span> Summary
                </h2>
                <p>Concise explanation </p>
              </div>
            </div>

            <div className="content-box summary-box">
              {result.summary}
            </div>
          </article>

          {/* KEY POINTS */}

          <article className="result-card">

            <div className="card-heading">
              <div>

                <h2>
                  <span className="card-icon">  🔑 </span> Key Points
                </h2>
                <p>Important concepts</p>
              </div>
            </div>

            <div className="key-points-list">

              {result.keyPoints.map(
                (point, index) => (
                  <div
                    className="key-point"
                    key={index}
                  >
                    <span className="number">
                      {index + 1}
                    </span>

                    <span>
                      {point}
                    </span>
                  </div>
                )
              )}

            </div>

          </article>

        </section>

        {/* SECOND ROW */}

        <section className="results-grid-two">

          {/* QUESTIONS */}

          <article className="result-card">

            <div className="card-heading">
              <div>
                <h2>
                  <span className="card-icon">❓</span>
                  Quiz
                </h2>

                <p>
                  Test your understanding
                </p>
              </div>
            </div>

            {!quizStarted && !quizFinished && (
              <div className="quiz-start">
                <p>
                  Test yourself with {result.questions.length} questions
                  based on your study material.
                </p>

                <button
                  className="quiz-start-button"
                  onClick={startQuiz}
                >
                  🎯 Start Quiz
                </button>
              </div>
            )}

            {quizStarted && !quizFinished && (
              <div className="quiz-container">

                <div className="quiz-progress">
                  Question {quizIndex + 1} of {result.questions.length}
                </div>

                <h3 className="quiz-question">
                  {result.questions[quizIndex].question}
                </h3>

                <div className="quiz-options">
                  {result.questions[quizIndex].options.map(
                    (option, index) => {

                      const isSelected = selectedAnswer === option;
                      const isCorrect =
                        option === result.questions[quizIndex].answer;

                      let className = "quiz-option";

                      if (selectedAnswer !== null) {
                        if (isCorrect) {
                          className += " quiz-correct";
                        } else if (isSelected) {
                          className += " quiz-incorrect";
                        }
                      }

                      return (
                        <button
                          key={index}
                          className={className}
                          onClick={() => selectAnswer(option)}
                          disabled={selectedAnswer !== null}
                        >
                          <span className="quiz-option-letter">
                            {String.fromCharCode(65 + index)}
                          </span>

                          <span>{option}</span>
                        </button>
                      );
                    }
                  )}
                </div>

                {selectedAnswer !== null && (
                  <div className="quiz-feedback">
                    {selectedAnswer ===
                      result.questions[quizIndex].answer
                      ? "✅ Correct!"
                      : `❌ Incorrect. The correct answer is "${result.questions[quizIndex].answer}".`}
                  </div>
                )}

                {selectedAnswer !== null && (
                  <button
                    className="quiz-next-button"
                    onClick={nextQuestion}
                  >
                    {quizIndex === result.questions.length - 1
                      ? "Finish Quiz"
                      : "Next Question →"}
                  </button>
                )}

              </div>
            )}

            {quizFinished && (
              <div className="quiz-finished">

                <div className="quiz-score">
                  🎉
                </div>

                <h3>Quiz Complete!</h3>

                <p className="quiz-score-text">
                  You scored{" "}
                  <strong>
                    {quizScore} / {result.questions.length}
                  </strong>
                </p>

                <button
                  className="quiz-start-button"
                  onClick={restartQuiz}
                >
                  🔄 Try Again
                </button>

              </div>
            )}

          </article>

          {/* FLASHCARDS */}

          <article className="result-card">

            <div className="card-heading">
              <div>

                <h2>
                  <span className="card-icon">
                    🧠
                  </span>

                  Flashcards
                </h2>

                <p>
                  Quick revision cards
                </p>

              </div>
            </div>

            <div className="flashcards-list">

              {result.flashcards.map(
                (card, index) => (
                  <div
                    className="flashcard"
                    key={index}
                  >

                    <h3>
                      {card.question}
                    </h3>

                    <p>
                      {card.answer}
                    </p>

                  </div>
                )
              )}

            </div>

          </article>

        </section>

        <footer className="footer">
          <div>StudyAI · AI-powered study assistant</div>

          <button
            className="clear-data-button"
            onClick={() => {
              const confirmed = window.confirm(
                "Clear all saved study data?\nThis will remove your saved material and generated notes."
              );

              if (confirmed) {
                localStorage.removeItem(STORAGE_KEY);
                setMaterial("");
                setFileName("");
                setResult(null);
                setSessionId((previous) => previous + 1);
              }
            }}
          >
            Clear Saved Data
          </button>
        </footer>

      </main>
    );
  }

  /*
   * 
   * LANDING PAGE
   * 
   */

  return (
    <main className="app landing-page">

      <header className="top-header">

        <div>

          <div className="logo">
            Study<span>AI</span>
          </div>

          <p className="tagline">
            Turn your study material into smarter notes.
          </p>

        </div>

      </header>

      <section className="hero">

        <h1>
          Study smarter, not harder.
        </h1>

        <p>
          Paste your study material and let AI turn it
          into summaries, key points, questions, and
          flashcards.
        </p>

      </section>

      <section className="landing-main">

        {/* MATERIAL INPUT */}

        <div className="material-card">

          <div className="material-header">

            <div>

              <h2>
                <span>
                  📚
                </span>

                Your Study Material
              </h2>

              <p>
                Paste your notes, textbook content,
                lecture material, or any study topic.
              </p>

            </div>

            <span
              className={`character-count ${material.length > MAX_MATERIAL_LENGTH
                ? "character-count-error"
                : ""
                }`}
            >
              {material.length.toLocaleString()} /{" "}
              {MAX_MATERIAL_LENGTH.toLocaleString()}
            </span>

          </div>
          <div className="file-upload">
            <label htmlFor="study-file" className="upload-button">
              📎 {uploading ? "Processing..." : "Upload PDF / DOCX / TXT"}
            </label>

            <input
              id="study-file"
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileUpload}
              disabled={uploading}
              hidden
            />

            {fileName && (
              <span className="uploaded-file-name">
                📄 {fileName}
              </span>
            )}
          </div>
          <textarea
            value={material}
            maxLength={MAX_MATERIAL_LENGTH}
            onChange={(e) =>
              setMaterial(e.target.value)
            }
            placeholder="Paste your notes, textbook content, lecture material, or any study topic here..."
          />

          <div className="generate-container">

            <div className="input-actions">
              <button
                className="clear-material-button"
                onClick={() => {
                  setMaterial("");
                  setFileName("");
                }}
                type="button"
              >
                Clear
              </button>

              <button
                className="generate-button"
                onClick={generateNotes}
                disabled={loading}
              >
                {loading
                  ? "✨ Generating..."
                  : "✨ Generate Study Notes"}
              </button>
            </div>
          </div>
        </div>

        {/* FEATURES */}

        <div className="features">

          <FeatureCard
            icon="📋"
            title="Summary"
            description="Get a concise explanation of your study material."
          />

          <FeatureCard
            icon="🔑"
            title="Key Points"
            description="Extract the most important concepts."
          />

          <FeatureCard
            icon="❓"
            title="Questions"
            description="Generate questions to test your understanding."
          />

          <FeatureCard
            icon="🧠"
            title="Flashcards"
            description="Turn important concepts into revision cards."
          />

        </div>

      </section>

      <footer className="footer">
        StudyAI · AI-powered study assistant
      </footer>

    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="feature-card">

      <div className="feature-icon">
        {icon}
      </div>

      <div>

        <h3>
          {title}
        </h3>

        <p>
          {description}
        </p>

      </div>

    </div>
  );
}