// Copyright 2025 Forklift. Apache-2.0 license.

import { Global, Module } from '@nestjs/common';

import { VerifierRegistry } from './registry';

@Global()
@Module({
  providers: [VerifierRegistry],
  exports: [VerifierRegistry],
})
export class VerifiersModule {}
