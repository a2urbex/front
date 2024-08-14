import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'



export default defineConfig({
  plugins: [
    vue({reactivityTransform: true,}),
    VitePWA({ 
      registerType: 'autoUpdate',
      strategies: 'injectManifest'
   })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
