// Copyright 2025 Forklift. Apache-2.0 license.

import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { ParseService } from './parse.service';
import { ScoringService } from './scoring.service';
import { AssignmentService } from './assignment.service';
import { BrokerCronService } from './broker-cron.service';
import { SettlementModule } from '../settlement/settlement.module';

@Module({
  imports: [ScheduleModule.forRoot(), forwardRef(() => SettlementModule)],
  providers: [ParseService, ScoringService, AssignmentService, BrokerCronService],
  exports: [ParseService, ScoringService, AssignmentService],
})
export class BrokerModule {}
