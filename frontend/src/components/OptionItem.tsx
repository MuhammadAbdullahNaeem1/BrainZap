import React, { useState, useEffect } from 'react';
import { Option, optionSymbols, symbolColors } from '../types/quizTypes';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faImage,
  faTrash,
  faGripVertical,
} from '@fortawesome/free-solid-svg-icons';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import { MediaItem } from '../types/media';

interface Props {
  opt: Option;
  idx: number;
  isMulti: boolean;
  orderedMedia: MediaItem[];
  onTextChange: (text: string) => void;
  onCorrectChange: (isCorrect: boolean) => void;
  onMediaUpload: (
    e: React.ChangeEvent<HTMLInputElement>,
    idx: number
  ) => void;
  onRemoveMedia: (type: MediaItem['type']) => void;
  handleOptionChange: <K extends keyof Option>(
    idx: number,
    key: K,
    value: Option[K]
  ) => void;
}

const OptionItem: React.FC<Props> = ({
  opt,
  idx,
  isMulti,
  orderedMedia,
  onTextChange,
  onCorrectChange,
  onMediaUpload,
  onRemoveMedia,
  handleOptionChange,
}) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(orderedMedia);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  // keep local mediaItems in sync when parent prop changes
  useEffect(() => {
    setMediaItems(orderedMedia);
  }, [orderedMedia]);

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination || source.droppableId !== destination.droppableId) return;

    const reordered = Array.from(mediaItems);
    const [moved] = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, moved);
    setMediaItems(reordered);

    // persist new order
    handleOptionChange(
      idx,
      'mediaOrder' as any,
      reordered.map((i) => i.type) as any
    );

    // clear & reassign fields
    handleOptionChange(idx, 'image' as any, undefined as any);
    handleOptionChange(idx, 'audio' as any, undefined as any);
    handleOptionChange(idx, 'video' as any, undefined as any);
    reordered.forEach((item) =>
      handleOptionChange(idx, item.type as any, item.value as any)
    );
  };

  const filled = opt.text.trim() !== '' || mediaItems.length > 0;
  const color = symbolColors[idx % symbolColors.length];

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div
        className={`relative group rounded-lg flex items-stretch p-0 transition-all ${
          filled ? color : 'bg-white border text-gray-500'
        } shadow ${mediaItems.length ? 'min-h-[240px]' : 'min-h-[140px]'}`}
      >
        <div
          className={`w-14 flex items-center justify-center font-extrabold text-2xl rounded-l ${color}`}
        >
          {optionSymbols[idx % optionSymbols.length]}
        </div>

        <div className="flex-1 p-4 flex flex-col justify-center items-center gap-2 text-center">
          {mediaItems.length === 0 ? (
            <input
              type="text"
              placeholder={`Add answer ${idx + 1}`}
              value={opt.text}
              onChange={(e) => onTextChange(e.target.value)}
              className={`w-full bg-transparent ${
                filled ? 'text-white placeholder-gray-200' : 'text-black'
              } outline-none text-center font-bold`}
            />
          ) : (
            <Droppable droppableId={`option-media-${idx}`} direction="vertical">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="w-full space-y-2"
                >
                  {mediaItems.map((item, mi) => {
                    const key = `${idx}-${item.type}-${mi}`;
                    return (
                      <Draggable key={key} draggableId={key} index={mi}>
                        {(dragProv) => (
                          <div
                            ref={dragProv.innerRef}
                            {...dragProv.draggableProps}
                            className="relative p-2 bg-white rounded"
                          >
                            <div
                              {...dragProv.dragHandleProps}
                              className="absolute left-2 top-1/2 -translate-y-1/2 cursor-move bg-black bg-opacity-50 p-1 rounded-full text-white z-10"
                            >
                              <FontAwesomeIcon icon={faGripVertical} />
                            </div>

                            {(item.type === 'image' || item.type === 'video') && (
                              <div
                                className="relative overflow-visible"
                                onMouseEnter={() => setHoveredKey(key)}
                                onMouseLeave={() => setHoveredKey(null)}
                                style={{ zIndex: hoveredKey === key ? 9999 : undefined }}
                              >
                                {item.type === 'image' ? (
                                  <img
                                    src={item.value}
                                    alt=""
                                    className="max-h-40 object-contain mx-auto rounded transform transition-transform duration-200 hover:scale-[1.5]"
                                  />
                                ) : (
                                  <video
                                    controls
                                    src={item.value}
                                    className="w-full max-h-40 rounded transform transition-transform duration-200 hover:scale-[1.5]"
                                  />
                                )}
                              </div>
                            )}

                            {item.type === 'audio' && (
                              <div className="max-w-lg w-full mx-auto">
                                <audio controls src={item.value} className="w-full" />
                              </div>
                            )}

                            <button
                              onClick={() => onRemoveMedia(item.type)}
                              className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full shadow"
                            >
                              <FontAwesomeIcon icon={faTrash} size="xs" />
                            </button>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          )}
        </div>

        <div className="flex flex-col justify-center items-center gap-3 px-3 py-2 bg-black bg-opacity-10">
          <label
            htmlFor={`opt-upload-${idx}`}
            className="cursor-pointer text-lg hover:scale-110 transition"
          >
            <FontAwesomeIcon icon={faImage} />
          </label>
          <input
            id={`opt-upload-${idx}`}
            type="file"
            accept="image/*,audio/*,video/*"
            className="hidden"
            multiple
            onChange={(e) => {
              onMediaUpload(e, idx);
              e.currentTarget.value = '';
            }}
          />

          <label className="flex items-center gap-1 text-sm cursor-pointer">
            <input
              type={isMulti ? 'checkbox' : 'radio'}
              name={isMulti ? undefined : 'correct-answer'}
              checked={opt.isCorrect}
              onChange={(e) => onCorrectChange(e.target.checked)}
              className="w-4 h-4"
            />
            Correct
          </label>
        </div>
      </div>
    </DragDropContext>
  );
};

export default OptionItem;
