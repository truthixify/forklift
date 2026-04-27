// Copyright 2025 Forklift. Apache-2.0 license.

import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'node:crypto';

import { PrismaService } from '@forklift/database';
import { BlobStorageService } from './blob-storage.service';

interface StoreDeliveryArgs {
  bountyId: string;
  agentAddress: string;
  payloadKind: string;
  payload: Record<string, unknown>;
  fileBuffer?: Buffer;
  fileName?: string;
  mimeType?: string;
  attemptNumber?: number;
}

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly blobStorage: BlobStorageService,
  ) {}

  async storeDelivery(args: StoreDeliveryArgs): Promise<{ hash: string }> {
    let payload = args.payload;

    if (args.payloadKind === 'file' && args.fileBuffer) {
      const key = `deliveries/${args.bountyId}/${args.agentAddress}/${args.attemptNumber ?? 1}/${args.fileName ?? 'delivery'}`;
      const uploadResult = await this.blobStorage.upload(
        key,
        args.fileBuffer,
        args.mimeType ?? 'application/octet-stream',
      );

      payload = {
        kind: 'file',
        storageKey: uploadResult.storageKey,
        contentHash: uploadResult.contentHash,
        mimeType: args.mimeType,
        sizeBytes: uploadResult.sizeBytes,
        fileName: args.fileName,
      };
    }

    const hashInput = JSON.stringify({
      bountyId: args.bountyId,
      agent: args.agentAddress,
      payload,
      attempt: args.attemptNumber ?? 1,
    });
    const hash = `0x${createHash('sha256').update(hashInput).digest('hex')}`;

    await this.prisma.delivery.create({
      data: {
        hash,
        bountyId: args.bountyId,
        agentAddress: args.agentAddress,
        payloadKind: args.payloadKind,
        payload,
        attemptNumber: args.attemptNumber ?? 1,
      },
    });

    this.logger.log(`Delivery stored: ${hash} for bounty ${args.bountyId}`);
    return { hash };
  }

  async getDelivery(bountyId: string) {
    return this.prisma.delivery.findFirst({
      where: { bountyId },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async getSignedUrl(storageKey: string): Promise<string> {
    return this.blobStorage.getSignedUrl(storageKey);
  }
}
