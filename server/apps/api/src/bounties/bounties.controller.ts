// Copyright 2025 Forklift. Apache-2.0 license.

import { Controller, Post, Get, Body, Param, Query, Logger } from '@nestjs/common';
import { IsString, IsOptional, MinLength } from 'class-validator';

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
        deliverableSchema: body.deliverableSchema,
        verifierConfig: body.verifierConfig,
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
    @Query('status') status?: string,
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
}
