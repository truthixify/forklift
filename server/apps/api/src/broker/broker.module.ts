// Copyright 2025 Forklift. Apache-2.0 license.

import { Module } from '@nestjs/common';

import { ParseService } from './parse.service';
import { ScoringService } from './scoring.service';
import { AssignmentService } from './assignment.service';

@Module({
  providers: [ParseService, ScoringService, AssignmentService],
  exports: [ParseService, ScoringService, AssignmentService],
})
export class BrokerModule {}
