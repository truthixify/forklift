// Copyright 2025 Forklift. Apache-2.0 license.

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { PublicClient, Transport, Chain, WatchContractEventReturnType } from 'viem';

import { PrismaService } from '@forklift/database';
import {
  createKiteWsClient,
  createKitePublicClient,
  BOUNTY_ESCROW_ABI,
  parseEscrowLog,
  type ParsedEscrowEvent,
} from '@forklift/chain';
import { FeedGateway } from '../ws-gateway/feed.gateway';

@Injectable()
export class IndexerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IndexerService.name);
  private unwatch: WatchContractEventReturnType | undefined;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly feedGateway: FeedGateway,
  ) {}

  onModuleInit() {
    const escrowAddress = this.config.get<string>('BOUNTY_ESCROW_ADDRESS');
    if (!escrowAddress) {
      this.logger.warn('BOUNTY_ESCROW_ADDRESS not set; indexer disabled');
      return;
    }

    this.startWatching(escrowAddress as `0x${string}`);
  }

  onModuleDestroy() {
    this.unwatch?.();
  }

  private startWatching(address: `0x${string}`) {
    let client: PublicClient<Transport, Chain>;

    try {
      client = createKiteWsClient();
    } catch {
      this.logger.warn('WebSocket connection failed; falling back to HTTP polling');
      client = createKitePublicClient();
    }

    this.unwatch = client.watchContractEvent({
      address,
      abi: BOUNTY_ESCROW_ABI,
      onLogs: (logs) => {
        for (const log of logs) {
          const parsed = parseEscrowLog(log);
          if (parsed) {
            void this.handleEvent(parsed);
          }
        }
      },
      onError: (error) => {
        this.logger.error('Event watcher error', error);
      },
    });

    this.logger.log(`Watching BountyEscrow events at ${address}`);
  }

  private async handleEvent(event: ParsedEscrowEvent) {
    const bountyId = (event.args as Record<string, unknown>)['bountyId'] as string | undefined;

    try {
      await this.prisma.indexedEvent.upsert({
        where: {
          transactionHash_logIndex: {
            transactionHash: event.transactionHash,
            logIndex: event.logIndex,
          },
        },
        update: {},
        create: {
          eventName: event.eventName,
          bountyId: bountyId ?? null,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          logIndex: event.logIndex,
          data: this.serializeArgs(event.args),
        },
      });

      this.feedGateway.broadcast({
        type: event.eventName,
        bountyId,
        data: this.serializeArgs(event.args),
        blockNumber: event.blockNumber.toString(),
        transactionHash: event.transactionHash,
        timestamp: Date.now(),
      });

      this.logger.debug(`Indexed ${event.eventName} at block ${event.blockNumber}`);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        this.logger.debug(`Duplicate event skipped: ${event.eventName} tx=${event.transactionHash}`);
        return;
      }
      this.logger.error(`Failed to index ${event.eventName}`, error);
    }
  }

  private serializeArgs(args: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(args)) {
      if (typeof value === 'bigint') {
        result[key] = value.toString();
      } else if (Array.isArray(value)) {
        result[key] = value.map(v => typeof v === 'bigint' ? v.toString() : v);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      error instanceof Error &&
      error.message.includes('Unique constraint failed')
    );
  }
}
