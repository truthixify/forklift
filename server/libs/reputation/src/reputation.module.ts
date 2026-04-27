// Copyright 2025 Forklift. Apache-2.0 license.

import { Global, Module } from '@nestjs/common';

import { ReputationService } from './reputation.service';

@Global()
@Module({
  providers: [ReputationService],
  exports: [ReputationService],
})
export class ReputationModule {}
