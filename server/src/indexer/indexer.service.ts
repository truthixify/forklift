// Copyright 2025 Forklift. Apache-2.0 license.

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '@forklift/database';
import { SubgraphClient } from '@forklift/chain';
import { NotificationService } from '@forklift/notifications';
import { FeedGateway } from '../ws-gateway/feed.gateway';

@Injectable()
export class IndexerService implements OnModuleInit {
  private readonly logger = new Logger(IndexerService.name);
  private lastPolledTimestamp = 0;

  constructor(
    private readonly prisma: PrismaService,
    private readonly subgraph: SubgraphClient,
    private readonly feedGateway: FeedGateway,
    private readonly notifications: NotificationService,
  ) {}

  onModuleInit() {
    this.lastPolledTimestamp = Math.floor(Date.now() / 1000) - 3600;
    this.logger.log('Indexer started — polling subgraph for events');
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async pollSubgraph() {
    const events = await this.subgraph.getRecentBountyCreateds(this.lastPolledTimestamp);

    for (const event of events) {
      const ts = Number(event.timestamp_);
      if (ts > this.lastPolledTimestamp) {
        this.lastPolledTimestamp = ts;
      }

      try {
        await this.prisma.indexedEvent.upsert({
          where: {
            transactionHash_logIndex: {
              transactionHash: event.transactionHash_,
              logIndex: 0,
            },
          },
          update: {},
          create: {
            eventName: 'BountyCreated',
            bountyId: event.bountyId,
            blockNumber: BigInt(event.block_number),
            transactionHash: event.transactionHash_,
            logIndex: 0,
            data: {
              poster: event.poster,
              amountUSDT: event.amountUSDT,
              feeUSDT: event.feeUSDT,
              deliveryDeadline: event.deliveryDeadline,
            } as Prisma.InputJsonValue,
          },
        });

        this.feedGateway.broadcast({
          type: 'BountyCreated',
          bountyId: event.bountyId,
          data: {
            poster: event.poster,
            amountUSDT: event.amountUSDT,
            feeUSDT: event.feeUSDT,
            deliveryDeadline: event.deliveryDeadline,
          },
          blockNumber: event.block_number,
          transactionHash: event.transactionHash_,
          timestamp: Date.now(),
        });

        this.logger.debug(`Indexed BountyCreated ${event.bountyId} from subgraph`);

        const poster = event.poster;
        if (poster) {
          const amtUsdt = Number(BigInt(event.amountUSDT)) / 1e18;
          await this.notifications.notify({
            userAddress: poster,
            category: 'bounty.live',
            title: 'Bounty posted',
            body: `Your bounty is live on the board (${amtUsdt.toFixed(2)} USDT).`,
            payload: { bountyId: event.bountyId, amount: amtUsdt },
            ctaLabel: 'View bounty',
            ctaHref: `/dashboard/poster/bounties?id=${event.bountyId}`,
          });
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('Unique constraint')) {
          continue;
        }
        this.logger.error(`Failed to index event ${event.bountyId}`, error);
      }
    }
  }
}
