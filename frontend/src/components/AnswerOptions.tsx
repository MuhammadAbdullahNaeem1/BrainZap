// src/components/AnswerOptions.tsx
import React from 'react';
import { Option, Question } from '../types/quizTypes';
import OptionItem from './OptionItem';

interface Props {
  options: Option[];
  questionType: Question['type'];
  handleOptionChange: <K extends keyof Option>(idx: number, key: K, value: Option[K]) => void;
  handleOptionImageUpload: (e: React.ChangeEvent<HTMLInputElement>, idx: number) => void;
}

const AnswerOptions: React.FC<Props> = ({
  options,
  questionType,
  handleOptionChange,
  handleOptionImageUpload
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
    {options.map((opt, idx) => (
      <OptionItem
        key={idx}
        opt={opt}
        idx={idx}
        isMulti={questionType === 'Multiselect'}
        onTextChange={text => handleOptionChange(idx, 'text', text)}
        onCorrectChange={checked => handleOptionChange(idx, 'isCorrect', checked)}
        onMediaUpload={e => handleOptionImageUpload(e, idx)}
        onRemoveMedia={type => handleOptionChange(idx, type, undefined)}
        handleOptionChange={handleOptionChange}  // ← newly passed prop
      />
    ))}
  </div>
);

export default AnswerOptions;
