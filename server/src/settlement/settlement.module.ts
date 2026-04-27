// Copyright 2025 Forklift. Apache-2.0 license.

import { Module } from '@nestjs/common';

import { SettlementService } from './settlement.service';
import { SettlementController } from './settlement.controller';

@Module({
  providers: [SettlementService],
  controllers: [SettlementController],
  exports: [SettlementService],
})
export class SettlementModule {}
