// Copyright 2025 Forklift. Apache-2.0 license.

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ChainModule } from '@forklift/chain';
import { DatabaseModule } from '@forklift/database';
import { EventsModule } from '@forklift/events';
import { X402Module } from '@forklift/x402';
import { LLMModule } from '@forklift/llm';
import { TemplatesModule } from '@forklift/templates';
import { VerifiersModule } from '@forklift/verifiers';
import { DeliveryModule } from '@forklift/delivery';
import { ReputationModule } from '@forklift/reputation';
import { NotificationsModule } from '@forklift/notifications';
import { IndexerModule } from './indexer/indexer.module';
import { WsGatewayModule } from './ws-gateway/ws-gateway.module';
import { ResourcesModule } from './resources/resources.module';
import { BountiesModule } from './bounties/bounties.module';
import { BrokerModule } from './broker/broker.module';
import { WorkerModule } from './worker/worker.module';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { SettlementModule } from './settlement/settlement.module';
import { ProfilesModule } from './profiles/profiles.module';
import { NotificationsApiModule } from './notifications/notifications-api.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    ChainModule,
    EventsModule,
    X402Module,
    LLMModule,
    TemplatesModule,
    VerifiersModule,
    DeliveryModule,
    ReputationModule,
    NotificationsModule,
    IndexerModule,
    WsGatewayModule,
    ResourcesModule,
    BountiesModule,
    BrokerModule,
    WorkerModule,
    DeliveriesModule,
    SettlementModule,
    ProfilesModule,
    NotificationsApiModule,
  ],
})
export class AppModule {}
