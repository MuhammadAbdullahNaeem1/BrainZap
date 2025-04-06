// src/components/SidebarLeft.tsx

import { Question } from '../types/quizTypes';

type Props = {
  questions: Question[];
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  addQuestion: () => void;
};

const SidebarLeft = ({
  questions,
  selectedIndex,
  setSelectedIndex,
  addQuestion,
}: Props) => {
  return (
    <aside
      className={`
        bg-gray-400 border-white/20 p-4 z-30
        fixed md:static
        w-full md:w-[15%]
        bottom-0 md:bottom-auto
        left-0
        h-28 md:min-h-screen
        flex md:flex-col
        flex-row md:border-r border-t md:border-t-0
        overflow-x-auto md:overflow-y-auto
        md:pt-24
      `}
    >
      {questions.map((_, i) => (
        <button
          key={i}
          onClick={() => setSelectedIndex(i)}
          className={`flex-shrink-0 min-w-[100px] md:w-full mx-2 md:mx-0 mb-0 md:mb-2 py-2 px-4 text-center rounded-lg ${
            selectedIndex === i
              ? 'bg-white text-indigo-700 font-bold shadow-md'
              : 'hover:bg-white/10 text-white'
          } transition duration-200`}
        >
          Question {i + 1}
        </button>
      ))}

      <button
        onClick={addQuestion}
        className="flex-shrink-0 min-w-[100px] md:w-full mx-2 md:mx-0 mt-0 md:mt-6 bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-lg shadow-md transition duration-200"
      >
        ➕ Add Question
      </button>
    </aside>
  );
};

export default SidebarLeft;
