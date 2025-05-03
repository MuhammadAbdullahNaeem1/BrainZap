import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faGripVertical } from '@fortawesome/free-solid-svg-icons';
import { MediaItem } from '../types/media';

interface Props {
  index: number;
  media: MediaItem[];
  onRemove: (type: MediaItem['type']) => void;
}

const OptionMedia: React.FC<Props> = ({ index, media, onRemove }) => (
  <Droppable droppableId={`option-media-${index}`} direction="vertical">
    {provided => (
      <div {...provided.droppableProps} ref={provided.innerRef} className="w-full space-y-2">
        {media.map((item, i) => (
          <Draggable
            key={`${index}-${item.type}-${i}`}
            draggableId={`${index}-${item.type}-${i}`}
            index={i}
          >
            {drag => (
              <div
                ref={drag.innerRef}
                {...drag.draggableProps}
                className="relative p-2 bg-white rounded"
              >
                {/* drag handle */}
                <div
                  {...drag.dragHandleProps}
                  className="absolute left-2 top-1/2 -translate-y-1/2
                             cursor-move bg-black bg-opacity-50 p-1 rounded-full text-white z-10"
                >
                  <FontAwesomeIcon icon={faGripVertical} />
                </div>

                {/* previews */}
                {item.type === 'image' && (
                  <img
                    src={item.value}
                    alt=""
                    className="max-h-40 object-contain mx-auto rounded"
                  />
                )}
                {item.type === 'audio' && (
                  <audio controls src={item.value} className="w-full">
                    Your browser does not support audio.
                  </audio>
                )}
                {item.type === 'video' && (
                  <video controls src={item.value} className="w-full max-h-40 rounded">
                    Your browser does not support video.
                  </video>
                )}

                {/* remove */}
                <button
                  onClick={() => onRemove(item.type)}
                  className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full shadow"
                >
                  <FontAwesomeIcon icon={faTrash} size="xs" />
                </button>
              </div>
            )}
          </Draggable>
        ))}
        {provided.placeholder}
      </div>
    )}
  </Droppable>
);

export default OptionMedia;
