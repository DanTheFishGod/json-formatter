import WebSocket, { WebSocketServer } from 'ws'
import { watch } from 'fs'
import { randomUUID } from 'crypto'
import { build } from './lib/build'
import { DEV, extPath } from './lib/config.build'
import { jsonServer } from './jsonServer'

// Generate a session nonce so the worker can verify reload messages come from
// this watch server and not an arbitrary localhost process.
if (DEV) process.env.WS_NONCE = randomUUID()

// autoreload notification server
const wss = DEV ? new WebSocketServer({ port: 8585 }) : null

// Also run a file server for testing things in dev
jsonServer()

watch(extPath, { recursive: true }, async (event, file) => {
  console.log(`${event}: ./src/${file}`)
  await build()

  // notify any locally running extension worker that's connected
  if (wss)
    for (const client of wss.clients)
      if (client.readyState === WebSocket.OPEN)
        client.send(JSON.stringify({ type: 'reload_extension', nonce: process.env.WS_NONCE }))
})

// initial build
await build()
