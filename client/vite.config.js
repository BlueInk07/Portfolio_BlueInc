import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('three') || id.includes('@react-three')) return 'three-vendor';
          if (id.includes('gsap')) return 'gsap-vendor';
          if (id.includes('react-router')) return 'router-vendor';
          if (id.includes('react') || id.includes('scheduler')) return 'react-vendor';
        },
      },
    },
  },
})
