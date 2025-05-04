// src/CreateQuiz.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Option, Question } from '../types/quizTypes';
import TopBar from '../components/TopBar';
import SidebarLeft from '../components/SidebarLeft';
import SidebarRight from '../components/SidebarRight';
import ThemeSidebar from '../components/ThemeSidebar';
import QuestionEditor from './QuestionEditor';
import QuizPreview from '../components/QuizPreview';

interface LocationState {
  folderId?: number;
}

export default function CreateQuiz({ isEditMode = false }: { isEditMode?: boolean }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { folderId = 0 } = (location.state as LocationState) || {};

  // Quiz state
  const [questions, setQuestions] = useState<Question[]>([
    {
      text: '',
      type: 'MCQ',
      timer: 30,
      points: 10,
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ],
    },
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [title, setTitle] = useState('Untitled Quiz');
  const [themeImage, setThemeImage] = useState('themes/dark-bg.jpg');

  // UI state
  const [showSidebar, setShowSidebar] = useState(false);
  const [showThemeSidebar, setShowThemeSidebar] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  // If editing, fetch existing quiz
  useEffect(() => {
    if (isEditMode && id) {
      fetch(`http://localhost:5000/api/quiz/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
        .then(r => r.json())
        .then(data => {
          if (data.quizId) {
            setTitle(data.title);
            setThemeImage(data.themeImage);
            setQuestions(data.questions);
            setSelectedIndex(0);
          } else {
            alert(data.message || 'Failed to load quiz');
          }
        })
        .catch(console.error);
    }
  }, [isEditMode, id]);

  const selectedQuestion = questions[selectedIndex];

  // Handlers
  const handleQuestionChange = (field: keyof Question, value: any) => {
    setQuestions(qs => {
      const copy = [...qs];
      (copy[selectedIndex] as any)[field] = value;
      return copy;
    });
  };

  const handleOptionChange = <K extends keyof Option>(idx: number, key: K, value: Option[K]) => {
    setQuestions(qs => {
      const copy = [...qs];
      if (key === 'isCorrect' && value === true && copy[selectedIndex].type === 'MCQ') {
        copy[selectedIndex].options = copy[selectedIndex].options.map((opt, i) => ({
          ...opt,
          isCorrect: i === idx,
        }));
      } else {
        copy[selectedIndex].options[idx][key] = value as any;
      }
      return copy;
    });
  };

  // Media upload (no compression here; handled in QuestionEditor)
  const handleQuestionMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const data = reader.result as string;
        if (file.type.startsWith('image/')) handleQuestionChange('image', data);
        else if (file.type.startsWith('audio/')) handleQuestionChange('audio', data);
        else if (file.type.startsWith('video/')) handleQuestionChange('video', data);
      };
      reader.readAsDataURL(file);
    });
    e.currentTarget.value = '';
  };

  const handleOptionMediaUpload = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const data = reader.result as string;
        if (file.type.startsWith('image/')) {
          handleOptionChange(idx, 'image', data);
          handleOptionChange(idx, 'text', '');
        } else if (file.type.startsWith('audio/')) {
          handleOptionChange(idx, 'audio', data);
        } else if (file.type.startsWith('video/')) {
          handleOptionChange(idx, 'video', data);
        }
      };
      reader.readAsDataURL(file);
    });
    e.currentTarget.value = '';
  };

  const addOption = () => {
    setQuestions(qs => {
      const copy = [...qs];
      copy[selectedIndex].options.push({ text: '', isCorrect: false });
      return copy;
    });
  };

  const addQuestion = () => {
    setQuestions(qs => [
      ...qs,
      {
        text: '',
        type: 'MCQ',
        timer: 30,
        points: 10,
        options: [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
        ],
      },
    ]);
    setSelectedIndex(questions.length);
  };

  const handleSubmit = async () => {
    const payload: any = {
      title,
      type: 'Live',
      themeImage,
      questions,
      ...(isEditMode ? {} : { folderId }),
    };
    const url = isEditMode
      ? `http://localhost:5000/api/quiz/${id}`
      : 'http://localhost:5000/api/quiz/create';
    const method = isEditMode ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    alert(data.message || (isEditMode ? 'Quiz updated!' : 'Quiz created!'));
    if (res.ok) navigate('/dashboard');
  };

  return (
    <div className="relative flex min-h-screen w-screen text-white">
      <TopBar
        title={title}
        onTitleChange={setTitle}
        onSave={handleSubmit}
        onThemeClick={() => setShowThemeSidebar(true)}
        onPreviewClick={() => setShowPreview(true)}
      />

      <SidebarLeft
        questions={questions}
        selectedIndex={selectedIndex}
        setSelectedIndex={setSelectedIndex}
        addQuestion={addQuestion}
      />

      <main
        className="pt-24 flex-1 min-h-screen overflow-y-auto"
        style={{
          backgroundImage: `url(${themeImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <QuestionEditor
          selectedQuestion={selectedQuestion}
          handleQuestionChange={handleQuestionChange}
          handleOptionChange={handleOptionChange}
          addOption={addOption}
       
        />

        {showThemeSidebar && (
          <ThemeSidebar
            defaultThemeImages={[]}
            setThemeImage={setThemeImage}
            setShowThemeSidebar={setShowThemeSidebar}
          />
        )}

        {showPreview && (
          <QuizPreview
            questions={questions}
            currentIndex={previewIndex}
            setCurrentIndex={setPreviewIndex}
            themeImage={themeImage}
            onClose={() => setShowPreview(false)}
          />
        )}
      </main>

      <SidebarRight
        showSidebar={showSidebar}
        selectedQuestion={selectedQuestion}
        handleQuestionChange={handleQuestionChange}
      />

      <button
        type="button"
        onClick={() => setShowSidebar(prev => !prev)}
        className="fixed right-0 top-1/2 transform -translate-y-1/2 z-50 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-l-lg shadow-md"
      >
        {showSidebar ? '➤' : '◀'}
      </button>
    </div>
  );
}
