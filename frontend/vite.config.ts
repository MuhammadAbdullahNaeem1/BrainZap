import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'; // (if using React)

export default defineConfig({
  plugins: [react()], // Remove if not using React
  css: {
    postcss: './postcss.config.js',
  },
});