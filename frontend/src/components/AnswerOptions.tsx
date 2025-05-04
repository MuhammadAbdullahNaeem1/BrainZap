import React from 'react';
import { Option, Question } from '../types/quizTypes';
import OptionItem from './OptionItem';
import { MediaItem } from '../types/media';

interface Props {
  options: Option[];
  questionType: Question['type'];
  handleOptionChange: <K extends keyof Option>(
    idx: number,
    key: K,
    value: Option[K]
  ) => void;
  handleOptionImageUpload: (
    e: React.ChangeEvent<HTMLInputElement>,
    idx: number
  ) => void;
}

const AnswerOptions: React.FC<Props> = ({
  options,
  questionType,
  handleOptionChange,
  handleOptionImageUpload,
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
    {options.map((opt, idx) => {
      // build the raw media list
      const raw: MediaItem[] = [];
      if (opt.image) raw.push({ type: 'image', value: opt.image });
      if (opt.audio) raw.push({ type: 'audio', value: opt.audio });
      if (opt.video) raw.push({ type: 'video', value: opt.video });

      // reorder by opt.mediaOrder if present
      const orderedMedia =
        Array.isArray(opt.mediaOrder) && opt.mediaOrder.length > 0
          ? opt.mediaOrder
              .map((type) => raw.find((m) => m.type === type))
              .filter((m): m is MediaItem => Boolean(m))
          : raw;

      return (
        <OptionItem
          key={idx}
          idx={idx}
          isMulti={questionType === 'Multiselect'}
          opt={opt}
          orderedMedia={orderedMedia}
          onTextChange={(text) =>
            handleOptionChange(idx, 'text', text as Option['text'])
          }
          onCorrectChange={(checked) =>
            handleOptionChange(idx, 'isCorrect', checked as Option['isCorrect'])
          }
          onMediaUpload={(e) => handleOptionImageUpload(e, idx)}
          onRemoveMedia={(type) => {
            handleOptionChange(idx, type as any, undefined as any);
            handleOptionChange(
              idx,
              'mediaOrder' as any,
              []
            );
          }}
          handleOptionChange={handleOptionChange}
        />
      );
    })}
  </div>
);

export default AnswerOptions;
