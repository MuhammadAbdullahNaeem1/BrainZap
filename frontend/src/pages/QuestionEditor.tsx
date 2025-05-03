// src/QuestionEditor.tsx
import React, { useState, useEffect } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import QuestionMedia from '../components/QuestionMedia';
import AnswerOptions from '../components/AnswerOptions';
import { MediaItem } from '../types/media';
import { Option, Question } from '../types/quizTypes';

interface Props {
  selectedQuestion: Question;
  handleQuestionChange: (field: keyof Question, value: any) => void;
  handleOptionChange: <K extends keyof Option>(idx: number, key: K, value: Option[K]) => void;
  handleOptionImageUpload: (e: React.ChangeEvent<HTMLInputElement>, idx: number) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  addOption: () => void;
}

const QuestionEditor: React.FC<Props> = ({
  selectedQuestion,
  handleQuestionChange,
  handleOptionChange,
  handleOptionImageUpload,
  handleImageUpload,
  addOption,
}) => {
  const [qMedia, setQMedia] = useState<MediaItem[]>([]);

  // keep qMedia in sync with selectedQuestion.image/audio/video
  useEffect(() => {
    const items: MediaItem[] = [];
    if (selectedQuestion.image) items.push({ type: 'image', value: selectedQuestion.image });
    if (selectedQuestion.audio) items.push({ type: 'audio', value: selectedQuestion.audio });
    if (selectedQuestion.video) items.push({ type: 'video', value: selectedQuestion.video });
    setQMedia(items);
  }, [selectedQuestion.image, selectedQuestion.audio, selectedQuestion.video]);

  // drag handler for both question‐level and option‐level media
  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    // — Question media reordering —
    if (
      source.droppableId === 'question-media' &&
      destination.droppableId === 'question-media'
    ) {
      const updated = Array.from(qMedia);
      const [moved] = updated.splice(source.index, 1);
      updated.splice(destination.index, 0, moved);
      setQMedia(updated);

      // persist back into question
      handleQuestionChange('image', undefined);
      handleQuestionChange('audio', undefined);
      handleQuestionChange('video', undefined);
      updated.forEach(item => handleQuestionChange(item.type, item.value));
      return;
    }

    // — Option media reordering —
    if (
      source.droppableId.startsWith('option-media-') &&
      source.droppableId === destination.droppableId
    ) {
      const idx = parseInt(source.droppableId.split('-')[2], 10);
      const opt = selectedQuestion.options[idx];
      const items: MediaItem[] = [];
      if (opt.image) items.push({ type: 'image', value: opt.image });
      if (opt.audio) items.push({ type: 'audio', value: opt.audio });
      if (opt.video) items.push({ type: 'video', value: opt.video });

      const reordered = Array.from(items);
      const [moved] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, moved);

      // clear old media and reassign in new order
      handleOptionChange(idx, 'image', undefined);
      handleOptionChange(idx, 'audio', undefined);
      handleOptionChange(idx, 'video', undefined);
      reordered.forEach(item => {
        handleOptionChange(idx, item.type, item.value as any);
      });
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="p-6 md:p-10">
        {/* Question Text */}
        <label htmlFor="question-text" className="block mb-2 font-medium text-gray-700">
          Question Text
        </label>
        <input
          id="question-text"
          type="text"
          placeholder="Enter your question"
          value={selectedQuestion.text}
          onChange={e => handleQuestionChange('text', e.target.value)}
          className="w-full mb-6 px-4 py-3 border text-black border-gray-300 rounded-lg focus:outline-indigo-400 bg-white shadow"
        />

        {/* Question‐level Media */}
        <QuestionMedia
          media={qMedia}
          onRemove={(type: MediaItem['type']) => handleQuestionChange(type, undefined)}
          onUpload={handleImageUpload}
        />

        {/* True/False */}
        {selectedQuestion.type === 'TrueFalse' && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[
              { label: 'True', isCorrect: selectedQuestion.options[0]?.isCorrect, color: 'bg-green-500' },
              { label: 'False', isCorrect: selectedQuestion.options[1]?.isCorrect, color: 'bg-red-500' },
            ].map((opt, i) => (
              <div
                key={i}
                className={`${opt.color} text-white relative flex flex-col items-center justify-center rounded-lg p-6 shadow min-h-[140px]`}
              >
                <label className="absolute top-2 right-2 flex items-center gap-1 text-white text-sm">
                  <input
                    type="radio"
                    name="true-false"
                    checked={opt.isCorrect}
                    onChange={() => {
                      const newOpts = [
                        { text: 'True', isCorrect: i === 0 },
                        { text: 'False', isCorrect: i === 1 },
                      ];
                      handleQuestionChange('options', newOpts);
                    }}
                    className="w-4 h-4"
                  />
                  Correct
                </label>
                <span className="text-xl font-bold">{opt.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Type Answer */}
        {selectedQuestion.type === 'TypeAnswer' && (
          <div className="mb-6">
            <label className="block mb-2 font-medium text-gray-700">Correct Answer</label>
            <input
              type="text"
              placeholder="Enter the correct answer"
              value={selectedQuestion.options[0]?.text || ''}
              onChange={e =>
                handleQuestionChange('options', [{ text: e.target.value, isCorrect: true }])
              }
              className="w-full px-4 py-3 border text-black border-gray-300 rounded-lg focus:outline-indigo-400 bg-white shadow"
            />
          </div>
        )}

        {/* MCQ / Multiselect */}
        {(selectedQuestion.type === 'MCQ' || selectedQuestion.type === 'Multiselect') && (
          <AnswerOptions
            options={selectedQuestion.options}
            questionType={selectedQuestion.type}
            handleOptionChange={handleOptionChange}
            handleOptionImageUpload={handleOptionImageUpload}
          />
        )}

        {/* Add more answers */}
        {selectedQuestion.options.length < 6 &&
          (selectedQuestion.type === 'MCQ' || selectedQuestion.type === 'Multiselect') && (
            <div className="text-center mt-4">
              <button
                onClick={addOption}
                className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded hover:bg-indigo-700 transition shadow"
              >
                ➕ Add more answers
              </button>
            </div>
          )}
      </div>
    </DragDropContext>
  );
};

export default QuestionEditor;