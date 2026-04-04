import { createReadStream, existsSync } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { dirname, extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildQuote,
  createOrder,
  getProductById,
  getProducts,
  getStorefrontData,
} from './lib/storefront-service.mjs'

const currentDirectory = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(currentDirectory, '..')
const distDirectory = resolve(projectRoot, 'dist')
const port = Number(process.env.PORT ?? (process.env.NODE_ENV === 'production' ? 3000 : 8787))
const host = process.env.HOST ?? '127.0.0.1'

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Content-Type': 'application/json; charset=utf-8',
  })
  response.end(JSON.stringify(payload))
}

function sendNoContent(response) {
  response.writeHead(204, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  })
  response.end()
}

function readRequestBody(request) {
  return new Promise((resolveBody, rejectBody) => {
    let rawBody = ''

    request.on('data', (chunk) => {
      rawBody += chunk
    })

    request.on('end', () => {
      if (!rawBody) {
        resolveBody({})
        return
      }

      try {
        resolveBody(JSON.parse(rawBody))
      } catch {
        rejectBody(new Error('Request body must be valid JSON.'))
      }
    })

    request.on('error', rejectBody)
  })
}

async function serveStaticAsset(requestPath, response) {
  if (!existsSync(distDirectory)) {
    sendJson(response, 503, {
      error: 'The frontend build was not found. Run "npm run build" before starting the production server.',
    })
    return
  }

  const safePath = normalize(requestPath === '/' ? '/index.html' : requestPath).replace(/^(\.\.[/\\])+/, '')
  let filePath = join(distDirectory, safePath)

  if (existsSync(filePath)) {
    const fileStats = await stat(filePath)
    if (fileStats.isDirectory()) {
      filePath = join(filePath, 'index.html')
    }
  } else {
    filePath = join(distDirectory, 'index.html')
  }

  const extension = extname(filePath)
  const contentType = mimeTypes[extension] ?? 'application/octet-stream'

  response.writeHead(200, {
    'Content-Type': contentType,
  })

  createReadStream(filePath).pipe(response)
}

const server = createServer(async (request, response) => {
  if (!request.url || !request.method) {
    sendJson(response, 400, { error: 'Malformed request.' })
    return
  }

  if (request.method === 'OPTIONS') {
    sendNoContent(response)
    return
  }

  const url = new URL(request.url, `http://${request.headers.host ?? `127.0.0.1:${port}`}`)
  const pathname = url.pathname

  try {
    if (request.method === 'GET' && pathname === '/api/health') {
      sendJson(response, 200, {
        ok: true,
        service: 'nyra-store-api',
        environment: process.env.NODE_ENV ?? 'development',
      })
      return
    }

    if (request.method === 'GET' && pathname === '/api/storefront') {
      sendJson(response, 200, getStorefrontData())
      return
    }

    if (request.method === 'GET' && pathname === '/api/products') {
      sendJson(response, 200, {
        items: getProducts({
          department: url.searchParams.get('department') ?? 'all',
          q: url.searchParams.get('q') ?? '',
          sort: url.searchParams.get('sort') ?? 'featured',
        }),
      })
      return
    }

    if (request.method === 'GET' && pathname.startsWith('/api/products/')) {
      const productId = pathname.replace('/api/products/', '')
      const product = getProductById(productId)

      if (!product) {
        sendJson(response, 404, { error: 'Product not found.' })
        return
      }

      sendJson(response, 200, product)
      return
    }

    if (request.method === 'POST' && pathname === '/api/orders/quote') {
      const body = await readRequestBody(request)
      sendJson(response, 200, buildQuote(body.items))
      return
    }

    if (request.method === 'POST' && pathname === '/api/orders') {
      const body = await readRequestBody(request)
      sendJson(response, 201, createOrder(body.items))
      return
    }

    if (pathname.startsWith('/api/')) {
      sendJson(response, 404, { error: 'API route not found.' })
      return
    }

    if (process.env.NODE_ENV === 'production') {
      await serveStaticAsset(pathname, response)
      return
    }

    sendJson(response, 404, {
      error: 'Frontend assets are served by Vite in development. Start "npm run dev" and open the Vite URL.',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error.'
    sendJson(response, 500, { error: message })
  }
})

server.listen(port, host, () => {
  const label =
    process.env.NODE_ENV === 'production'
      ? `Nyra app and API available on http://${host}:${port}`
      : `Nyra API listening on http://${host}:${port}`

  console.log(label)
})
