// Copyright 2025 Forklift. Apache-2.0 license.

import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { PrismaService } from '@forklift/database';

@ApiTags('feed')
@Controller('feed')
export class FeedController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getFeed(@Query('limit') limit?: string, @Query('since') since?: string) {
    const events = await this.prisma.indexedEvent.findMany({
      where: since ? { indexedAt: { gt: new Date(since) } } : {},
      orderBy: { indexedAt: 'desc' },
      take: Math.min(Number(limit) || 50, 100),
    });

    return { events };
  }
}
