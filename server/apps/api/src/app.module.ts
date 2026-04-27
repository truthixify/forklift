// Copyright 2025 Forklift. Apache-2.0 license.

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ChainModule } from '@forklift/chain';
import { DatabaseModule } from '@forklift/database';
import { EventsModule } from '@forklift/events';
import { IndexerModule } from './indexer/indexer.module';
import { WsGatewayModule } from './ws-gateway/ws-gateway.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    ChainModule,
    EventsModule,
    IndexerModule,
    WsGatewayModule,
  ],
})
export class AppModule {}
