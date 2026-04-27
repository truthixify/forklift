// Copyright 2025 Forklift. Apache-2.0 license.

import { Module } from '@nestjs/common';

import { OperatorsController } from './operators.controller';

@Module({
  controllers: [OperatorsController],
})
export class OperatorsModule {}
