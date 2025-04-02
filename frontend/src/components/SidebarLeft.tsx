
type Props = {
  questions: any[];
  selectedIndex: number;
  setSelectedIndex: (i: number) => void;
  addQuestion: () => void;
};

const SidebarLeft = ({ questions, selectedIndex, setSelectedIndex, addQuestion }: Props) => (
  <aside className="pt-24 w-48 sm:w-52 md:w-56 lg:w-60 xl:w-64 bg-white/10 p-4 border-r border-white/20 overflow-y-auto hidden md:block">

    {questions.map((_, i) => (
      <button
        key={i}
        onClick={() => setSelectedIndex(i)}
        className={`w-full mb-2 py-2 px-4 text-left rounded-lg text-sm sm:text-base md:text-lg ${
          selectedIndex === i
            ? 'bg-white text-indigo-700 font-bold shadow-md'
            : 'hover:bg-white/10'
        } transition duration-200`}
      >
        <span className="truncate">Question {i + 1}</span>
      </button>
    ))}

    <button onClick={addQuestion} className="mt-6 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-lg shadow-md transition duration-200">➕ Add Question</button>
  </aside>
);

export default SidebarLeft;
