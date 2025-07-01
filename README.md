# GraphQL Server with Yoga & Schema-First

This project is a GraphQL server built using [GraphQL Yoga](https://the-guild.dev/graphql/yoga-server) with a **schema-first** approach and **code generation** using TypeScript. It supports GraphQL **queries**, **mutations**, and **subscriptions**, along with Prometheus metrics and configurable WebSocket security features.

## 📦 Project Setup

```bash
npm install
npm run codegen
```

## 🔧 Compile for Development

```bash
npm run start
```

## 🧪 Running Tests

```bash
npm run test
```

## 🌐 Endpoints

* `http://localhost:4000/graphql`
  → For GraphQL **queries** and **mutations**

* `ws://localhost:4000/graphql`
  → For GraphQL **subscriptions**

* `http://localhost:4000/ws-metrics`
  → WebSocket **Prometheus metrics**

* `http://localhost:4000/metrics`
  → HTTP server **Prometheus metrics**

## 🔐 WebSocket Security Options

This project supports optional WebSocket configurations for enhanced security and observability. You can enable or disable features such as CORS, rate limiting, connection limits, and authentication.

### Example Usage

```ts
const wsServer = setupWebSocketServer(server, {
  cors: {
    enable: false,
    allowOrigins: ['http://localhost:5173']
  },
  rateLimit: {
    enable: true,
    points: 200,
    duration: 1
  },
  connectionLimit: {
    enable: true,
    maxConnections: 100
  },  
  auth: {
    enable: true,
    verify: async (connectionParams) => {
      const context = await yoga.getEnveloped().contextFactory({
        connectionParams
      });
      return !!context.jwt;
    }
  },
  graphql: {
    schema: yoga.getEnveloped().schema,
    contextFactory: yoga.getEnveloped().contextFactory,
    execute: yoga.getEnveloped().execute,
    subscribe: yoga.getEnveloped().subscribe
  }
});
```



## Authentication

### GraphQL HTTP

Include your token in the request headers like this:

```json
{
  "Authorization": "Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Ijg3......."
}
```
### WebSocket 
To authenticate your WebSocket connection, include your Bearer token in the connection parameters.  
**Do not prepend the token with `"Bearer"`** — just pass the raw token string:

```json
{
  "token": "eyJhbGciOiJSUzI1NiIsImtpZCI6Ijg3NzQ4NTAwMmYwNWJlMDI2N2VmNDU5ZjViNTEzNTMzYjVjNThjMTIiLCJ0eXAiOiJKV1Qif....."
}
```

> If you only need to perform simple tests, it's recommended to use the [Altair GraphQL Client](https://altair.sirmuel.design/) — a convenient Google Chrome extension for testing GraphQL subscriptions.


