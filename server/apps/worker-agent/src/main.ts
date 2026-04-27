// Copyright 2025 Forklift. Apache-2.0 license.

import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';

import { WorkerAgentModule } from './worker-agent.module';

async function bootstrap() {
  const profileName = process.env['WORKER_PROFILE_NAME'];
  if (!profileName) {
    throw new Error('WORKER_PROFILE_NAME env var is required');
  }

  const app = await NestFactory.createApplicationContext(WorkerAgentModule);
  Logger.log(`Worker agent "${profileName}" started`, 'Bootstrap');
  await app.init();
}

void bootstrap();
