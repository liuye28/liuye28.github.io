import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages 部署路径配置:
  // 1. 如果仓库名是 <username>.github.io（主页仓库），base 保持为 '/'
  // 2. 如果仓库名是普通项目仓库（如 <username>.github.io/my-nav/），则需修改为 '/my-nav/'
  base: '/',
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
