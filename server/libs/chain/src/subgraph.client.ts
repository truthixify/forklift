// Copyright 2025 Forklift. Apache-2.0 license.

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface SubgraphBounty {
  id: string;
  poster: string;
  amount: string;
  fee: string;
  status: number;
  createdAt: string;
  deliveryDeadline: string;
  assignedAgent: string | null;
}

@Injectable()
export class SubgraphClient {
  private readonly logger = new Logger(SubgraphClient.name);
  private readonly url: string | undefined;

  constructor(private readonly config: ConfigService) {
    this.url = this.config.get<string>('GOLDSKY_SUBGRAPH_URL');
  }

  async queryBounties(first = 100, skip = 0): Promise<SubgraphBounty[]> {
    if (!this.url) {
      this.logger.warn('GOLDSKY_SUBGRAPH_URL not configured; subgraph queries disabled');
      return [];
    }

    const query = `{
      bounties(first: ${first}, skip: ${skip}, orderBy: createdAt, orderDirection: desc) {
        id
        poster
        amount
        fee
        status
        createdAt
        deliveryDeadline
        assignedAgent
      }
    }`;

    const response = await fetch(this.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    const json = (await response.json()) as { data?: { bounties?: SubgraphBounty[] } };
    return json.data?.bounties ?? [];
  }

  async queryBountyById(bountyId: string): Promise<SubgraphBounty | null> {
    if (!this.url) {
      this.logger.warn('GOLDSKY_SUBGRAPH_URL not configured; subgraph queries disabled');
      return null;
    }

    const query = `{
      bounty(id: "${bountyId}") {
        id
        poster
        amount
        fee
        status
        createdAt
        deliveryDeadline
        assignedAgent
      }
    }`;

    const response = await fetch(this.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    const json = (await response.json()) as { data?: { bounty?: SubgraphBounty | null } };
    return json.data?.bounty ?? null;
  }
}
