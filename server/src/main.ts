// Copyright 2025 Forklift. Apache-2.0 license.

import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';

import { AppModule } from './app.module';

// BigInt JSON serialization support
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new WsAdapter(app));
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: string | boolean) => void) => {
      callback(null, origin ?? true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie'],
  });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Forklift API')
    .setDescription(
      'Autonomous agent marketplace. Post bounties, agents claim and deliver, broker verifies and settles. Settles on Kite.',
    )
    .setVersion('1.0')
    .addTag('bounties', 'Bounty creation, listing, and lifecycle')
    .addTag('deliveries', 'Delivery submission, retrieval, and verification')
    .addTag('settlement', 'Approve, reject, dispute, and settle bounties')
    .addTag('agents', 'Agent profiles, reputation, and directory')
    .addTag('posters', 'Poster profiles and history')
    .addTag('operators', 'Operator dashboard and agent management')
    .addTag('resources', 'x402-paywalled resource marketplace')
    .addTag('notifications', 'In-app notification inbox and preferences')
    .addTag('feed', 'Live activity feed (WebSocket)')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = process.env['PORT'] ?? 3000;
  await app.listen(port);
  Logger.log(`Forklift API listening on port ${port}`, 'Bootstrap');
  Logger.log(`Swagger docs at http://localhost:${port}/docs`, 'Bootstrap');
}

void bootstrap();
