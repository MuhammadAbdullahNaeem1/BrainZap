import { Routes, Route } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import CreateQuiz from './pages/CreateQuiz';


function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/create-quiz" element={<CreateQuiz />} />

    </Routes>
  );
}

export default App;
