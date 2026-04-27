// Copyright 2025 Forklift. Apache-2.0 license.

import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { SubgraphClient } from './subgraph.client';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [SubgraphClient],
  exports: [SubgraphClient],
})
export class ChainModule {}
