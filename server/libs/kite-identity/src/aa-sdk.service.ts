// Copyright 2025 Forklift. Apache-2.0 license.

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GokiteAASDK } from 'gokite-aa-sdk';
import { Wallet } from 'ethers';

@Injectable()
export class AASDKService {
  private readonly logger = new Logger(AASDKService.name);
  private sdk: GokiteAASDK | null = null;

  constructor(private readonly config: ConfigService) {
    const rpc = this.config.get<string>('KITE_RPC') ?? 'https://rpc-testnet.gokite.ai';
    const bundlerRpc = this.config.get<string>('KITE_BUNDLER_RPC') ?? 'https://bundler-service.staging.gokite.ai/rpc/';

    try {
      this.sdk = new GokiteAASDK('kite_testnet', rpc, bundlerRpc);
      this.logger.log('Kite AA SDK initialized');
    } catch (error) {
      this.logger.warn('Failed to initialize AA SDK — gasless transactions disabled', error);
    }
  }

  getSmartAccountAddress(signerAddress: string): string | null {
    if (!this.sdk) return null;
    return this.sdk.getAccountAddress(signerAddress);
  }

  async sendUserOperation(
    signerPrivateKey: string,
    target: string,
    value: bigint,
    callData: string,
  ): Promise<string | null> {
    if (!this.sdk) {
      this.logger.warn('AA SDK not available');
      return null;
    }

    const wallet = new Wallet(signerPrivateKey);
    const signerAddress = wallet.address;

    const signFunction = async (userOpHash: string): Promise<string> => {
      return wallet.signMessage(Buffer.from(userOpHash.slice(2), 'hex'));
    };

    const request = { target, value, callData };

    const result = await this.sdk.sendUserOperationAndWait(
      signerAddress,
      request,
      signFunction,
    );

    this.logger.log(`UserOperation sent: ${JSON.stringify(result)}`);
    return typeof result === 'string' ? result : JSON.stringify(result);
  }

  async sendBatchUserOperation(
    signerPrivateKey: string,
    targets: string[],
    values: bigint[],
    callDatas: string[],
  ): Promise<string | null> {
    if (!this.sdk) {
      this.logger.warn('AA SDK not available');
      return null;
    }

    const wallet = new Wallet(signerPrivateKey);
    const signerAddress = wallet.address;

    const signFunction = async (userOpHash: string): Promise<string> => {
      return wallet.signMessage(Buffer.from(userOpHash.slice(2), 'hex'));
    };

    const request = { targets, values, callDatas };

    const result = await this.sdk.sendUserOperationAndWait(
      signerAddress,
      request,
      signFunction,
    );

    this.logger.log(`Batch UserOperation sent: ${JSON.stringify(result)}`);
    return typeof result === 'string' ? result : JSON.stringify(result);
  }
}
