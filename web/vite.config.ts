import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { defineConfig } from 'vite'

const VERSION_HEADER = 'no-store'
const DOCUMENT_HEADER = 'no-cache, must-revalidate'
const ASSET_HEADER = 'public, max-age=31536000, immutable'

export default defineConfig({
  plugins: [react(), tailwindcss(), appVersion()],
  build: {
    modulePreload: true,
  },
})

function appVersion(): Plugin {
  let version = 'dev'

  return {
    name: 'app-version',
    configResolved(config) {
      version = config.command === 'build' ? new Date().toISOString() : 'dev'
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (pathname(request) === '/version.json') {
          sendVersion(response, version)
          return
        }
        applyCacheHeaders(request, response)
        next()
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((request, response, next) => {
        applyCacheHeaders(request, response)
        next()
      })
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ version }),
      })
    },
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const script = html.match(
          /<script type="module"[^>]*src="([^"]+)"/,
        )
        const style = html.match(
          /<link rel="stylesheet"[^>]*href="([^"]+)"/,
        )
        const hints = [
          script
            ? `<link rel="modulepreload" crossorigin href="${script[1]}" />`
            : '',
          style
            ? `<link rel="preload" href="${style[1]}" as="style" />`
            : '',
        ]
          .filter(Boolean)
          .join('\n    ')

        return html
          .replace(
            '<script type="module" crossorigin ',
            '<script type="module" crossorigin fetchpriority="high" ',
          )
          .replace('</title>', `</title>\n    ${hints}`)
      },
    },
  }
}

function sendVersion(response: ServerResponse, version: string) {
  response.statusCode = 200
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Cache-Control', VERSION_HEADER)
  response.end(JSON.stringify({ version }))
}

function applyCacheHeaders(request: IncomingMessage, response: ServerResponse) {
  const path = pathname(request)
  if (path === '/version.json') {
    response.setHeader('Cache-Control', VERSION_HEADER)
    return
  }
  if (path === '/' || path === '/index.html') {
    response.setHeader('Cache-Control', DOCUMENT_HEADER)
    return
  }
  if (path.startsWith('/assets/')) {
    response.setHeader('Cache-Control', ASSET_HEADER)
  }
}

function pathname(request: IncomingMessage) {
  return (request.url ?? '').split('?')[0]
}
