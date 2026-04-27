// Copyright 2025 Forklift. Apache-2.0 license.

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ResourcesController } from './resources.controller';

@Module({
  imports: [ConfigModule],
  controllers: [ResourcesController],
})
export class ResourcesModule {}
