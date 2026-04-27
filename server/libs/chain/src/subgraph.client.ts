// Copyright 2025 Forklift. Apache-2.0 license.

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Goldsky instant subgraph uses: block_number, timestamp_, transactionHash_
export interface SubgraphEvent {
  id: string;
  bountyId: string;
  block_number: string;
  timestamp_: string;
  transactionHash_: string;
  [key: string]: unknown;
}

export interface SubgraphBountyCreated extends SubgraphEvent {
  poster: string;
  amountUSDT: string;
  feeUSDT: string;
  deliverableSchemaHash: string;
  verifierConfigHash: string;
  deliveryDeadline: string;
}

@Injectable()
export class SubgraphClient {
  private readonly logger = new Logger(SubgraphClient.name);
  private readonly url: string | undefined;

  constructor(private readonly config: ConfigService) {
    this.url = this.config.get<string>('GOLDSKY_SUBGRAPH_URL');
    if (!this.url) {
      this.logger.warn('GOLDSKY_SUBGRAPH_URL not configured');
    }
  }

  async query<T>(gql: string): Promise<T | null> {
    if (!this.url) return null;

    const response = await fetch(this.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: gql }),
    });

    if (!response.ok) {
      this.logger.error(`Subgraph query failed: ${response.status}`);
      return null;
    }

    const json = (await response.json()) as { data?: T; errors?: unknown[] };
    if (json.errors) {
      this.logger.error(`Subgraph errors: ${JSON.stringify(json.errors)}`);
    }
    return json.data ?? null;
  }

  async getRecentBountyCreateds(sinceTimestamp: number, first = 100): Promise<SubgraphBountyCreated[]> {
    const result = await this.query<{ bountyCreateds: SubgraphBountyCreated[] }>(`{
      bountyCreateds(
        first: ${first},
        orderBy: timestamp_,
        orderDirection: desc,
        where: { timestamp__gt: "${sinceTimestamp}" }
      ) {
        id
        bountyId
        poster
        amountUSDT
        feeUSDT
        deliverableSchemaHash
        verifierConfigHash
        deliveryDeadline
        block_number
        timestamp_
        transactionHash_
      }
    }`);
    return result?.bountyCreateds ?? [];
  }

  async getRecentEvents(entityName: string, sinceTimestamp: number, first = 100): Promise<SubgraphEvent[]> {
    const result = await this.query<Record<string, SubgraphEvent[]>>(`{
      ${entityName}(
        first: ${first},
        orderBy: timestamp_,
        orderDirection: desc,
        where: { timestamp__gt: "${sinceTimestamp}" }
      ) {
        id
        bountyId
        block_number
        timestamp_
        transactionHash_
      }
    }`);
    return result?.[entityName] ?? [];
  }
}
