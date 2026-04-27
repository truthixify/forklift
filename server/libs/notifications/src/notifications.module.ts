// Copyright 2025 Forklift. Apache-2.0 license.

import { Global, Module } from '@nestjs/common';

import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';

@Global()
@Module({
  providers: [NotificationService, NotificationGateway],
  exports: [NotificationService],
})
export class NotificationsModule {}
