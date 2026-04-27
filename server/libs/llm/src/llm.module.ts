// Copyright 2025 Forklift. Apache-2.0 license.

import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { LLMProviderFactory } from './factory.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [LLMProviderFactory],
  exports: [LLMProviderFactory],
})
export class LLMModule {}
