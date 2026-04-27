// Copyright 2025 Forklift. Apache-2.0 license.

import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, WebSocket } from 'ws';

interface AuthenticatedSocket extends WebSocket {
  userAddress?: string;
}

@WebSocketGateway({ path: '/ws/notifications' })
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(NotificationGateway.name);
  private readonly userSockets = new Map<string, Set<AuthenticatedSocket>>();

  @WebSocketServer()
  server!: Server;

  handleConnection(client: AuthenticatedSocket) {
    client.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString()) as { type?: string; userAddress?: string };
        if (msg.type === 'auth' && msg.userAddress) {
          client.userAddress = msg.userAddress;
          const existing = this.userSockets.get(msg.userAddress) ?? new Set();
          existing.add(client);
          this.userSockets.set(msg.userAddress, existing);
          this.logger.debug(`Notification client authenticated: ${msg.userAddress}`);
        }
      } catch {
        // Ignore non-JSON messages
      }
    });
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userAddress) {
      const sockets = this.userSockets.get(client.userAddress);
      if (sockets) {
        sockets.delete(client);
        if (sockets.size === 0) {
          this.userSockets.delete(client.userAddress);
        }
      }
    }
  }

  pushToUser(userAddress: string, event: Record<string, unknown>) {
    const sockets = this.userSockets.get(userAddress);
    if (!sockets) return;

    const message = JSON.stringify(event);
    for (const socket of sockets) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(message);
      }
    }
  }
}
