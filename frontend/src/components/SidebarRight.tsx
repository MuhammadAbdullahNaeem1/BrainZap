import React from 'react';
import { Question } from '../types/quizTypes';

type Props = {
  showSidebar: boolean;
  selectedQuestion: Question;
  handleQuestionChange: (key: keyof Question, value: any) => void;
};

const SidebarRight = ({ showSidebar, selectedQuestion, handleQuestionChange }: Props) => {
  if (!showSidebar) return null;

  return (
    <aside className="pt-24 fixed top-0 right-0 h-full w-80 bg-white border-l shadow-lg p-6 overflow-y-auto z-40 transition-transform">
      <h3 className="text-lg font-bold mb-4">🛠 Question Settings</h3>

      <label className="block mb-4">
        <span className="text-sm font-semibold text-gray-700">Question type</span>
        <select
          value={selectedQuestion.type}
          onChange={(e) => handleQuestionChange('type', e.target.value)}
          className="mt-1 block w-full p-2 border rounded bg-white text-gray-800"
        >
          <option value="MCQ">Quiz</option>
          <option value="TrueFalse">True / False</option>
          <option value="TypeAnswer">Type Answer</option>
          <option value="Multiselect">Poll</option>
        </select>
      </label>

      <label className="block mb-4">
        <span className="text-sm font-semibold text-gray-700">Time limit</span>
        <select
          value={selectedQuestion.timer}
          onChange={(e) => handleQuestionChange('timer', parseInt(e.target.value))}
          className="mt-1 block w-full p-2 border rounded bg-white text-gray-800"
        >
          {[5, 10, 20, 30, 60, 90, 120].map((t) => (
            <option key={t} value={t}>{t} seconds</option>
          ))}
        </select>
      </label>

      <label className="block mb-4">
        <span className="text-sm font-semibold text-gray-700">Points</span>
        <select
          value={selectedQuestion.points || 0}
          onChange={(e) => handleQuestionChange('points', parseInt(e.target.value))}
          className="mt-1 block w-full p-2 border rounded bg-white text-gray-800"
        >
          <option value={0}>0 (No points)</option>
          <option value={500}>500</option>
          <option value={1000}>1000</option>
          <option value={2000}>2000</option>
        </select>
      </label>
    </aside>
  );
};

export default SidebarRight;
