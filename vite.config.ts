import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import { copilotDataPlugin } from './vite-plugin-copilot-data.js'

const usageDir = fileURLToPath(new URL('./data/usage', import.meta.url))
const costDir = fileURLToPath(new URL('./data/cost', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte(), copilotDataPlugin(usageDir, costDir)],
})
