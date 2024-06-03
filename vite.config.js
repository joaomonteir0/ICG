import { defineConfig } from 'vite'

export default defineConfig({
  base: '/', // Adjust this if your project is served from a subdirectory
  build: {
    outDir: 'dist'
  }
})
