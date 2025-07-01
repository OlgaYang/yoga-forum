import { WebSocketServer, WebSocket } from 'ws';

export function applyConnectionLimit(wsServer: WebSocketServer, maxConnections: number) {
  let currentConnections = 0;

  wsServer.options.verifyClient = (info, done) => {
    if (currentConnections >= maxConnections) {
      console.warn(`Connection limit reached: ${currentConnections}/${maxConnections}`);
      return done(false, 503, 'Too many connections');
    }
    done(true);
  };
 
  wsServer.on('connection', (ws: WebSocket) => {
    currentConnections++;

    ws.on('close', () => {
      currentConnections--;
    });
  });
}
