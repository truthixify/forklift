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

    const bounties = await Promise.all(
      events.map(async (ev) => {
        const bountyId = ev.bountyId ?? '';
        const sig = await this.prisma.bountySignature.findFirst({ where: { bountyId } });
        const data = ev.data as Record<string, unknown>;
        const claims = await this.prisma.proposal.count({ where: { bountyId } });

        const allEvents = await this.prisma.indexedEvent.findMany({
          where: { bountyId },
          orderBy: { indexedAt: 'desc' },
        });

        const latestEvent = allEvents[0];
        const stateMap: Record<string, string> = {
          BountyCreated: 'live', BountyAssigned: 'assigned', DeliverySubmitted: 'delivered',
          BountyPaid: 'paid', BountyRefunded: 'refunded', BountyExpired: 'expired', BountyCancelled: 'cancelled',
        };
        const state = stateMap[latestEvent?.eventName ?? ''] ?? 'live';

        const assignedEvent = allEvents.find((e) => e.eventName === 'BountyAssigned');
        const assignedData = assignedEvent?.data as Record<string, unknown> | undefined;
        const assignedAgent = (assignedData?.assignedAgent as string) ?? null;

        const delivSchema = sig?.deliverableSchema as Record<string, unknown> | null;
        const payloadDef = delivSchema?.payload as Record<string, unknown> | null;
        const kind = (payloadDef?.kind as string) ?? 'json';

        const verConfig = sig?.verifierConfig as Record<string, unknown> | null;
        const verType = (verConfig?.type as string) ?? 'llm-judge';

        const amountWei = data.amountUSDT as string | undefined;
        const amount = amountWei ? Number(BigInt(amountWei)) / 1e18 : 0;

        const shortNum = bountyId.slice(-4).toUpperCase();

        const createdAt = ev.indexedAt;
        const diffMin = Math.floor((Date.now() - createdAt.getTime()) / 60000);
        const createdAgo = diffMin < 60
          ? `${diffMin} min ago`
          : diffMin < 1440
            ? `${Math.floor(diffMin / 60)} hr ago`
            : `${Math.floor(diffMin / 1440)} day ago`;

        const deadlineTs = data.deliveryDeadline ? Number(data.deliveryDeadline) : 0;
        let deadline = '—';
        if (deadlineTs > 0) {
          const remaining = deadlineTs - Math.floor(Date.now() / 1000);
          if (remaining > 0) {
            const h = Math.floor(remaining / 3600);
            const m = Math.floor((remaining % 3600) / 60);
            const s = remaining % 60;
            deadline = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
          }
        }

        return {
          id: bountyId,
          shortId: `FL-${shortNum}`,
          title: sig?.title ?? `Bounty ${bountyId.slice(0, 10)}`,
          brief: sig?.description ?? '',
          template: sig?.templateId ?? '',
          kind,
          verifier: [verType],
          amount,
          state,
          poster: (data.poster as string) ?? '',
          agent: assignedAgent,
          claims,
          deadline,
          createdAgo,
          tags: [sig?.templateId ?? '', kind, verType].filter(Boolean),
        };
      }),
    );

    return { bounties };
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
    const raw = this.templates.getAll();
    const templates = raw.map((t) => {
      const payload = t.defaultDeliverable.payload;
      const kind = payload.kind;
      const verType = t.defaultVerifier.type;
      const minUsdt = Number(BigInt(t.suggestedAmountRangeUSDT[0])) / 1e18;
      const maxUsdt = Number(BigInt(t.suggestedAmountRangeUSDT[1])) / 1e18;

      return {
        id: t.id,
        name: t.name,
        category: t.category.toUpperCase(),
        kind,
        verifier: verType,
        price: `$${minUsdt}–${maxUsdt}`,
        deliverable: t.shortDescription,
      };
    });
    return { templates };
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
