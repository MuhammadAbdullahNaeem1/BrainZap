// src/pages/TeacherDashboard.tsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type Quiz = {
  quizId: number;
  title: string;
  createdAt: string;
  questionsCount: number;
  folderId: number;
};

type Folder = {
  folderId: number;
  name: string;
};

const TeacherDashboard = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [folders, setFolders] = useState<Folder[]>([{ folderId: 0, name: 'All Quizzes' }]);
  const [activeFolder, setActiveFolder] = useState<number>(0);
  const [newFolder, setNewFolder] = useState<string>('');
  const navigate = useNavigate();

  // Load folders and quizzes from server
  useEffect(() => {
    const authHeader = { Authorization: `Bearer ${localStorage.getItem('token') || ''}` };

    const load = async () => {
      try {
        const [fRes, qRes] = await Promise.all([
          fetch('http://localhost:5000/api/folders', { headers: authHeader }),
          fetch('http://localhost:5000/api/quiz/my-quizzes', { headers: authHeader }),
        ]);
        if (!fRes.ok || !qRes.ok) {
          console.error('Failed to load data');
          return;
        }
        const { folders: serverFolders } = await fRes.json();
        const { quizzes: serverQuizzes } = await qRes.json();

        setFolders([{ folderId: 0, name: 'All Quizzes' }, ...serverFolders]);
        setQuizzes(serverQuizzes);
      } catch (err) {
        console.error('Error loading dashboard:', err);
      }
    };

    load();
  }, []);

  // Create a new folder on the backend
  const addFolder = async () => {
    const name = newFolder.trim();
    if (!name) return;
    try {
      const res = await fetch('http://localhost:5000/api/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        console.error('Failed to create folder');
        return;
      }
      const { folderId } = await res.json();
      setFolders((f) => [...f, { folderId, name }]);
      setActiveFolder(folderId);
      setNewFolder('');
    } catch (err) {
      console.error('Error creating folder:', err);
    }
  };

  // Assign quiz to folder on the backend
  const moveQuiz = async (quizId: number, folderId: number) => {
    try {
      await fetch(`http://localhost:5000/api/quiz/${quizId}/folder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ folderId }),
      });
      setQuizzes((qs) =>
        qs.map((q) => (q.quizId === quizId ? { ...q, folderId } : q))
      );
    } catch (err) {
      console.error('Error moving quiz:', err);
    }
  };

  // Filter quizzes by activeFolder
  const displayed = quizzes.filter((q) => activeFolder === 0 || q.folderId === activeFolder);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-800 to-purple-800">
      {/* Sidebar */}
      <aside className="w-64 bg-white/10 text-white p-6">
        <h2 className="text-xl font-semibold mb-4">Folders</h2>
        <ul className="space-y-2">
          {folders.map((f) => (
            <li
              key={f.folderId}
              onClick={() => setActiveFolder(f.folderId)}
              className={`cursor-pointer px-2 py-1 rounded ${
                activeFolder === f.folderId ? 'bg-white/30 font-bold' : 'hover:bg-white/20'
              }`}
            >
              {f.name}
            </li>
          ))}
        </ul>
        <div className="mt-6">
          <input
            type="text"
            value={newFolder}
            onChange={(e) => setNewFolder(e.target.value)}
            placeholder="New folder"
            className="w-full px-2 py-1 rounded bg-white text-black"
          />
          <button
            onClick={addFolder}
            className="mt-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-1 rounded"
          >
            Add Folder
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10">
        <h1 className="text-3xl font-bold text-white mb-6">📚 My Quizzes</h1>
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayed.map((quiz) => (
            <div
              key={quiz.quizId}
              className="relative bg-indigo-500 text-gray-900 p-6 rounded-xl shadow-lg hover:shadow-2xl transition"
            >
              {/* Folder selector */}
              <select
                value={quiz.folderId}
                onChange={(e) => moveQuiz(quiz.quizId, Number(e.target.value))}
                className="absolute top-2 left-2 bg-white border px-2 py-1 rounded text-sm text-black"
              >
                {folders.map((f) => (
                  <option key={f.folderId} value={f.folderId}>
                    {f.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => navigate(`/edit-quiz/${quiz.quizId}`)}
                className="w-full text-left bg-indigo-500"
              >
                <h2 className="text-xl font-semibold mb-2">{quiz.title}</h2>
                <p className="text-sm text-gray-200">
                  📝 {quiz.questionsCount} questions
                </p>
                <p className="text-sm text-gray-200">
                  📅 {new Date(quiz.createdAt).toLocaleDateString()}
                </p>
              </button>

              <button
                onClick={async () => {
                  if (!confirm('Are you sure you want to delete this quiz?')) return;
                  await fetch(`http://localhost:5000/api/quiz/${quiz.quizId}`, {
                    method: 'DELETE',
                    headers: {
                      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
                    },
                  });
                  setQuizzes((prev) => prev.filter((q) => q.quizId !== quiz.quizId));
                }}
                className="absolute top-2 right-2 text-xs text-red-600 hover:text-red-800 font-semibold"
              >
                ✖
              </button>
            </div>
          ))}

          {/* Create New Quiz Card */}
          {activeFolder !== undefined && (
            <div
              onClick={() => navigate('/create-quiz', { state: { folderId: activeFolder } })}
              className="flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white p-6 rounded-xl shadow-lg cursor-pointer transition min-h-[150px]"
            >
              <span className="text-2xl font-bold">➕ Create New Quiz</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;
