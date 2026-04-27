// Copyright 2025 Forklift. Apache-2.0 license.

import { Module } from '@nestjs/common';

import { FeedGateway } from './feed.gateway';

@Module({
  providers: [FeedGateway],
  exports: [FeedGateway],
})
export class WsGatewayModule {}
