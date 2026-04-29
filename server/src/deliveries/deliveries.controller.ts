// Copyright 2025 Forklift. Apache-2.0 license.

import { Controller, Post, Get, Param, Body, Res, Logger, NotFoundException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import { DeliveryService } from '@forklift/delivery';
import { BlobStorageService } from '@forklift/delivery';
import { VerifierRegistry } from '@forklift/verifiers';
import { PrismaService } from '@forklift/database';
import { hashData } from '@forklift/chain';
import type { Prisma } from '@prisma/client';

@ApiTags('deliveries')
@Controller('deliveries')
export class DeliveriesController {
  private readonly logger = new Logger(DeliveriesController.name);

  constructor(
    private readonly deliveryService: DeliveryService,
    private readonly blobStorage: BlobStorageService,
    private readonly verifierRegistry: VerifierRegistry,
    private readonly prisma: PrismaService,
  ) {}

  @Post(':bountyId')
  async submitDelivery(
    @Param('bountyId') bountyId: string,
    @Body()
    body: {
      agentAddress: string;
      payloadKind: string;
      payload: Record<string, unknown>;
      attemptNumber?: number;
    },
  ) {
    const { hash } = await this.deliveryService.storeDelivery({
      bountyId,
      agentAddress: body.agentAddress,
      payloadKind: body.payloadKind,
      payload: body.payload,
      attemptNumber: body.attemptNumber,
    });

    const signature = await this.prisma.bountySignature.findFirst({
      where: { bountyId },
    });

    if (signature) {
      const verifierConfig = signature.verifierConfig as Record<string, unknown>;
      const verifierType = (verifierConfig['type'] as string) ?? 'llm-judge';
      const config = (verifierConfig['config'] as Record<string, unknown>) ?? {};

      this.logger.log(`Running ${verifierType} verifier for bounty ${bountyId}`);

      const result = await this.verifierRegistry.verify({
        delivery: {
          hash,
          bountyId,
          agentAddress: body.agentAddress,
          payloadKind: body.payloadKind,
          payload: body.payload,
          attemptNumber: body.attemptNumber ?? 1,
        },
        bounty: {
          bountyId,
          title: signature.title,
          description: signature.description,
          deliverableSchema: signature.deliverableSchema as Record<string, unknown>,
          verifierConfig: { type: verifierType, config },
        },
        config,
      });

      const resultHash = hashData(JSON.stringify(result));

      await this.prisma.verifierResult.create({
        data: {
          hash: resultHash,
          bountyId,
          agentAddress: body.agentAddress,
          deliveryHash: hash,
          verifierType,
          passed: result.passed,
          score: result.score ?? null,
          reasoning: result.reasoning,
          evidence: result.evidence as Prisma.InputJsonValue,
        },
      });

      this.logger.log(`Verifier ${verifierType}: ${result.passed ? 'PASS' : 'FAIL'} for ${bountyId}`);

      return { deliveryHash: hash, verifierResult: result };
    }

    return { deliveryHash: hash, verifierResult: null };
  }

  @Get(':bountyId')
  async getDelivery(@Param('bountyId') bountyId: string) {
    const delivery = await this.deliveryService.getDelivery(bountyId);
    if (!delivery) {
      return { delivery: null };
    }

    const payload = delivery.payload as Record<string, unknown>;
    let signedUrl: string | undefined;
    if (delivery.payloadKind === 'file' && payload['storageKey']) {
      signedUrl = await this.deliveryService.getSignedUrl(payload['storageKey'] as string);
    }

    const verifierResult = await this.prisma.verifierResult.findFirst({
      where: { bountyId, deliveryHash: delivery.hash },
      orderBy: { recordedAt: 'desc' },
    });

    return { delivery, signedUrl, verifierResult };
  }

  @Get(':bountyId/download')
  async downloadFile(@Param('bountyId') bountyId: string, @Res() res: Response) {
    const delivery = await this.deliveryService.getDelivery(bountyId);
    if (!delivery) throw new NotFoundException('No delivery found');

    const payload = delivery.payload as Record<string, unknown>;
    const storageKey = payload['storageKey'] as string | undefined;
    if (!storageKey) throw new NotFoundException('No file attached to this delivery');

    const { body, contentType } = await this.blobStorage.getObject(storageKey);
    const fileName = (payload['fileName'] as string) ?? 'delivery';

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': body.length,
    });
    res.send(body);
  }
}
