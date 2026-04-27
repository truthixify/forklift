// Copyright 2025 Forklift. Apache-2.0 license.

import { Module } from '@nestjs/common';

import { BountiesController } from './bounties.controller';
import { BrokerModule } from '../broker/broker.module';

@Module({
  imports: [BrokerModule],
  controllers: [BountiesController],
})
export class BountiesModule {}
