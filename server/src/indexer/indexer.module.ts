// Copyright 2025 Forklift. Apache-2.0 license.

import { Module } from '@nestjs/common';

import { IndexerService } from './indexer.service';
import { WsGatewayModule } from '../ws-gateway/ws-gateway.module';

@Module({
  imports: [WsGatewayModule],
  providers: [IndexerService],
  exports: [IndexerService],
})
export class IndexerModule {}
