import { createServer } from 'http'
import { WebSocketServer, WebSocket, RawData } from 'ws'
import { RateLimiterMemory } from 'rate-limiter-flexible'
import { useServer } from 'graphql-ws/lib/use/ws'
import { GraphQLSchema } from 'graphql'

type WebSocketOptions = {
    cors?: {
        enable: boolean
        allowOrigins: string[]
    },
    rateLimit?: {
        enable: boolean
        points: number
        duration: number
    },
    connectionLimit?: {
        enable: boolean
        maxConnections: number
    },    
    auth?: {
        enable: boolean
        verify: (connectionParams: any) => Promise<boolean>
    },
    graphql: {
        schema: GraphQLSchema
        contextFactory: any
        execute: any
        subscribe: any
    }
}

export function setupWebSocketServer(server: ReturnType<typeof createServer>, options: WebSocketOptions) {
    let currentConnections = 0

    const wsServer = new WebSocketServer({
        server,
        path: '/graphql',
        maxPayload: 128 * 1024,
        verifyClient: (info, done) => {
            if (options.cors?.enable) {
                const origin = info.req.headers.origin
                if (!origin || !options.cors.allowOrigins.includes(origin)) {
                    return done(false, 403, 'Forbidden')
                }
            }

            if (options.connectionLimit?.enable && currentConnections >= options.connectionLimit.maxConnections) {
                console.warn(`Connection limit reached: ${currentConnections}/${options.connectionLimit.maxConnections}`);
                return done(false, 503, 'Too many connections')
            }

            done(true)
        }
    })

    if (options.rateLimit?.enable) {
        const rateLimiter = new RateLimiterMemory({
            points: options.rateLimit.points,
            duration: options.rateLimit.duration
        })

        wsServer.on('connection', (ws, req) => {
            const ip = req.socket.remoteAddress || 'unknown'
            ws.on('message', async () => {
                try {
                    await rateLimiter.consume(ip)
                    console.log('allow')
                } catch (rejRes: any) {
                    console.warn(`Rate limit reached: ip = ${ip}` )
                    ws.send(JSON.stringify({ event: 'blocked', retryMs: rejRes.msBeforeNext }))
                    ws.close()
                }
            })
        })
    }

    if (options.connectionLimit?.enable) {
        wsServer.on('connection', (ws: WebSocket) => {
            currentConnections++;

            ws.on('close', () => {
                currentConnections--;
            });
        });
    }


    useServer({
        schema: options.graphql.schema,
        execute: options.graphql.execute,
        subscribe: options.graphql.subscribe,
        context: options.graphql.contextFactory,
        onConnect: async (ctx) => {
            if (options.auth?.enable) {
                const result = await options.auth.verify(ctx.connectionParams)
                return result
            }
            return true
        }
    }, wsServer)

    return wsServer
}
