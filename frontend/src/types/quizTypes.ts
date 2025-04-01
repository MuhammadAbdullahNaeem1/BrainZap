export type Option = {
    text: string;
    isCorrect: boolean;
  };
  
  export type Question = {
    text: string;
    type: 'MCQ' | 'TrueFalse' | 'Multiselect' | 'TypeAnswer';
    timer: number;
    image?: string;
    options: Option[];
    points?: number;
  };
  
  export const optionSymbols = ['▲', '◆', '●', '■', '★', '⬟'];
  export const symbolColors = [
    'bg-red-500 text-white',
    'bg-blue-500 text-white',
    'bg-yellow-400 text-black',
    'bg-green-500 text-white',
    'bg-pink-500 text-white',
    'bg-indigo-500 text-white',
  ];
  