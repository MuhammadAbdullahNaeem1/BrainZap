export type QuestionType = 'MCQ' | 'TrueFalse' | 'Multiselect' | 'TypeAnswer';

export type Question = {
  text: string;
  type: QuestionType;
  timer: number;
  image?: string;
  audio?: string;
  video?: string;
  mediaOrder?: Array<'image' | 'audio' | 'video'>;
  options: Option[];
  points?: number;
};

export const optionSymbols = ['▲', '◆', '●', '■', '★', '⬟'];
export const symbolColors = [
  'bg-red-500 text-white',
  'bg-blue-500 text-white',
  'bg-yellow-400 text-white',
  'bg-green-500 text-white',
  'bg-pink-500 text-white',
  'bg-indigo-500 text-white',
];

export type Option = {
  text: string;
  isCorrect: boolean;
  image?: string;
  audio?: string;
  video?: string;
  mediaOrder?: Array<'image' | 'audio' | 'video'>;
};
