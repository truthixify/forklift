// Copyright 2025 Forklift. Apache-2.0 license.

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ChainModule } from '@forklift/chain';
import { DatabaseModule } from '@forklift/database';
import { EventsModule } from '@forklift/events';
import { X402Module } from '@forklift/x402';
import { IndexerModule } from './indexer/indexer.module';
import { WsGatewayModule } from './ws-gateway/ws-gateway.module';
import { ResourcesModule } from './resources/resources.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    ChainModule,
    EventsModule,
    X402Module,
    IndexerModule,
    WsGatewayModule,
    ResourcesModule,
  ],
})
export class AppModule {}
