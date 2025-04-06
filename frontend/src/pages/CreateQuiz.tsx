import { useState, useEffect } from 'react';
import { Option, Question } from '../types/quizTypes';
import TopBar from '../components/TopBar';
import SidebarLeft from '../components/SidebarLeft';
import SidebarRight from '../components/SidebarRight';
import ThemeSidebar from '../components/ThemeSidebar';
import QuestionEditor from '../components/QuestionEditor';
import QuizPreview from '../components/QuizPreview';
import { useParams } from 'react-router-dom';

export default function CreateQuiz({ isEditMode = false }: { isEditMode?: boolean }) {
  const { id } = useParams(); // <-- Get quiz ID if editing
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
  useEffect(() => {
    if (isEditMode && id) {
      const fetchQuiz = async () => {
        try {
          const res = await fetch(`http://localhost:5000/api/quiz/${id}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
            },
          });
          const data = await res.json();
          if (res.ok) {
            setTitle(data.title);
            setThemeImage(data.themeImage);
            setQuestions(data.questions); // Make sure backend returns questions in correct format
          } else {
            alert(data.message || 'Failed to load quiz');
          }
        } catch (err) {
          console.error('Error loading quiz:', err);
        }
      };

      fetchQuiz();
    }
  }, [isEditMode, id]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [title, setTitle] = useState('Untitled Quiz');
  const [themeImage, setThemeImage] = useState('themes/dark-bg.jpg');
  const [showSidebar, setShowSidebar] = useState(false);
  const [showThemeSidebar, setShowThemeSidebar] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  const defaultThemeImages = ['C:/Users/Hammad/Desktop/1.jpg', 'themes/purple-bg.jpg', 'themes/green-bg.jpg', 'themes/blue-bg.jpg'];
  const selectedQuestion = questions[selectedIndex];

  const handleQuestionChange = (key: keyof Question, value: any) => {
    const updated = [...questions];
    (updated[selectedIndex] as any)[key] = value;
    setQuestions(updated);
  };

  const handleOptionChange = <K extends keyof Option>(
    idx: number,
    key: K,
    value: Option[K]
  ) => {
    const updated = [...questions];
  
    // If switching to isCorrect and question is MCQ, ensure only one correct
    if (key === 'isCorrect' && value === true && questions[selectedIndex].type === 'MCQ') {
      updated[selectedIndex].options = updated[selectedIndex].options.map((opt, i) => ({
        ...opt,
        isCorrect: i === idx,
      }));
    } else {
      updated[selectedIndex].options[idx][key] = value;
    }
  
    setQuestions(updated);
  };
  const handleQuestionImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    const reader = new FileReader();
    reader.onloadend = () => {
      const updated = [...questions];
      updated[selectedIndex].image = reader.result as string;
      setQuestions(updated);
    };
    reader.readAsDataURL(file);
  };
  
  const handleOptionImageUpload = (e: React.ChangeEvent<HTMLInputElement>, idx?: number) => {
    const file = e.target.files?.[0];
    if (!file || idx === undefined) return;
  
    const reader = new FileReader();
    reader.onloadend = () => {
      handleOptionChange(idx, 'image', reader.result as string);
      handleOptionChange(idx, 'text', ''); // Clear text if image is added
    };
    reader.readAsDataURL(file);
  };
  
  
  const addOption = () => {
    const updated = [...questions];
    updated[selectedIndex].options.push({ text: '', isCorrect: false });
    setQuestions(updated);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
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
    const quizData = {
      title,
      description: 'Created in Kahoot clone',
      type: 'Live',
      themeImage,
      questions,
    };

    const res = await fetch('http://localhost:5000/api/quiz/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
      body: JSON.stringify(quizData),
    });

    const data = await res.json();
    alert(data.message || 'Quiz submitted!');
  };

  return (
    <div className="relative flex min-h-screen w-screen text-white">
      <TopBar title={title} onTitleChange={setTitle} onSave={handleSubmit} onThemeClick={() => setShowThemeSidebar(true)}  onPreviewClick={() => setShowPreview(true)} />
      <SidebarLeft questions={questions} selectedIndex={selectedIndex} setSelectedIndex={setSelectedIndex} addQuestion={addQuestion} />
      <main
        className="pt-24 flex-1 min-h-screen overflow-y-auto text-white transition-all relative"
        style={{
          backgroundImage: themeImage ? `url(${themeImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <QuestionEditor
          selectedQuestion={selectedQuestion}
          handleQuestionChange={handleQuestionChange}
          handleOptionChange={handleOptionChange}
          handleImageUpload={handleQuestionImageUpload}
          handleOptionImageUpload={handleOptionImageUpload}
          addOption={addOption}
        />

        {showThemeSidebar && (
          <ThemeSidebar
            defaultThemeImages={defaultThemeImages}
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
        onClick={() => setShowSidebar((prev) => !prev)}
        className="fixed right-0 top-1/2 transform -translate-y-1/2 z-50 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-l-lg shadow-md"
      >
        {showSidebar ? '➤' : '◀'}
      </button>
    </div>
  );
}
