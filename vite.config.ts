import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import electron from 'vite-plugin-electron/simple'

// Set BROWSER_ONLY=1 to run the editor in a normal browser without Electron.
const browserOnly = process.env.BROWSER_ONLY === '1'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    ...(browserOnly
      ? []
      : [
          electron({
            main: { entry: 'electron/main.ts' },
            // Emit CommonJS as .cjs: with "type": "module", a CJS bundle named .mjs fails to load
            // (require is undefined), window.studio is never exposed and every native path silently
            // falls back to browser downloads.
            preload: {
              input: 'electron/preload.ts',
              vite: { build: { rollupOptions: { output: { format: 'cjs', entryFileNames: '[name].cjs' } } } },
            },
          }),
        ]),
  ],
})
