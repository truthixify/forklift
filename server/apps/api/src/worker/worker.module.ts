// Copyright 2025 Forklift. Apache-2.0 license.

import { Module } from '@nestjs/common';

import { ClaimService } from './claim.service';

@Module({
  providers: [ClaimService],
  exports: [ClaimService],
})
export class WorkerModule {}
