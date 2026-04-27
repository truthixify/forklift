// Copyright 2025 Forklift. Apache-2.0 license.

import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AASDKService } from './aa-sdk.service';
import { GaslessService } from './gasless.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [AASDKService, GaslessService],
  exports: [AASDKService, GaslessService],
})
export class KiteIdentityModule {}
