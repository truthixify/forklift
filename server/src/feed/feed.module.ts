// Copyright 2025 Forklift. Apache-2.0 license.

import { Module } from '@nestjs/common';
import { FeedController } from './feed.controller';

@Module({ controllers: [FeedController] })
export class FeedModule {}
