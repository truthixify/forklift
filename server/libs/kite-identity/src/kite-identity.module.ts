// Copyright 2025 Forklift. Apache-2.0 license.

import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AASDKService } from './aa-sdk.service';
import { GaslessService } from './gasless.service';
import { EncryptionService } from './encryption.service';
import { AgentWalletService } from './agent-wallet.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [AASDKService, GaslessService, EncryptionService, AgentWalletService],
  exports: [AASDKService, GaslessService, EncryptionService, AgentWalletService],
})
export class KiteIdentityModule {}
