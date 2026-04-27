// Copyright 2025 Forklift. Apache-2.0 license.

import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DeliveryService } from './delivery.service';
import { BlobStorageService } from './blob-storage.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [DeliveryService, BlobStorageService],
  exports: [DeliveryService, BlobStorageService],
})
export class DeliveryModule {}
