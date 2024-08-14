import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'



export default defineConfig({
  plugins: [
    vue({reactivityTransform: true,}),
    VitePWA({ 
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src/pwa',
      filename: 'sw.js',
      manifest: {
        'name': 'a2urbex',
        'short_name': 'a2urbex',
        'start_url': '/',
        'display': 'standalone',
        'background_color': '#232323',
        'theme_color': '#222222',
        'icons': [
          {
            'src': './logox192.png',
            'sizes': '192x192',
            'type': 'image/png'
          }
        ],
        'dir': 'ltr',
        'description': 'Simple solution to centralize locations, with comments, status, categories, filters, and more...',
        'lang': 'en',
        'orientation': 'portrait',
        'categories': [
          'health',
          'navigation',
          'productivity',
          'social',
          'sports',
          'travel',
          'utilities'
        ],
        'display_override': [
          'standalone',
          'fullscreen',
          'minimal-ui',
          'window-controls-overlay',
          'browser'
        ],
        'shortcuts': [
          {
            'name': 'Locations',
            'url': '/locations',
            'description': 'Locations'
          }
        ]
      }
   })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
