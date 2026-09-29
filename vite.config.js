import { defineConfig } from 'vite';

// Changes on every build: short commit SHA in GitHub Actions, otherwise a timestamp.
const buildId = process.env.GITHUB_SHA
  ? process.env.GITHUB_SHA.slice(0, 7)
  : Date.now().toString(36);

export default defineConfig({
  base: './',
  define: {
    __BUILD_ID__: JSON.stringify(buildId),
  },
});
