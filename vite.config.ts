import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: '/YST-Knowledge-Space/', // 設定 GitHub Pages 的 base path
    server: {
      port: 3000,
      host: true, // 允許所有 IP 包括 127.0.0.1 和 0.0.0.0 連接
      strictPort: true, // 確保卡在 3000 不跳轉
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || '')
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
