import { Registry, Counter, Gauge } from 'prom-client';
import { WebSocketServer, WebSocket, RawData } from 'ws';
import type { IncomingMessage } from 'http';

export function webSocketMetrics(wsServer: WebSocketServer) {
  const registry = new Registry();

  const activeConnections = new Gauge({
    name: 'ws_active_connections',
    help: 'Number of active WebSocket connections',
  });

  const disconnectTotal = new Counter({
    name: 'ws_disconnect_total',
    help: 'Total number of disconnected WebSocket connections',
  });

  const messageReceived = new Counter({
    name: 'ws_message_received_total',
    help: 'Total WebSocket messages received',
  });


  const messageSent = new Counter({
    name: 'ws_message_sent_total',
    help: 'Total WebSocket messages sent ',
  });

  const bytesReceived = new Counter({
    name: 'ws_bytes_received',
    help: 'Total bytes received from WebSocket client!',
  });

  const bytesSent = new Counter({
    name: 'ws_bytes_sent',
    help: 'Total bytes sent to WebSocket clients',
  });

  registry.registerMetric(activeConnections);
  registry.registerMetric(disconnectTotal);
  registry.registerMetric(messageReceived);
  registry.registerMetric(messageSent);
  registry.registerMetric(bytesReceived);
  registry.registerMetric(bytesSent);

  wsServer.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    activeConnections.inc();

    const originalSend: typeof ws.send = ws.send.bind(ws);
    ws.send = ((data: any, ...args: any[]) => {
      messageSent.inc();
      bytesSent.inc(getRawDataSize(data));
      return originalSend(data, ...args);
    }) as typeof ws.send;

    ws.on('close', () => {
      activeConnections.dec();
      disconnectTotal.inc();
    });

    ws.on('message', (data: RawData) => {
      messageReceived.inc();
      bytesReceived.inc(getRawDataSize(data));
    });

    function getRawDataSize(data: RawData): number {
      if (typeof data === 'string') {
        return Buffer.byteLength(data);
      }
      if (Buffer.isBuffer(data)) {
        return data.length;
      }
      if (Array.isArray(data)) {
        // fragmented message
        return data.reduce((sum, part) => sum + Buffer.byteLength(part), 0);
      }
      // For ArrayBuffer or other views
      return Buffer.byteLength(Buffer.from(data));
    }
  });

  return registry;
}