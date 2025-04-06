import React from 'react';
import { Option, Question, optionSymbols, symbolColors } from '../types/quizTypes';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage } from '@fortawesome/free-solid-svg-icons';

type Props = {
  selectedQuestion: Question;
  handleQuestionChange: (key: keyof Question, value: any) => void;
  handleOptionChange: <K extends keyof Option>(idx: number, key: K, value: Option[K]) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;  // 👈 for question image
  handleOptionImageUpload: (e: React.ChangeEvent<HTMLInputElement>, idx: number) => void; // 👈 for option image
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
    <div className="p-6 md:p-10">

      {/* 📝 Question Text */}
      <input
        type="text"
        placeholder="Start typing your question"
        value={selectedQuestion.text}
        onChange={(e) => handleQuestionChange('text', e.target.value)}
        className="w-full mb-6 px-4 py-3 border text-black border-gray-300 rounded-lg focus:outline-indigo-400 bg-white shadow"
      />

      {/* 🖼️ Image Upload for Question */}
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
              onClick={() => document.getElementById('questionImageUpload')?.click()}
              className="w-12 h-12 mb-2 flex items-center justify-center bg-white text-black text-3xl font-bold shadow-md hover:scale-105 transition rounded"
            >
              +
            </button>
            <p className="text-gray-600 font-semibold">Find and insert media</p>
            <p className="text-sm text-blue-600 underline mt-1 cursor-pointer hover:text-blue-800">
              <label htmlFor="questionImageUpload" className="cursor-pointer">
                Choose file
              </label>
            </p>
            <input
              id="questionImageUpload"
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e)}
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* 🧩 Answer Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {selectedQuestion.options.map((opt, idx) => {
          const filled = opt.text.trim() !== '' || Boolean(opt.image);
          const symbolBoxColor = symbolColors[idx % symbolColors.length];

          return (
            <div
              key={idx}
              className={`relative group rounded-lg flex items-stretch p-0 ${
                filled ? symbolBoxColor : 'bg-white border text-gray-500'
              } shadow min-h-[140px]`}
            >
              {/* Symbol Box */}
              <div
                className={`w-14 flex items-center justify-center font-extrabold text-2xl rounded-l ${symbolBoxColor}`}
              >
                {optionSymbols[idx % optionSymbols.length]}
              </div>

              {/* Image or Text */}
              <div className="flex-1 flex items-center justify-center relative p-4">
                {opt.image ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img
                      src={opt.image}
                      alt={`Option ${idx + 1}`}
                      className="max-h-16 object-contain mx-auto"
                    />
                    <button
                      onClick={() => handleOptionChange(idx, 'image', undefined)}
                      className="absolute top-1 right-2 text-xs text-white bg-red-500 px-2 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition"
                    >
                      ✖
                    </button>
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder={`Add answer ${idx + 1}`}
                    value={opt.text}
                    onChange={(e) => {
                      handleOptionChange(idx, 'text', e.target.value);
                      if (opt.image) handleOptionChange(idx, 'image', undefined);
                    }}
                    className="w-full bg-transparent text-white placeholder-gray-400 outline-none text-center font-bold"
                  />



                )}
              </div>

              {/* Right Controls */}
              <div className="flex flex-col justify-center items-center gap-1 px-3 py-2">
                <label htmlFor={`option-img-${idx}`} className="cursor-pointer text-lg hover:scale-110 transition">
                  <FontAwesomeIcon icon={faImage} />
                </label>
                <input
                  id={`option-img-${idx}`}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      handleOptionChange(idx, 'image', reader.result as string);
                      handleOptionChange(idx, 'text', '');
                    };
                    reader.readAsDataURL(file);
                  }}
                />
                <label className="text-xs flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={opt.isCorrect}
                    onChange={(e) => handleOptionChange(idx, 'isCorrect', e.target.checked)}
                  />
                  ✓
                </label>
              </div>
            </div>
          );
        })}
      </div>

      {/* ➕ Add Option */}
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
