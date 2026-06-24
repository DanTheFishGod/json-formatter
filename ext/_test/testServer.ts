import * as http from 'http'

export interface TestServerOptions {
  /** HTTP response body. Defaults to a simple JSON object. */
  body?: string
  /** Content-Type header. Defaults to 'application/json'. */
  contentType?: string
  /** Additional response headers to include (e.g. Set-Cookie, Authorization). */
  extraHeaders?: Record<string, string>
}

/**
 * A minimal in-process HTTP server used to serve JSON responses with
 * configurable headers during Playwright tests.
 *
 * Using a real HTTP server (rather than page.route) ensures that Chrome's
 * webRequest.onHeadersReceived fires correctly so the extension processes the
 * response headers just as it would in production.
 *
 * Usage:
 *   const server = new TestServer({ extraHeaders: { 'set-cookie': 'x=1' } })
 *   const base = await server.start()
 *   await page.goto(`${base}/`)
 *   // ... assertions ...
 *   await server.stop()
 */
export class TestServer {
  private server: http.Server
  private _port = 0

  constructor(private options: TestServerOptions = {}) {
    this.server = http.createServer((req, res) => {
      const contentType = this.options.contentType ?? 'text/plain'
      const body = this.options.body ?? '{"test":true,"value":42}'

      const headers: Record<string, string> = {
        'Content-Type': contentType,
        // Force inline rendering — prevents Chrome from treating the response
        // as a download (which would cause page.goto to hang indefinitely).
        'Content-Disposition': 'inline',
        'Cache-Control': 'no-store',
        ...this.options.extraHeaders,
      }

      res.writeHead(200, headers)
      res.end(body)
    })
  }

  /** Start the server and return the base URL (e.g. "http://127.0.0.1:54321"). */
  start(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.server.once('error', reject)
      // Port 0 = OS assigns an ephemeral port
      this.server.listen(0, '127.0.0.1', () => {
        const addr = this.server.address() as { port: number }
        this._port = addr.port
        resolve(`http://127.0.0.1:${this._port}`)
      })
    })
  }

  stop(): Promise<void> {
    return new Promise((resolve) => this.server.close(() => resolve()))
  }

  get port() {
    return this._port
  }
}
