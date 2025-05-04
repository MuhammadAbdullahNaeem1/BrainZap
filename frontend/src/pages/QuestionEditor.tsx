// src/QuestionEditor.tsx

import React, { useState, useEffect } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import imageCompression from 'browser-image-compression';
import QuestionMedia from '../components/QuestionMedia';
import AnswerOptions from '../components/AnswerOptions';
import { MediaItem } from '../types/media';
import { Option, Question } from '../types/quizTypes';

interface Props {
  selectedQuestion: Question;
  handleQuestionChange: (field: keyof Question, value: any) => void;
  handleOptionChange: <K extends keyof Option>(idx: number, key: K, value: Option[K]) => void;
  addOption: () => void;
}

const QuestionEditor: React.FC<Props> = ({
  selectedQuestion,
  handleQuestionChange,
  handleOptionChange,
  addOption,
}) => {
  const [qMedia, setQMedia] = useState<MediaItem[]>([]);
  const [optMedia, setOptMedia] = useState<MediaItem[][]>([]);
  // keep qMedia in sync, honoring question.mediaOrder if present
  useEffect(() => {
    // — question-level media —
    const qItems: MediaItem[] = [];
    if (selectedQuestion.image) qItems.push({ type: 'image', value: selectedQuestion.image });
    if (selectedQuestion.audio) qItems.push({ type: 'audio', value: selectedQuestion.audio });
    if (selectedQuestion.video) qItems.push({ type: 'video', value: selectedQuestion.video });
  
    const qOrdered = selectedQuestion.mediaOrder && selectedQuestion.mediaOrder.length > 0
      ? selectedQuestion.mediaOrder
          .map(t => qItems.find(i => i.type === t))
          .filter((i): i is MediaItem => !!i)
      : qItems;
  
    setQMedia(qOrdered);
  
    // — option-level media —
    const allOptMedia = selectedQuestion.options.map(opt => {
      const items: MediaItem[] = [];
      if (opt.image) items.push({ type: 'image', value: opt.image });
      if (opt.audio) items.push({ type: 'audio', value: opt.audio });
      if (opt.video) items.push({ type: 'video', value: opt.video });
  
      const ordered = opt.mediaOrder && opt.mediaOrder.length > 0
        ? opt.mediaOrder
            .map(t => items.find(i => i.type === t))
            .filter((i): i is MediaItem => !!i)
        : items;
  
      return ordered;
    });
  
    setOptMedia(allOptMedia);
  }, [
    selectedQuestion.image,
    selectedQuestion.audio,
    selectedQuestion.video,
    selectedQuestion.mediaOrder,
    selectedQuestion.options
  ]);
  

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    // question-level media
    if (
      source.droppableId === 'question-media' &&
      destination.droppableId === 'question-media'
    ) {
      const updated = Array.from(qMedia);
      const [moved] = updated.splice(source.index, 1);
      updated.splice(destination.index, 0, moved);
      setQMedia(updated);

      // persist new order + values
      handleQuestionChange('mediaOrder', updated.map(i => i.type));
      handleQuestionChange('image', undefined);
      handleQuestionChange('audio', undefined);
      handleQuestionChange('video', undefined);
      updated.forEach(item => handleQuestionChange(item.type, item.value));
      return;
    }

    // option-level media
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
      setOptMedia(prev =>
        prev.map((arr, i) => (i === idx ? reordered : arr))
      );
      
      // then persist back into your Question state exactly as you already do:
      handleOptionChange(idx, 'mediaOrder', reordered.map(i=>i.type));
      handleOptionChange(idx, 'image', undefined as any);
      handleOptionChange(idx, 'audio', undefined as any);
      handleOptionChange(idx, 'video', undefined as any);
      reordered.forEach(item => handleOptionChange(idx, item.type as any, item.value as any));
    }
  };

  // compress images, and upload audio/video directly, updating mediaOrder
// inside QuestionEditor.tsx

const compressAndUpload = async (
  e: React.ChangeEvent<HTMLInputElement>,
  target: 'question' | 'option',
  idx?: number
) => {
  // grab the real input element
  const inputEl = e.currentTarget;
  const files = inputEl.files;
  if (!files) return;

  for (const file of Array.from(files)) {
    let type: 'image'|'audio'|'video';
    let dataUrl: string;

    if (file.type.startsWith('image/')) {
      type = 'image';
      try {
        const compressed = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        });
        dataUrl = await imageCompression.getDataUrlFromFile(compressed);
      } catch {
        dataUrl = await new Promise<string>(resolve => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }
    } else if (file.type.startsWith('audio/')) {
      type = 'audio';
      dataUrl = await new Promise<string>(resolve => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    } else if (file.type.startsWith('video/')) {
      type = 'video';
      dataUrl = await new Promise<string>(resolve => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    } else {
      continue;
    }

    if (target === 'question') {
      handleQuestionChange(type, dataUrl);
      const existing = selectedQuestion.mediaOrder || [];
      handleQuestionChange('mediaOrder', [...existing.filter(t => t !== type), type]);
    } else if (idx !== undefined) {
      handleOptionChange(idx, type, dataUrl);
      const existing = selectedQuestion.options[idx].mediaOrder || [];
      handleOptionChange(
        idx,
        'mediaOrder',
        [...existing.filter(t => t !== type), type] as any
      );
    }
  }

  // now it's safe to clear the input
  inputEl.value = '';
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

        {/* Question-level Media */}
        <QuestionMedia
          media={qMedia}
          onRemove={type => {
            handleQuestionChange(type, undefined);
            handleQuestionChange('mediaOrder', []);
          }}
          onUpload={e => compressAndUpload(e, 'question')}
        />

        {/* True/False */}
        {selectedQuestion.type === 'TrueFalse' && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            {['True', 'False'].map((label, i) => (
              <div
                key={i}
                className={`${
                  label === 'True' ? 'bg-green-500' : 'bg-red-500'
                } text-white relative flex flex-col items-center justify-center rounded-lg p-6 shadow min-h-[140px]`}
              >
                <label className="absolute top-2 right-2 flex items-center gap-1 text-white text-sm">
                  <input
                    type="radio"
                    name="true-false"
                    checked={selectedQuestion.options[i]?.isCorrect}
                    onChange={() =>
                      handleQuestionChange('options', [
                        { text: 'True', isCorrect: i === 0 },
                        { text: 'False', isCorrect: i === 1 },
                      ])
                    }
                    className="w-4 h-4"
                  />
                  Correct
                </label>
                <span className="text-xl font-bold">{label}</span>
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
            handleOptionImageUpload={(e, idx) => compressAndUpload(e, 'option', idx)}
          />
        )}

        {/* Add more answers */}
        {selectedQuestion.options.length < 6 &&
          (selectedQuestion.type === 'MCQ' || selectedQuestion.type === 'Multiselect') && (
            <div className="text-center mt-4">
              <button
                type="button"
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
