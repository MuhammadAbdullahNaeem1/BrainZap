// src/pages/student/StudentDashboard.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import StudentSidebar from '../../components/StudentSidebar';

// Single shared socket connection for live namespace
const socket: Socket = io('http://localhost:5000/live');
const studentId   = sessionStorage.getItem('studentId')!;
const studentName = sessionStorage.getItem('studentName')!;
interface Quiz {
  quizId: number;
  title: string;
  description?: string;
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem('token') || '';
    axios
      .get('/api/quiz/quizzes', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setQuizzes(res.data.quizzes || []))
      .catch(err => {
        console.error('Error fetching quizzes:', err);
        setError('Failed to fetch quizzes');
      })
      .finally(() => setLoading(false));

    // Listen for PIN validation responses
    socket.on('pin_valid', (quizId: number) => {
      console.log('💡 navigating to live with PIN=', pin);
      navigate(`/student/live/${quizId}`,{ state: { pin } } );
    });
    socket.on('pin_invalid', () => {
      setPinError('Invalid PIN. Please try again.');
    });

    return () => {
      socket.off('pin_valid');
      socket.off('pin_invalid');
    };
  }, [navigate, pin]);

  const handleJoinByPin = () => {
    if (!pin.trim()) {
      setPinError('Please enter a PIN');
      return;
    }
    setPinError(null);
    socket.emit('join_by_pin', {pin, studentId, studentName });
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-900 text-white">
        <span className="text-xl">Loading quizzes…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-900 text-red-400">
        <span className="text-xl">{error}</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 bg-gray-800 p-6 text-white">
        <StudentSidebar />
      </aside>

      {/* Mobile Sidebar Toggle */}
      <button
        className="md:hidden absolute top-4 left-4 z-50 bg-gray-800 text-white p-2 rounded"
        onClick={() => navigate('/student/sidebar-toggle')}
      >
        ☰
      </button>

      {/* Main Content */}
      <main className="flex-1 p-6 bg-gray-900 text-white overflow-y-auto">
        {/* Join Live by PIN */}
        <section className="mb-12 max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">🔑 Join Live Quiz</h2>
          <div className="flex gap-2">
            <input
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="Enter PIN"
              className="flex-1 p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleJoinByPin}
              className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Join
            </button>
          </div>
          {pinError && <p className="text-red-500 mt-2">{pinError}</p>}
        </section>

        {/* Available Quizzes */}
        <section>
          <h1 className="text-3xl font-bold mb-6">Available Quizzes</h1>
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search quizzes…"
              className="p-3 w-full bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.length > 0 ? (
              quizzes.map(q => (
                <div
                  key={q.quizId}
                  className="bg-gray-800 rounded-lg shadow-lg p-6 hover:bg-gray-700 transition flex flex-col justify-between"
                >
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{q.title}</h3>
                    {q.description && <p className="text-gray-400 mb-4">{q.description}</p>}
                  </div>
                  <button
                    onClick={() => navigate(`/student/quiz/${q.quizId}`)}
                    className="mt-auto inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Join Quiz
                  </button>
                </div>
              ))
            ) : (
              <div className="text-gray-400">No quizzes available.</div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
