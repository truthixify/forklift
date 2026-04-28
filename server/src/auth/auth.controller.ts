// Copyright 2025 Forklift. Apache-2.0 license.

import { Controller, Post, Get, Body, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';

import { AuthService } from '@forklift/auth';
import { PrismaService } from '@forklift/database';

const nonceStore = new Map<string, { nonce: string; expiresAt: number }>();

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('nonce')
  getNonce() {
    const nonce = randomUUID();
    const id = randomUUID();
    nonceStore.set(id, { nonce, expiresAt: Date.now() + 5 * 60 * 1000 });
    return { id, nonce };
  }

  @Post('signin')
  async signIn(
    @Body() body: { address: string; message: string; signature: string; nonceId?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    if (body.nonceId) {
      const stored = nonceStore.get(body.nonceId);
      if (!stored || stored.expiresAt < Date.now()) {
        return { error: 'Nonce expired or invalid' };
      }
      if (!body.message.includes(stored.nonce)) {
        return { error: 'Nonce mismatch' };
      }
      nonceStore.delete(body.nonceId);
    }
    const valid = this.authService.verifySignature(body.address, body.message, body.signature);
    if (!valid) {
      return { error: 'Invalid signature' };
    }

    await this.prisma.user.upsert({
      where: { passportAddress: body.address },
      update: {},
      create: { passportAddress: body.address },
    });

    const { token } = await this.authService.createSession(body.address);

    res.cookie('session', token, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    });

    return { address: body.address, authenticated: true };
  }

  @Get('me')
  async getMe(@Req() req: Request) {
    const token = req.cookies?.['session'] as string | undefined;
    if (!token) return { authenticated: false };

    const session = await this.authService.validateToken(token);
    if (!session) return { authenticated: false };

    const user = await this.prisma.user.findUnique({
      where: { passportAddress: session.userAddress },
    });

    return { authenticated: true, user, sessionId: session.sessionId };
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.['session'] as string | undefined;
    if (token) {
      const session = await this.authService.validateToken(token);
      if (session) {
        await this.authService.logout(session.sessionId);
      }
    }
    res.clearCookie('session');
    return { loggedOut: true };
  }
}
