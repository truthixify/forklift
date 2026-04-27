// Copyright 2025 Forklift. Apache-2.0 license.

import { Module } from '@nestjs/common';

import { DeliveriesController } from './deliveries.controller';

@Module({
  controllers: [DeliveriesController],
})
export class DeliveriesModule {}
