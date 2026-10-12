import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' 用相對路徑,放在 GitHub Pages 的 /倉庫名/ 底下也不會白屏,不用改倉庫名
export default defineConfig({ plugins: [react()], base: './' });