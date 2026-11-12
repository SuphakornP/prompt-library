import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [{ name: 'prompt-catalog', test: /\/src\/data\/catalog\.json$/ }],
        },
      },
    },
  },
});
