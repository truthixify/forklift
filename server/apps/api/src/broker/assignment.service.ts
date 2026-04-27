// Copyright 2025 Forklift. Apache-2.0 license.

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '@forklift/database';
import {
  createBrokerWalletClient,
  signAssign,
  hashData,
  getBountyEscrowContract,
  createKitePublicClient,
} from '@forklift/chain';
import type { ScoredCandidate } from './scoring.service';

@Injectable()
export class AssignmentService {
  private readonly logger = new Logger(AssignmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async assignBounty(
    bountyId: `0x${string}`,
    scoredCandidates: ScoredCandidate[],
  ): Promise<{ assignedAgent: string; waitlist: string[]; scoringHash: string }> {
    if (scoredCandidates.length === 0) {
      throw new Error('No candidates to assign');
    }

    const winner = scoredCandidates[0]!;
    const waitlist = scoredCandidates.slice(1).map((c) => c.agentAddress);

    const scoringTrace = {
      version: '1.0',
      bountyId,
      scoredAt: Date.now(),
      candidates: scoredCandidates,
      decision: {
        assigned: winner.agentAddress,
        waitlist,
      },
    };

    const scoringHash = hashData(JSON.stringify(scoringTrace));

    await this.prisma.scoringTrace.create({
      data: {
        hash: scoringHash,
        bountyId,
        traceJson: scoringTrace,
      },
    });

    const brokerKey = this.config.get<string>('BROKER_PRIVATE_KEY');
    const escrowAddress = this.config.get<string>('BOUNTY_ESCROW_ADDRESS');

    if (brokerKey && escrowAddress) {
      const walletClient = createBrokerWalletClient(brokerKey as `0x${string}`);
      const signature = await signAssign(
        walletClient,
        escrowAddress as `0x${string}`,
        bountyId,
        winner.agentAddress as `0x${string}`,
        scoringHash as `0x${string}`,
      );

      try {
        const publicClient = createKitePublicClient();
        const contract = getBountyEscrowContract(
          escrowAddress as `0x${string}`,
          publicClient,
          walletClient,
        );

        const txHash = await contract.write.assign([
          bountyId,
          winner.agentAddress as `0x${string}`,
          waitlist as `0x${string}`[],
          scoringHash as `0x${string}`,
          signature,
        ]);

        this.logger.log(`Assignment tx submitted: ${txHash}`);
      } catch (error) {
        this.logger.error('On-chain assignment failed', error);
      }
    } else {
      this.logger.warn('BROKER_PRIVATE_KEY or BOUNTY_ESCROW_ADDRESS not set; skipping on-chain assignment');
    }

    return {
      assignedAgent: winner.agentAddress,
      waitlist,
      scoringHash,
    };
  }
}
