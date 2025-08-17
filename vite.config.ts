import build from '@hono/vite-build/cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    build({
      entry: 'src/index-enhanced.tsx' // Specify entry for build
    }),
    devServer({
      adapter,
      entry: 'src/index-enhanced.tsx' // Use enhanced version with biological neurons
    })
  ]
})