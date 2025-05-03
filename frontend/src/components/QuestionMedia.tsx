import React, { useState } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faGripVertical } from '@fortawesome/free-solid-svg-icons';
import { MediaItem } from '../types/media';

interface Props {
  media: MediaItem[];
  onRemove: (type: MediaItem['type']) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const QuestionMedia: React.FC<Props> = ({ media, onRemove, onUpload }) => {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  return (
    <Droppable droppableId="question-media" direction="vertical">
      {provided => (
        <div
          {...provided.droppableProps}
          ref={provided.innerRef}
          className={`mb-6 w-full ${
            media.length
              ? 'bg-white rounded-lg p-4 shadow space-y-4'
              : 'flex items-center justify-center'
          }`}
        >
          {media.map((item, idx) => {
            const key = `q-${item.type}-${idx}`;
            return (
              <Draggable key={key} draggableId={key} index={idx}>
                {drag => (
                  <div ref={drag.innerRef} {...drag.draggableProps} className="relative p-2">
                    {/* Drag handle */}
                    <div
                      {...drag.dragHandleProps}
                      className="absolute left-2 top-1/2 -translate-y-1/2
                                 cursor-move bg-black bg-opacity-50 p-1 rounded-full text-white z-10"
                    >
                      <FontAwesomeIcon icon={faGripVertical} />
                    </div>

                    {/* Image zoom-on-hover */}
                    {item.type === 'image' && (
                      <div
                        className="relative overflow-visible"
                        onMouseEnter={() => setHoveredKey(key)}
                        onMouseLeave={() => setHoveredKey(null)}
                        style={{ zIndex: hoveredKey === key ? 9999 : undefined }}
                      >
                        <img
                          src={item.value}
                          alt=""
                          className="max-h-40 object-contain mx-auto rounded transform transition-transform duration-200 hover:scale-[2.0]"
                        />
                      </div>
                    )}

                    {/* Audio (no centering needed) */}
                    {item.type === 'audio' && (
                      <div className="max-w-xl w-full mx-auto">
                        <audio controls src={item.value} className="w-full" />
                      </div>
                    )}

                    {/* Video, now centered */}
                    {item.type === 'video' && (
                      <div
                        className="relative overflow-visible flex justify-center"
                        onMouseEnter={() => setHoveredKey(key)}
                        onMouseLeave={() => setHoveredKey(null)}
                        style={{ zIndex: hoveredKey === key ? 9999 : undefined }}
                      >
                        <video
                          controls
                          src={item.value}
                          className="max-w-xl w-full max-h-32 rounded transform transition-transform duration-200 hover:scale-[2.0]"
                        />
                      </div>
                    )}

                    {/* Remove button */}
                    <button
                      onClick={() => onRemove(item.type)}
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

          {!media.length && (
            <div className="w-full max-w-xl bg-gray-100 border-dashed border-2 border-gray-300 rounded-lg p-8 min-h-[160px] flex flex-col items-center justify-center">
              <button
                onClick={() => document.getElementById('q-upload')?.click()}
                className="w-12 h-12 mb-2 flex items-center justify-center bg-white text-black text-3xl font-bold rounded shadow-md hover:scale-105 transition"
              >
                +
              </button>
              <p className="text-gray-600 font-semibold">Insert image, audio or video</p>
            </div>
          )}

          {media.length > 0 && (
            <div className="flex justify-center mt-2">
              <button
                onClick={() => document.getElementById('q-upload')?.click()}
                className="w-10 h-10 flex items-center justify-center bg-gray-200 text-black text-2xl rounded shadow hover:scale-105 transition"
              >
                +
              </button>
            </div>
          )}

          <input
            id="q-upload"
            type="file"
            accept="image/*,audio/*,video/*"
            className="hidden"
            multiple
            onChange={onUpload}
          />
        </div>
      )}
    </Droppable>
  );
};

export default QuestionMedia;
