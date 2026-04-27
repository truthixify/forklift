// Copyright 2025 Forklift. Apache-2.0 license.

import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';

import { BrokerAgentModule } from './broker-agent.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(BrokerAgentModule);
  Logger.log('Broker agent started', 'Bootstrap');
  await app.init();
}

void bootstrap();
