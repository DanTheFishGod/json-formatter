import { readdir } from 'node:fs/promises'
import path from 'node:path'

const samplesPath = path.resolve(__dirname, '..', 'samples')

// Serves JSON (and other) samples for manually testing
export const jsonServer = async () => {
  const entries = await readdir(samplesPath, { withFileTypes: true })
  const sampleFiles = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
  const sampleFileNames = new Set(sampleFiles)
  const links = sampleFiles
    .sort()
    .map(
      (name) =>
        `<li><a href="/${encodeURIComponent(name)}">${name.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`)}</a></li>`,
    )
    .join('')

  const server = Bun.serve({
    hostname: '127.0.0.1',
    port: 8586,
    fetch: async (request) => {
      if (request.method !== 'GET' && request.method !== 'HEAD')
        return new Response('Method Not Allowed', {
          status: 405,
          headers: { Allow: 'GET, HEAD' },
        })

      const pathname = new URL(request.url).pathname
      if (pathname === '/')
        return new Response(
          `<!doctype html><meta charset="utf-8"><ul>${links}</ul>`,
          {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          },
        )

      let fileName: string
      try {
        fileName = decodeURIComponent(pathname.slice(1))
      } catch {
        return new Response('Not Found', { status: 404 })
      }

      if (
        path.basename(fileName) !== fileName ||
        !sampleFileNames.has(fileName)
      )
        return new Response('Not Found', { status: 404 })

      const file = Bun.file(path.join(samplesPath, fileName))
      if (!(await file.exists()))
        return new Response('Not Found', { status: 404 })
      return new Response(file)
    },
  })

  console.log(
    `Sample server listening at http://${server.hostname}:${server.port}`,
  )
  return server
}
