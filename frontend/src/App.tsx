import { Routes, Route } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import CreateQuiz from './pages/CreateQuiz';
import TeacherDashboard from './pages/TeacherDashboard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/create-quiz" element={<CreateQuiz />} />
      <Route path="/dashboard" element={<TeacherDashboard />} />
      <Route path="/edit-quiz/:id" element={<CreateQuiz isEditMode={true} />} />

    </Routes>
  );
}

export default App;
