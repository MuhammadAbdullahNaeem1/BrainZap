// src/pages/student/StudentLive.tsx
import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { optionSymbols, symbolColors } from '../types/quizTypes';

type Option = {
  isCorrect: boolean;
  text?: string;
  image?: string;
  audio?: string;
  video?: string;
};

type Question = {
  timer: number;
  options: Option[];
};

export default function StudentLive() {
  const { quizId } = useParams<{ quizId: string }>();
  
  const navigate    = useNavigate();
  const location = useLocation();
  console.log('💡 StudentLive location.state =', location.state);
  // assert that location.state is our shape
  const { pin } = (location.state as { pin?: string } | undefined) ?? {};
  const studentId   = sessionStorage.getItem('studentId')!;
  const studentName = sessionStorage.getItem('studentName')!;

  const socketRef = useRef<Socket | null>(null);
  const timerRef  = useRef<number | null>(null);

  const [started,    setStarted]    = useState(false);
  const [question,   setQuestion]   = useState<Question | null>(null);
  const [timeLeft,   setTimeLeft]   = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [answered,   setAnswered]   = useState(false);
  const [quizEnded,  setQuizEnded]  = useState(false);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleNewQuestion = (q: Question) => {
    setQuestion(q);
    setTimeLeft(q.timer);
    setShowAnswer(false);
    setAnswered(false);
  };

  const handleQuestionEnded = () => {
    setShowAnswer(true);
    setTimeLeft(0);
    clearTimer();
  };

  const handleQuizEnded = () => {
    setQuizEnded(true);
  };

  useEffect(() => {
    // must have come via Dashboard with a PIN
    if (!pin) {
      alert('No PIN provided – redirecting back.');
      navigate('/student/dashboard');
      return;
    }

    const socket = io('http://localhost:5000/live');
    socketRef.current = socket;

    // register via PIN (joins the room and populates activeStudents)
    socket.emit('join_by_pin', { pin, studentId, studentName });

    socket.on('pin_invalid', () => {
      alert('Invalid PIN. Please go back and try again.');
      navigate('/student/dashboard');
    });

    socket.on('pin_valid', (_quizId: number) => {
      console.log('PIN accepted, waiting for teacher to start…');
    });

    socket.on('quiz_started',   () => setStarted(true));
    socket.on('new_question',   handleNewQuestion);
    socket.on('question_ended', handleQuestionEnded);
    socket.on('quiz_ended',     handleQuizEnded);

    return () => {
      socket.off('pin_invalid');
      socket.off('pin_valid');
      socket.off('quiz_started');
      socket.off('new_question',   handleNewQuestion);
      socket.off('question_ended', handleQuestionEnded);
      socket.off('quiz_ended',     handleQuizEnded);
      clearTimer();
      socket.disconnect();
    };
  }, [pin, studentId, studentName]);

  useEffect(() => {
    if (question && !showAnswer && !answered && timeLeft > 0) {
      clearTimer();
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearTimer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearTimer();
  }, [question, showAnswer, answered, timeLeft]);

  useEffect(() => {
    if (quizEnded) {
      alert('Quiz has ended.');
      navigate('/student/dashboard');
    }
  }, [quizEnded, navigate]);

  const submitAnswer = (idx: number) => {
    if (!question || showAnswer || answered) return;
    socketRef.current!.emit('submit_answer', {
      quizId:     Number(quizId),
      studentId,
      studentName,
      symbol:     optionSymbols[idx],
    });
    setAnswered(true);
    clearTimer();
  };

  if (!started) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900 text-white p-4">
        <h2 className="text-2xl">Waiting for the teacher to start the quiz…</h2>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900 text-white p-4">
        <h2 className="text-2xl">Preparing question…</h2>
      </div>
    );
  }

  const count = question.options.length;

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-900 p-4">
      <button
        onClick={() => {
          socketRef.current!.emit('end_quiz', Number(quizId));
          navigate('/student/dashboard');
        }}
        className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
      >
        ✖ Exit
      </button>

      <div className="mb-6 text-white text-4xl font-bold">⏱ {timeLeft}s</div>
      <div className="grid grid-cols-2 gap-8 w-full max-w-md">
        {optionSymbols.slice(0, count).map((sym, idx) => {
          const baseClass = `aspect-square flex items-center justify-center text-8xl font-bold rounded-lg ${symbolColors[idx]}`;
          const isCorrect = question.options[idx].isCorrect;
          const finalClass = showAnswer
            ? baseClass + (isCorrect
                ? ' ring-4 ring-white'
                : ' opacity-50 cursor-not-allowed')
            : baseClass + (answered
                ? ' opacity-60 cursor-not-allowed'
                : ' hover:scale-105 transform transition');

          return (
            <button
              key={idx}
              onClick={() => submitAnswer(idx)}
              disabled={showAnswer || answered}
              className={finalClass}
            >
              {sym}
            </button>
          );
        })}
      </div>

      {answered && !showAnswer && (
        <p className="mt-6 text-white text-xl">Waiting for all students…</p>
      )}
    </div>
  );
}
