import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ['server/tests/**/*.test.js'],
    deps: {
      optimizer: {
        ssr: {
          exclude: ['node:sqlite']
        }
      }
    }
  }
});
