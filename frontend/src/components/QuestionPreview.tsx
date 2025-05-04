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

  const renderOptionContent = (opt: any) => (
    <>
      {opt.image && <img src={opt.image} alt="option" className="max-w-full max-h-[250px] rounded mb-2" />}
      {opt.audio && <audio controls src={opt.audio} className="w-full mt-2" />}
      {opt.video && <video controls src={opt.video} className="w-full max-h-[250px] mt-2 rounded" />}
      {!opt.image && !opt.audio && !opt.video && (
        <span className="text-lg font-bold text-white">{opt.text}</span>
      )}
    </>
  );

  const renderOptions = () => {
    const colorClasses = [
      'bg-red-500',
      'bg-blue-500',
      'bg-yellow-400 text-black',
      'bg-green-500',
      'bg-pink-500',
      'bg-indigo-500',
    ];

    if (question.type === 'TrueFalse') {
      return (
        <div className="grid grid-cols-2 gap-6 max-w-2xl w-full px-4 mt-6">
          {['True', 'False'].map((label, idx) => {
            const isCorrect = question.options[idx]?.isCorrect;
            return (
              <div
                key={idx}
                className={`rounded-xl p-6 text-center font-semibold text-lg shadow-lg ${
                  showAnswer
                    ? isCorrect
                      ? 'bg-green-600'
                      : 'bg-gray-500'
                    : idx === 0
                    ? 'bg-green-500'
                    : 'bg-red-500'
                }`}
              >
                {label}
              </div>
            );
          })}
        </div>
      );
    }

    if (question.type === 'TypeAnswer') {
      return (
        <div className="mt-6 text-center text-xl bg-white/70 text-black px-8 py-4 rounded-lg shadow max-w-xl">
          <strong>Expected Answer:</strong> {showAnswer ? question.options[0]?.text : '???'}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full px-4 mt-6">
        {question.options.map((opt, idx) => {
          const isCorrect = opt.isCorrect;
          return (
            <div
              key={idx}
              className={`rounded-xl p-6 text-center font-semibold text-lg transition duration-300 shadow-lg ${
                showAnswer
                  ? isCorrect
                    ? 'bg-green-600'
                    : 'bg-gray-500'
                  : colorClasses[idx % colorClasses.length]
              }`}
            >
              {renderOptionContent(opt)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-start pt-24 text-white overflow-y-auto"
      style={{
        backgroundImage: `url(${themeImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Close */}
      <div className="absolute top-4 right-4">
        <button
          onClick={onClose}
          className="text-white text-xl bg-red-600 px-4 py-2 rounded shadow hover:bg-red-700"
        >
          ✖ Close
        </button>
      </div>

      {/* Question */}
      <h1 className="text-3xl md:text-4xl font-bold text-center max-w-4xl px-4 mb-6">{question.text}</h1>

      {/* Question Media */}
      {question.image && (
        <img
          src={question.image}
          alt="Question"
          className="max-w-full max-h-[400px] h-auto object-contain rounded shadow-lg mb-4"
        />
      )}
      {question.audio && <audio controls src={question.audio} className="w-full max-w-3xl mb-4" />}
      {question.video && <video controls src={question.video} className="w-full max-h-[300px] rounded mb-4" />}

      {/* Timer & Stats */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-3xl font-bold bg-black/50 px-4 py-2 rounded-xl shadow">
        ⏱ {timeLeft}s
      </div>
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xl font-semibold bg-black/50 px-4 py-2 rounded-xl shadow">
        🚀 32 Answers
      </div>

      {/* Render Options */}
      {renderOptions()}

      {/* Navigation */}
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
