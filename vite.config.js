import { defineConfig } from 'vite'
import wasm from 'vite-plugin-wasm'

export default defineConfig({
  plugins: [wasm()],
  build: { target: 'es2022', chunkSizeWarningLimit: 1600 },
  // screenshots written by the check scripts must not reload the page under test
  server: { watch: { ignored: ['**/shots/**', '**/research/**', '**/scripts/**'] } },
})
