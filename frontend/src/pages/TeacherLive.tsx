// src/pages/TeacherLive.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Question, Option, optionSymbols, symbolColors } from '../types/quizTypes';
import { MediaItem } from '../types/media';

const socket = io('http://localhost:5000/live');

export default function TeacherLive() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate  = useNavigate();
  const location = useLocation();
const pin = (location.state as { pin: string } | undefined)?.pin ?? '—';


  const [questions,     setQuestions]     = useState<Question[]>([]);
  const [themeImage,    setThemeImage]    = useState<string>('');
  const [currentIndex,  setCurrentIndex]  = useState<number>(0);
  const [timeLeft,      setTimeLeft]      = useState<number>(0);
  const [showAnswer,    setShowAnswer]    = useState<boolean>(false);
  const [answerCount,   setAnswerCount]   = useState<number>(0);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [Students, setStudents] = useState<number>(0);
  const [started,       setStarted]       = useState<boolean>(false);

  // NEW: track each submission
  const [submissions, setSubmissions] = useState<{ studentId: string; symbol: string }[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleClose = () => {
    socket.emit('end_quiz', Number(quizId), () => navigate('/dashboard'));
  };

  // Fetch quiz & questions + student count
  useEffect(() => {
    const token = sessionStorage.getItem('token');
    fetch(`http://localhost:5000/api/quiz/${quizId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        setQuestions(data.questions || []);
        setThemeImage(data.themeImage || '');
      })
      .catch(() => navigate('/dashboard'));

    socket.emit('join_quiz', Number(quizId));
    socket.emit('get_student_count', Number(quizId));

    socket.on('student_count', c => setTotalStudents(c));
    socket.on('student_joined', () => setTotalStudents(n => n + 1));
    socket.on('student_left',   () => setTotalStudents(n => Math.max(n - 1, 0)));

    return () => {
      socket.off('student_count');
      socket.off('student_joined');
      socket.off('student_left');
    };
  }, [quizId, navigate]);

  // Broadcast question & reset submissions once quiz is “started”
  useEffect(() => {
    if (!started) return;
    const q = questions[currentIndex];
    if (!q) return;

    setTimeLeft(q.timer);
    setShowAnswer(false);
    setAnswerCount(0);
    setSubmissions([]);            // ← clear past submissions

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    socket.emit('new_question', { quizId: Number(quizId), question: q });

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          socket.emit('question_ended', { quizId: Number(quizId), questionIndex: currentIndex });
          setShowAnswer(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [started, currentIndex, questions, quizId]);

  // Listen for answers AND record them
  useEffect(() => {
    const onAnswer = (data: { studentId: string; symbol: string }) => {
      setSubmissions(s => [...s, { studentId: data.studentId, symbol: data.symbol }]);
      setAnswerCount(c => c + 1);
    };
    socket.on('answer_received', onAnswer);
    return () => void socket.off('answer_received', onAnswer);
  }, [currentIndex, quizId]);

  // Auto–end question once all have answered
  useEffect(() => {
    if (started && totalStudents > 0 && answerCount >= totalStudents && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      setShowAnswer(true);
      socket.emit('question_ended', { quizId: Number(quizId), questionIndex: currentIndex });
    }
  }, [started, answerCount, totalStudents, currentIndex, quizId]);

  // Navigate back on quiz end
  useEffect(() => {
    socket.on('quiz_ended', () => navigate('/dashboard'));
    return () => void socket.off('quiz_ended');
  }, [navigate]);

  // --- BEFORE START SCREEN ---
  if (!started) {
    return (
      <div className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-800 to-purple-800 text-white">
        <h2 className="text-3xl font-bold mb-4">Game PIN: {pin}</h2>
        <p className="mb-4">Students joined: {totalStudents}</p>
        <button
          onClick={() => {
            socket.emit('quiz_started', Number(quizId));
            setStarted(true);
          }}
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold"
        >
          Start Quiz
        </button>
        <button onClick={handleClose} className="bg-[#eb3446] mt-4 text-white hover:underline">
          Cancel Live
        </button>
      </div>
    );
  }

  // --- MAIN QUIZ UI ---
  if (!questions.length) return <div>Loading questions…</div>;
  const question = questions[currentIndex];

  // build and render media (unchanged)…
  const qMedia: MediaItem[] = [];
  if (question.image) qMedia.push({ type: 'image', value: question.image });
  if (question.audio) qMedia.push({ type: 'audio', value: question.audio });
  if (question.video) qMedia.push({ type: 'video', value: question.video });
  const orderedQMedia = question.mediaOrder?.length
    ? question.mediaOrder.map(t => qMedia.find(m => m.type === t)).filter((m): m is MediaItem => !!m)
    : qMedia;
  const renderMedia = (items: MediaItem[]) =>
    items.map((item, i) => {
      switch (item.type) {
        case 'image': return <img key={i} src={item.value} className="max-w-full max-h-[250px] rounded mb-2" />;
        case 'audio': return <audio key={i} controls src={item.value} className="w-full mb-2" />;
        case 'video': return <video key={i} controls src={item.value} className="w-full max-h-[250px] rounded mb-2" />;
        default:      return null;
      }
    });

  const getOrderedOptionMedia = (opt: Option): MediaItem[] => {
    const m: MediaItem[] = [];
    if (opt.image) m.push({ type: 'image', value: opt.image });
    if (opt.audio) m.push({ type: 'audio', value: opt.audio });
    if (opt.video) m.push({ type: 'video', value: opt.video });
    return opt.mediaOrder?.length
      ? opt.mediaOrder.map(t => m.find(x => x.type === t)).filter((x): x is MediaItem => !!x)
      : m;
  };

  const renderOptions = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full px-4 mt-6">
      {question.options.map((opt, idx) => {
        const isCorrect = opt.isCorrect;
        const media = getOrderedOptionMedia(opt);
        return (
          <div
            key={idx}
            className={`rounded-xl p-6 text-center font-semibold text-lg transition shadow-lg ${
              showAnswer ? (isCorrect ? 'bg-green-600' : 'bg-gray-500') : symbolColors[idx]
            }`}
          >
            {media.length ? renderMedia(media) : <span className="text-lg font-bold text-white">{opt.text}</span>}
          </div>
        );
      })}
    </div>
  );

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-start pt-24 text-white overflow-y-auto"
      style={{ backgroundImage: `url(${themeImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* Close */}
      <button onClick={handleClose} className="absolute top-20 right-4 bg-red-600 px-4 py-2 rounded shadow hover:bg-red-700">
        ✖ Close
      </button>

      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 flex justify-between items-center bg-black/80 px-6 py-2 z-50">
        <div className="text-4xl font-bold">⏱ {timeLeft}s</div>
        <div className="text-3xl font-semibold">🚀 {answerCount} / {totalStudents}</div>
      </div>
      <div className="h-16" />

      {/* Question */}
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-6">{question.text}</h1>

      {/* Media */}
      {orderedQMedia.length > 0 && renderMedia(orderedQMedia)}

      {/* Options */}
      {renderOptions()}

      {/* --- NEW: Responses panel --- */}
      {showAnswer && submissions.length > 0 && (
        <div className="mt-8 bg-white/80 text-black p-4 rounded-lg shadow-lg max-w-md w-full">
          <h3 className="text-xl font-bold mb-2">Responses</h3>
          <ul className="list-disc list-inside">
            {submissions.map((s, i) => (
              <li key={i}>
                <strong>{s.studentId}</strong>: {s.symbol}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-center gap-4 mt-12 mb-8">
        <button
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex(i => i - 1)}
          className="bg-white text-black font-bold px-6 py-2 rounded-lg shadow disabled:opacity-30"
        >
          ⬅ Previous
        </button>
        <button
          disabled={currentIndex === questions.length - 1}
          onClick={() => setCurrentIndex(i => i + 1)}
          className="bg-white text-black font-bold px-6 py-2 rounded-lg shadow disabled:opacity-30"
        >
          Next ➡
        </button>
      </div>
    </div>
  );
}
