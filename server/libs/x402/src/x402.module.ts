// Copyright 2025 Forklift. Apache-2.0 license.

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { X402Client } from './x402.client';

@Module({
  imports: [ConfigModule],
  providers: [X402Client],
  exports: [X402Client],
})
export class X402Module {}
