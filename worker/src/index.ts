export interface Env {
  AI: Ai
  ASSETS: Fetcher
}

interface ChatRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  model: string
  systemPrompt: string
}

const ALLOWED_MODELS = [
  '@cf/qwen/qwen3-30b-a3b-fp8',
  '@cf/meta/llama-4-scout-17b-16e-instruct',
]

function modelId(short: string): string {
  if (short === 'qwen3-30b-a3b-fp8') return '@cf/qwen/qwen3-30b-a3b-fp8'
  if (short === 'llama-4-scout-17b-16e-instruct') return '@cf/meta/llama-4-scout-17b-16e-instruct'
  return short
}

function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() })
    }

    if (url.pathname === '/api/chat' && request.method === 'POST') {
      return handleChat(request, env)
    }

    if (url.pathname === '/api/models') {
      return Response.json(
        { models: ALLOWED_MODELS },
        { headers: corsHeaders() }
      )
    }

    // Serve static assets, with SPA fallback for client-side routes
    const assetResponse = await env.ASSETS.fetch(request)
    if (assetResponse.status === 404) {
      // SPA fallback: serve index.html for client-side routes like /demo
      const indexRequest = new Request(new URL('/', request.url).toString(), request)
      return env.ASSETS.fetch(indexRequest)
    }
    return assetResponse
  },
} satisfies ExportedHandler<Env>

async function handleChat(request: Request, env: Env): Promise<Response> {
  let body: ChatRequest
  try {
    body = await request.json() as ChatRequest
  } catch {
    return new Response('Invalid JSON', { status: 400, headers: corsHeaders() })
  }

  const { messages, model, systemPrompt } = body

  if (!messages?.length || !model) {
    return new Response('Missing messages or model', { status: 400, headers: corsHeaders() })
  }

  const fullModelId = modelId(model)
  if (!ALLOWED_MODELS.includes(fullModelId)) {
    return new Response(`Model not allowed: ${model}`, { status: 400, headers: corsHeaders() })
  }

  const aiMessages: Array<{ role: string; content: string }> = []
  if (systemPrompt) {
    aiMessages.push({ role: 'system', content: systemPrompt })
  }
  aiMessages.push(...messages)

  try {
    // Try streaming first
    const stream = await env.AI.run(fullModelId as Parameters<typeof env.AI.run>[0], {
      messages: aiMessages as RoleScopedChatInput[],
      stream: true,
    })

    // Cloudflare AI stream returns an SSE ReadableStream
    // We need to parse it and extract just the text content
    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()
    const encoder = new TextEncoder()

    ;(async () => {
      try {
        const reader = (stream as ReadableStream).getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          // Process complete lines from buffer
          const lines = buffer.split('\n')
          // Keep the last (potentially incomplete) line in buffer
          buffer = lines.pop() || ''

          for (const line of lines) {
            const trimmed = line.trim()
            if (trimmed.startsWith('data: ')) {
              const data = trimmed.slice(6).trim()
              if (data === '[DONE]') continue
              try {
                const parsed = JSON.parse(data)
                if (parsed.response) {
                  await writer.write(encoder.encode(parsed.response))
                }
              } catch {
                // If it's not JSON, it might be raw text - write it directly
                if (data && data !== '[DONE]') {
                  await writer.write(encoder.encode(data))
                }
              }
            }
          }
        }

        // Process any remaining buffer
        if (buffer.trim()) {
          const trimmed = buffer.trim()
          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6).trim()
            if (data && data !== '[DONE]') {
              try {
                const parsed = JSON.parse(data)
                if (parsed.response) {
                  await writer.write(encoder.encode(parsed.response))
                }
              } catch {
                await writer.write(encoder.encode(data))
              }
            }
          }
        }
      } catch (err) {
        console.error('Stream processing error:', err)
        // Fallback: try non-streaming
        try {
          const result = await env.AI.run(fullModelId as Parameters<typeof env.AI.run>[0], {
            messages: aiMessages as RoleScopedChatInput[],
          }) as { response?: string }
          if (result.response) {
            await writer.write(encoder.encode(result.response))
          }
        } catch (fallbackErr) {
          console.error('Fallback error:', fallbackErr)
        }
      } finally {
        await writer.close()
      }
    })()

    return new Response(readable, {
      headers: {
        ...corsHeaders(),
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (err) {
    // If streaming fails entirely, try non-streaming mode
    console.error('Stream init error, trying non-streaming:', err)
    try {
      const result = await env.AI.run(fullModelId as Parameters<typeof env.AI.run>[0], {
        messages: aiMessages as RoleScopedChatInput[],
      }) as { response?: string }

      return new Response(result.response || 'No response', {
        headers: {
          ...corsHeaders(),
          'Content-Type': 'text/plain; charset=utf-8',
        },
      })
    } catch (fallbackErr) {
      console.error('AI error:', fallbackErr)
      return new Response(`AI service error: ${(fallbackErr as Error).message}`, {
        status: 500,
        headers: corsHeaders(),
      })
    }
  }
}
