// Copyright 2025 Forklift. Apache-2.0 license.

import { Controller, Post, Get, Body, Param, Query, Logger } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength } from 'class-validator';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '@forklift/database';
import { hashData } from '@forklift/chain';
import { ParseService } from '../broker/parse.service';
import { TemplateRegistry } from '@forklift/templates';

class CreateDraftDto {
  @IsString()
  @MinLength(10)
  brief!: string;

  @IsString()
  @IsOptional()
  templateHint?: string;
}

@ApiTags('bounties')
@Controller('bounties')
export class BountiesController {
  private readonly logger = new Logger(BountiesController.name);

  constructor(
    private readonly parseService: ParseService,
    private readonly prisma: PrismaService,
    private readonly templates: TemplateRegistry,
  ) {}

  @Post('draft')
  async createDraft(@Body() dto: CreateDraftDto) {
    this.logger.log(`Parsing brief: "${dto.brief.slice(0, 80)}..."`);
    const draft = await this.parseService.parse(dto.brief, dto.templateHint);
    return { draft };
  }

  @Post()
  async confirmBounty(
    @Body()
    body: {
      bountyId: string;
      brief: string;
      title: string;
      description: string;
      deliverableSchema: Record<string, unknown>;
      verifierConfig: Record<string, unknown>;
      templateId?: string;
      parsedByProvider?: string;
      parsedByModel?: string;
    },
  ) {
    const hash = hashData(JSON.stringify(body));

    const signature = await this.prisma.bountySignature.create({
      data: {
        hash,
        bountyId: body.bountyId,
        title: body.title,
        description: body.description,
        brief: body.brief,
        deliverableSchema: body.deliverableSchema as Prisma.InputJsonValue,
        verifierConfig: body.verifierConfig as Prisma.InputJsonValue,
        templateId: body.templateId,
        parsedByProvider: body.parsedByProvider,
        parsedByModel: body.parsedByModel,
      },
    });

    this.logger.log(`Bounty signature stored: ${hash}`);
    return { hash: signature.hash, bountyId: body.bountyId };
  }

  @Get()
  async listBounties(
    @Query('status') _status?: string,
    @Query('template') template?: string,
    @Query('limit') limit?: string,
  ) {
    const events = await this.prisma.indexedEvent.findMany({
      where: {
        eventName: 'BountyCreated',
        ...(template ? { data: { path: ['templateId'], equals: template } } : {}),
      },
      orderBy: { indexedAt: 'desc' },
      take: Math.min(Number(limit) || 50, 100),
    });

    return { bounties: events };
  }

  @Get(':id')
  async getBounty(@Param('id') id: string) {
    const signature = await this.prisma.bountySignature.findFirst({
      where: { bountyId: id },
    });

    const events = await this.prisma.indexedEvent.findMany({
      where: { bountyId: id },
      orderBy: { indexedAt: 'asc' },
    });

    return { signature, events };
  }

  @Get('templates/list')
  getTemplates() {
    return { templates: this.templates.getAll() };
  }

  @Post(':id/cancel')
  async cancelBounty(
    @Param('id') id: string,
    @Body() _body: { posterAddress: string },
  ) {
    const claims = await this.prisma.proposal.count({ where: { bountyId: id } });

    if (claims === 0) {
      return { cancelled: true, mode: 'free', bountyId: id };
    }

    return { cancelled: false, mode: 'requires-platform-approval', bountyId: id, claimCount: claims };
  }

  @Get(':id/state')
  async getBountyState(@Param('id') id: string) {
    const events = await this.prisma.indexedEvent.findMany({
      where: { bountyId: id },
      orderBy: { indexedAt: 'desc' },
      take: 1,
    });

    const latestEvent = events[0]?.eventName ?? 'unknown';
    const stateMap: Record<string, string> = {
      BountyCreated: 'open',
      BountyAssigned: 'assigned',
      DeliverySubmitted: 'delivered',
      BountyPaid: 'paid',
      BountyRefunded: 'refunded',
      BountyExpired: 'expired',
      BountyCancelled: 'cancelled',
    };

    return { bountyId: id, state: stateMap[latestEvent] ?? 'unknown', lastEvent: latestEvent };
  }
}
