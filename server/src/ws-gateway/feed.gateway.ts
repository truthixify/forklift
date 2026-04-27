// Copyright 2025 Forklift. Apache-2.0 license.

import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, WebSocket } from 'ws';

@WebSocketGateway({ path: '/ws/feed' })
export class FeedGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(FeedGateway.name);

  @WebSocketServer()
  server!: Server;

  handleConnection(_client: WebSocket) {
    this.logger.debug('Client connected to feed');
  }

  handleDisconnect(_client: WebSocket) {
    this.logger.debug('Client disconnected from feed');
  }

  broadcast(event: Record<string, unknown>) {
    const message = JSON.stringify(event);
    for (const client of this.server.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }
}
