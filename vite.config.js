import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['robots.txt', 'icon-192.svg', 'icon-512.svg'],
      manifest: {
        name: "Ly's Workspace - 个人常用网站与开发者工具箱",
        short_name: "Ly's Workspace",
        description: "极简 Apple 风格的开发者常用网站导航、跨境电商专用工具与全套离线高频开发者小工具箱。",
        theme_color: "#0071e3",
        background_color: "#000000",
        display: "standalone",
        orientation: "portrait-primary",
        scope: "/",
        start_url: "/#/",
        icons: [
          {
            src: "icon-192.svg",
            sizes: "192x192",
            type: "image/svg+xml",
            purpose: "any"
          },
          {
            src: "icon-512.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,txt,md}'],
        cleanupOutdatedCaches: true
      }
    })
  ],
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
