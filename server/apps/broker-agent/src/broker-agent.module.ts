// Copyright 2025 Forklift. Apache-2.0 license.

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
})
export class BrokerAgentModule {}
