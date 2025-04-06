import React, { useEffect, useState } from 'react';
import { Question } from '../types/quizTypes';

type Props = {
  questions: Question[];
  currentIndex: number;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
  themeImage: string;
  onClose: () => void;
};

const QuizPreview = ({
  questions,
  currentIndex,
  setCurrentIndex,
  themeImage,
  onClose,
}: Props) => {
  const question = questions[currentIndex];
  const [timeLeft, setTimeLeft] = useState(question.timer);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    setTimeLeft(question.timer);
    setShowAnswer(false);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === 1) {
          clearInterval(interval);
          setShowAnswer(true);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [question]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-start pt-24 text-white"
      style={{
        backgroundImage: `url(${themeImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Top Close + Question */}
      <div className="absolute top-4 right-4">
        <button
          onClick={onClose}
          className="text-white text-xl bg-red-600 px-4 py-2 rounded shadow hover:bg-red-700"
        >
          ✖ Close
        </button>
      </div>

      <h1 className="text-3xl md:text-4xl font-bold text-center max-w-4xl px-4 mb-6">{question.text}</h1>

      {/* Question Image */}
      {question.image && (
        <div className="mb-6">
          <img src={question.image} alt="Question" className="max-h-64 rounded-lg shadow-xl" />
        </div>
      )}

      {/* Center Stats Row */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-3xl font-bold bg-black/50 px-4 py-2 rounded-xl shadow">
        ⏱ {timeLeft}s
      </div>
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xl font-semibold bg-black/50 px-4 py-2 rounded-xl shadow">
        🚀 32 Answers
      </div>

      {/* Answer Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full px-4 mt-6">
        {question.options.map((opt, idx) => {
          const isCorrect = opt.isCorrect;
          const colorClasses = [
            'bg-red-500',
            'bg-blue-500',
            'bg-yellow-400 text-black',
            'bg-green-500',
            'bg-pink-500',
            'bg-indigo-500',
          ];
          return (
            <div
              key={idx}
              className={`rounded-xl p-6 flex items-center justify-center text-center font-semibold text-lg transition duration-300 shadow-lg ${
                showAnswer
                  ? isCorrect
                    ? 'bg-green-600'
                    : 'bg-gray-500'
                  : colorClasses[idx % colorClasses.length]
              }`}
            >
              {opt.image ? (
                <img
                  src={opt.image}
                  alt={`Option ${idx + 1}`}
                  className="max-h-24 object-contain"
                />
              ) : (
                <span className="text-white text-lg font-bold">{opt.text}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-center gap-4 mt-12">
        <button
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((prev) => prev - 1)}
          className="bg-white text-black font-bold px-6 py-2 rounded-lg shadow disabled:opacity-30"
        >
          ⬅ Previous
        </button>
        <button
          disabled={currentIndex === questions.length - 1}
          onClick={() => setCurrentIndex((prev) => prev + 1)}
          className="bg-white text-black font-bold px-6 py-2 rounded-lg shadow disabled:opacity-30"
        >
          Next ➡
        </button>
      </div>
    </div>
  );
};

export default QuizPreview;
