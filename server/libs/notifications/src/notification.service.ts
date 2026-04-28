// Copyright 2025 Forklift. Apache-2.0 license.

import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '@forklift/database';
import type { NotifyArgs } from './notification.types';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationGateway,
  ) {}

  async notify(args: NotifyArgs): Promise<void> {
    const normalizedAddress = args.userAddress.toLowerCase();
    const notification = await this.prisma.notification.create({
      data: {
        userAddress: normalizedAddress,
        category: args.category,
        title: args.title,
        body: args.body,
        payload: (args.payload ?? {}) as Prisma.InputJsonValue,
        ctaLabel: args.ctaLabel,
        ctaHref: args.ctaHref,
      },
    });

    this.gateway.pushToUser(normalizedAddress, {
      id: notification.id,
      category: args.category,
      title: args.title,
      body: args.body,
      payload: args.payload ?? {},
      ctaLabel: args.ctaLabel,
      ctaHref: args.ctaHref,
      createdAt: notification.createdAt.toISOString(),
    });

    this.logger.debug(`Notification sent to ${args.userAddress}: ${args.category}`);
  }

  async getForUser(userAddress: string, unreadOnly: boolean, limit: number) {
    return this.prisma.notification.findMany({
      where: {
        userAddress: userAddress.toLowerCase(),
        ...(unreadOnly ? { unread: true } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async markRead(notificationId: number) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { unread: false, readAt: new Date() },
    });
  }

  async markAllRead(userAddress: string) {
    return this.prisma.notification.updateMany({
      where: { userAddress: userAddress.toLowerCase(), unread: true },
      data: { unread: false, readAt: new Date() },
    });
  }

  async getUnreadCount(userAddress: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userAddress: userAddress.toLowerCase(), unread: true },
    });
  }
}
