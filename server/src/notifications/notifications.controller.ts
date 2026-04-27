// Copyright 2025 Forklift. Apache-2.0 license.

import { Controller, Get, Post, Patch, Param, Query, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { NotificationService } from '@forklift/notifications';
import { PrismaService } from '@forklift/database';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsApiController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async list(
    @Query('userAddress') userAddress: string,
    @Query('unread') unread?: string,
    @Query('limit') limit?: string,
  ) {
    const unreadOnly = unread === 'true';
    const notifications = await this.notificationService.getForUser(
      userAddress,
      unreadOnly,
      Math.min(Number(limit) || 50, 100),
    );

    const unreadCount = await this.notificationService.getUnreadCount(userAddress);

    return { notifications, unreadCount };
  }

  @Post(':id/read')
  async markRead(@Param('id') id: string) {
    await this.notificationService.markRead(Number(id));
    return { read: true };
  }

  @Post('read-all')
  async markAllRead(@Body() body: { userAddress: string }) {
    await this.notificationService.markAllRead(body.userAddress);
    return { readAll: true };
  }

  @Get('preferences')
  async getPreferences(@Query('userAddress') userAddress: string) {
    const prefs = await this.prisma.notificationPreference.findUnique({
      where: { userAddress },
    });

    return { preferences: prefs ?? { userAddress, inAppEnabled: true } };
  }

  @Patch('preferences')
  async updatePreferences(
    @Body() body: { userAddress: string; inAppEnabled?: boolean },
  ) {
    const prefs = await this.prisma.notificationPreference.upsert({
      where: { userAddress: body.userAddress },
      update: { inAppEnabled: body.inAppEnabled ?? true },
      create: { userAddress: body.userAddress, inAppEnabled: body.inAppEnabled ?? true },
    });

    return { preferences: prefs };
  }
}
