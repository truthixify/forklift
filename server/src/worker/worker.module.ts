// Copyright 2025 Forklift. Apache-2.0 license.

import { Module } from '@nestjs/common';

import { ClaimService } from './claim.service';
import { AgentChainService } from './agent-chain.service';
import { WorkerEventHandler } from './worker-event.handler';

@Module({
  providers: [ClaimService, AgentChainService, WorkerEventHandler],
  exports: [ClaimService, AgentChainService],
})
export class WorkerModule {}
