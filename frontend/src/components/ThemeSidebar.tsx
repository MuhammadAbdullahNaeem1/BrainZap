import React from 'react';

type Props = {
  defaultThemeImages: string[];
  setThemeImage: (img: string) => void;
  setShowThemeSidebar: (show: boolean) => void;
};

const ThemeSidebar = ({ defaultThemeImages, setThemeImage, setShowThemeSidebar }: Props) => (
  <div className="fixed top-0 right-0 h-full w-96 bg-white text-gray-800 shadow-lg z-40 overflow-y-auto p-6 pt-24">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-bold">Select a Background Theme</h3>
      <button
        onClick={() => setShowThemeSidebar(false)}
        className="text-red-600 hover:text-red-800 font-bold"
      >
        ✖
      </button>
    </div>
    <div className="grid grid-cols-2 gap-4">
      {defaultThemeImages.map((img, i) => (
        <img
          key={i}
          src={img}
          onClick={() => {
            setThemeImage(img);
            setShowThemeSidebar(false);
          }}
          className="cursor-pointer rounded-lg border hover:border-indigo-500"
        />
      ))}
    </div>
    <div className="mt-6">
      <label className="block text-sm font-semibold mb-2">Upload your own:</label>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onloadend = () => {
            setThemeImage(reader.result as string);
            setShowThemeSidebar(false);
          };
          reader.readAsDataURL(file);
        }}
        className="block w-full text-sm"
      />
    </div>
  </div>
);

export default ThemeSidebar;
