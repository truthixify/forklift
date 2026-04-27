// Copyright 2025 Forklift. Apache-2.0 license.

import { Global, Module } from '@nestjs/common';

import { TemplateRegistry } from './registry';

@Global()
@Module({
  providers: [TemplateRegistry],
  exports: [TemplateRegistry],
})
export class TemplatesModule {}
