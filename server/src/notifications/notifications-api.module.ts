// Copyright 2025 Forklift. Apache-2.0 license.

import { Module } from '@nestjs/common';

import { NotificationsApiController } from './notifications.controller';

@Module({
  controllers: [NotificationsApiController],
})
export class NotificationsApiModule {}
