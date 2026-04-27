// Copyright 2025 Forklift. Apache-2.0 license.

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyMessage } from 'viem';
import * as jwt from 'jsonwebtoken';
import type { Session } from '@prisma/client';

import { PrismaService } from '@forklift/database';

interface TokenPayload {
  sessionId: string;
  userAddress: string;
}

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const secret = this.config.get<string>('JWT_SECRET');
    if (!secret) throw new Error('JWT_SECRET not configured');
    this.jwtSecret = secret;
  }

  async verifySignature(
    address: string,
    message: string,
    signature: string,
  ): Promise<boolean> {
    try {
      const valid = await verifyMessage({
        address: address as `0x${string}`,
        message,
        signature: signature as `0x${string}`,
      });
      return valid;
    } catch {
      this.logger.warn(`Signature verification failed for ${address}`);
      return false;
    }
  }

  async createSession(
    userAddress: string,
    deviceLabel?: string,
  ): Promise<{ token: string; session: Session }> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);

    const session = await this.prisma.session.create({
      data: {
        userAddress,
        deviceLabel: deviceLabel ?? null,
        issuedAt: now,
        expiresAt,
      },
    });

    const payload: TokenPayload = {
      sessionId: session.id,
      userAddress: session.userAddress,
    };

    const token = jwt.sign(payload, this.jwtSecret, { expiresIn: '7d' });

    this.logger.log(`Session created for ${userAddress}`);
    return { token, session };
  }

  async validateToken(
    token: string,
  ): Promise<{ userAddress: string; sessionId: string } | null> {
    let payload: TokenPayload;
    try {
      payload = jwt.verify(token, this.jwtSecret) as TokenPayload;
    } catch {
      return null;
    }

    const session = await this.prisma.session.findUnique({
      where: { id: payload.sessionId },
    });

    if (!session) return null;
    if (session.revokedAt) return null;
    if (session.expiresAt <= new Date()) return null;

    return {
      userAddress: session.userAddress,
      sessionId: session.id,
    };
  }

  async logout(sessionId: string): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });

    this.logger.log(`Session ${sessionId} revoked`);
  }

  async cleanupExpired(): Promise<number> {
    const result = await this.prisma.session.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    if (result.count > 0) {
      this.logger.log(`Cleaned up ${result.count} expired sessions`);
    }

    return result.count;
  }
}
