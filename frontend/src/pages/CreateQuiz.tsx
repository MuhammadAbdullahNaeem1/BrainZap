import { useState } from 'react';
import { Option, Question } from '../types/quizTypes';
import TopBar from '../components/TopBar';
import SidebarLeft from '../components/SidebarLeft';
import SidebarRight from '../components/SidebarRight';
import ThemeSidebar from '../components/ThemeSidebar';
import QuestionEditor from '../components/QuestionEditor';

export default function CreateQuiz() {
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
  const [showSidebar, setShowSidebar] = useState(false);
  const [showThemeSidebar, setShowThemeSidebar] = useState(false);
  const defaultThemeImages = ['themes/dark-bg.jpg', 'themes/purple-bg.jpg', 'themes/green-bg.jpg', 'themes/blue-bg.jpg'];
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
    updated[selectedIndex].options[idx][key] = value;
    setQuestions(updated);
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
      <TopBar title={title} onTitleChange={setTitle} onSave={handleSubmit} onThemeClick={() => setShowThemeSidebar(true)} />
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
          handleImageUpload={handleOptionImageUpload}
          addOption={addOption}
        />

        {showThemeSidebar && (
          <ThemeSidebar
            defaultThemeImages={defaultThemeImages}
            setThemeImage={setThemeImage}
            setShowThemeSidebar={setShowThemeSidebar}
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
