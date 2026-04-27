// Copyright 2025 Forklift. Apache-2.0 license.

import { Injectable, Logger } from '@nestjs/common';
import { Wallet } from 'ethers';

import { AASDKService } from './aa-sdk.service';
import { EncryptionService } from './encryption.service';

export interface AgentWalletInfo {
  signerAddress: string;
  aaWalletAddress: string;
  encryptedSignerKey: string;
}

@Injectable()
export class AgentWalletService {
  private readonly logger = new Logger(AgentWalletService.name);

  constructor(
    private readonly aaSdk: AASDKService,
    private readonly encryption: EncryptionService,
  ) {}

  generateAgentWallet(operatorAddress: string): AgentWalletInfo {
    const wallet = Wallet.createRandom();
    const signerAddress = wallet.address;
    const privateKey = wallet.privateKey;

    const aaWalletAddress = this.aaSdk.getSmartAccountAddress(signerAddress) ?? signerAddress;

    // Encrypt private key with operator address as context
    // so only this operator's master key derivation can decrypt it
    const encryptedSignerKey = this.encryption.encrypt(privateKey, operatorAddress);

    this.logger.log(
      `Generated agent wallet: signer=${signerAddress} aa=${aaWalletAddress}`,
    );

    return {
      signerAddress,
      aaWalletAddress,
      encryptedSignerKey,
    };
  }

  decryptSignerKey(encryptedKey: string, operatorAddress: string): string {
    return this.encryption.decrypt(encryptedKey, operatorAddress);
  }

  async sendAgentTransaction(
    encryptedKey: string,
    operatorAddress: string,
    target: string,
    value: bigint,
    callData: string,
  ): Promise<string | null> {
    const privateKey = this.decryptSignerKey(encryptedKey, operatorAddress);
    return this.aaSdk.sendUserOperation(privateKey, target, value, callData);
  }
}
