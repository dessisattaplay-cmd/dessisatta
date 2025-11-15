import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANT: For GitHub Pages deployment, you MUST change 'your-repo-name'
  // to the name of your GitHub repository. For example, if your repo is
  // 'https://github.com/your-username/dessi-satta-app', then the base
  // should be '/dessi-satta-app/'.
  // For Netlify or Vercel, you can remove this 'base' line.
  base: '/your-repo-name/', 
})
