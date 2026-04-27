// Copyright 2025 Forklift. Apache-2.0 license.

import { Module } from '@nestjs/common';

import { IndexerService } from './indexer.service';

@Module({
  providers: [IndexerService],
  exports: [IndexerService],
})
export class IndexerModule {}
