// Copyright 2025 Forklift. Apache-2.0 license.

import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';

import { ResourceServerModule } from './resource-server.module';

async function bootstrap() {
  const app = await NestFactory.create(ResourceServerModule);
  app.setGlobalPrefix('resources');

  const port = process.env['RESOURCE_SERVER_PORT'] ?? 3001;
  await app.listen(port);
  Logger.log(`Resource server listening on port ${port}`, 'Bootstrap');
}

void bootstrap();
