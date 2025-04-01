import React from 'react';

type Props = {
  title: string;
  onTitleChange: (val: string) => void;
  onSave: () => void;
  onThemeClick: () => void;
};

const TopBar = ({ title, onTitleChange, onSave, onThemeClick }: Props) => (
  <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-white text-black px-6 py-3 border-b border-gray-300 shadow-sm">
    <input
  className="w-full max-w-xs text-lg font-medium bg-white border border-gray-400 rounded-md px-3 py-1 placeholder-gray-500 focus:outline-none focus:border-black text-black mr-4"
  value={title}
  onChange={(e) => onTitleChange(e.target.value)}
  placeholder="Enter kahoot title..."
/>

    <div className="flex gap-3">
      <button
        onClick={onSave}
        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-semibold shadow"
      >
        ✅ Save
      </button>
      <button
        onClick={onThemeClick}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-semibold shadow"
      >
        🎨 Themes
      </button>
    </div>
  </div>
);

export default TopBar;
