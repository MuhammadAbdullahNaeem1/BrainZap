// src/pages/TeacherDashboard.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type Quiz = {
  id: number;
  title: string;
  createdAt: string;
  questionsCount: number;
};

const TeacherDashboard = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/quiz/my-quizzes', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          },
        });
        const data = await res.json();
        if (res.ok) {
          setQuizzes(data.quizzes || []);
        }
      } catch (err) {
        console.error('Error fetching quizzes:', err);
      }
    };

    fetchQuizzes();
  }, []);

  return (
    <div className="w-screen min-h-screen overflow-x-hidden bg-gradient-to-br from-indigo-800 to-purple-800 text-white px-4 md:px-10 py-10">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center md:text-left">📚 My Quizzes</h1>

      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {quizzes.map((quiz) => (
          <div
            key={quiz.id}
            className="relative bg-white text-black p-6 rounded-xl shadow-lg hover:shadow-2xl transition"
          >
            <button
              onClick={() => navigate(`/edit-quiz/${quiz.id}`)}
              className="text-left w-full"
            >
              <h2 className="text-xl font-semibold mb-2">{quiz.title}</h2>
              <p className="text-sm text-gray-600">📝 {quiz.questionsCount} questions</p>
              <p className="text-sm text-gray-500">📅 {new Date(quiz.createdAt).toLocaleDateString()}</p>
            </button>

            <button
              onClick={async () => {
                if (!confirm('Are you sure you want to delete this quiz?')) return;

                const res = await fetch(`http://localhost:5000/api/quiz/${quiz.id}`, {
                  method: 'DELETE',
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
                  },
                });

                const data = await res.json();
                if (res.ok) {
                  alert('Quiz deleted!');
                  setQuizzes((prev) => prev.filter((q) => q.id !== quiz.id));
                } else {
                  alert(data.message || 'Failed to delete quiz');
                }
              }}
              className="absolute top-2 right-2 text-sm text-red-600 hover:text-red-800 font-semibold"
            >
              ✖
            </button>
          </div>
        ))}

        {/* ➕ Create New Quiz */}
        <div
          onClick={() => navigate('/create-quiz')}
          className="flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white p-6 rounded-xl shadow-lg cursor-pointer transition min-h-[150px]"
        >
          <span className="text-2xl font-bold">➕ Create New Quiz</span>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
