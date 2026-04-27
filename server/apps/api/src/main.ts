// Copyright 2025 Forklift. Apache-2.0 license.

import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
import { Logger } from '@nestjs/common';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new WsAdapter(app));
  app.setGlobalPrefix('api');
  app.enableCors();

  const port = process.env['PORT'] ?? 3000;
  await app.listen(port);
  Logger.log(`Forklift API listening on port ${port}`, 'Bootstrap');
}

void bootstrap();
