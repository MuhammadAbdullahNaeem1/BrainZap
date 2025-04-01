import React from 'react';
import { Option, Question, optionSymbols, symbolColors } from '../types/quizTypes';

type Props = {
  selectedQuestion: Question;
  handleQuestionChange: (key: keyof Question, value: any) => void;
  handleOptionChange: <K extends keyof Option>(idx: number, key: K, value: Option[K]) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  addOption: () => void;
};

const QuestionEditor = ({
  selectedQuestion,
  handleQuestionChange,
  handleOptionChange,
  handleImageUpload,
  addOption,
}: Props) => {
  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <input
        type="text"
        placeholder="Start typing your question"
        value={selectedQuestion.text}
        onChange={(e) => handleQuestionChange('text', e.target.value)}
        className="w-full mb-6 px-4 py-3 border text-lg border-gray-300 rounded-lg focus:outline-indigo-400 bg-white shadow"
      />

      {/* Image Upload */}
      {selectedQuestion.image ? (
        <div className="relative mb-6 w-full flex items-center justify-center bg-white rounded-lg p-4 shadow">
          <img
            src={selectedQuestion.image}
            alt="Uploaded"
            className="max-h-60 max-w-full object-contain rounded"
          />
          <button
            onClick={() => handleQuestionChange('image', undefined)}
            className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white px-2 py-1 text-xs rounded shadow"
          >
            ✖ Remove
          </button>
        </div>
      ) : (
        <div className="mb-6 w-full flex items-center justify-center">
          <div className="w-full max-w-xl bg-gray-100 border-dashed border-2 border-gray-300 rounded-lg p-8 text-center flex flex-col items-center justify-center min-h-[160px]">
            <button
              onClick={() => document.getElementById('imageUpload')?.click()}
              className="w-12 h-12 mb-2 flex items-center justify-center bg-white text-black text-3xl font-bold shadow-md hover:scale-105 transition rounded"
            >
              +
            </button>
            <p className="text-gray-600 font-semibold">Find and insert media</p>
            <p className="text-sm text-blue-600 underline mt-1 cursor-pointer hover:text-blue-800">
              <label htmlFor="imageUpload" className="cursor-pointer">Choose file</label>
            </p>
            <input
              id="imageUpload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* Answer Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {selectedQuestion.options.map((opt, idx) => {
          const filled = opt.text.trim().length > 0;
          return (
            <div
              key={idx}
              className={`relative rounded-lg flex items-center p-4 pl-14 ${
                filled
                  ? symbolColors[idx % symbolColors.length]
                  : 'bg-white border text-gray-500'
              } shadow`}
            >
              <div
                className={`absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center font-bold text-lg rounded ${
                  symbolColors[idx % symbolColors.length]
                }`}
              >
                {optionSymbols[idx % optionSymbols.length]}
              </div>
              <input
                type="text"
                placeholder={`Add answer ${idx + 1}${idx >= 2 ? ' (optional)' : ''}`}
                value={opt.text}
                onChange={(e) => handleOptionChange(idx, 'text', e.target.value)}
                className="flex-1 bg-transparent outline-none placeholder-gray-200"
              />
              <label className="ml-4 text-sm flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={opt.isCorrect}
                  onChange={(e) =>
                    handleOptionChange(idx, 'isCorrect', e.target.checked)
                  }
                />
                Correct
              </label>
            </div>
          );
        })}
      </div>

      {/* Add Option */}
      {selectedQuestion.options.length < 6 && (
        <div className="text-center">
          <button
            onClick={addOption}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white font-semibold rounded hover:bg-indigo-700 transition shadow"
          >
            ➕ Add more answers
          </button>
        </div>
      )}
    </div>
  );
};

export default QuestionEditor;
