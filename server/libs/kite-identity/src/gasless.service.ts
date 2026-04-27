// Copyright 2025 Forklift. Apache-2.0 license.

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Wallet, randomBytes, hexlify } from 'ethers';

interface GaslessTransferRequest {
  from: string;
  to: string;
  value: string;
  validAfter: string;
  validBefore: string;
  nonce: string;
  v: number;
  r: string;
  s: string;
}

interface GaslessTransferResponse {
  txHash: string;
}

const TRANSFER_WITH_AUTHORIZATION_TYPES = {
  TransferWithAuthorization: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'validAfter', type: 'uint256' },
    { name: 'validBefore', type: 'uint256' },
    { name: 'nonce', type: 'bytes32' },
  ],
};

@Injectable()
export class GaslessService {
  private readonly logger = new Logger(GaslessService.name);
  private readonly gaslessEndpoint: string;
  private readonly usdtAddress: string;
  private readonly chainId: number;

  constructor(private readonly config: ConfigService) {
    this.gaslessEndpoint = this.config.get<string>('KITE_GASLESS_ENDPOINT') ?? 'https://gasless.gokite.ai';
    this.usdtAddress = this.config.get<string>('KITE_USDT_ADDRESS') ?? '0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63';
    this.chainId = Number(this.config.get<string>('KITE_CHAIN_ID') ?? '2368');
  }

  async transferUSDTGasless(
    signerPrivateKey: string,
    to: string,
    amountWei: string,
  ): Promise<string | null> {
    const wallet = new Wallet(signerPrivateKey);
    const from = wallet.address;
    const nonce = hexlify(randomBytes(32));
    const now = Math.floor(Date.now() / 1000);
    const validAfter = (now - 60).toString();
    const validBefore = (now + 3600).toString();

    const domain = {
      name: 'USDT',
      version: '1',
      chainId: this.chainId,
      verifyingContract: this.usdtAddress,
    };

    const message = {
      from,
      to,
      value: amountWei,
      validAfter,
      validBefore,
      nonce,
    };

    const signature = await wallet.signTypedData(
      domain,
      TRANSFER_WITH_AUTHORIZATION_TYPES,
      message,
    );

    const r = '0x' + signature.slice(2, 66);
    const s = '0x' + signature.slice(66, 130);
    const v = parseInt(signature.slice(130, 132), 16);

    const request: GaslessTransferRequest = {
      from,
      to,
      value: amountWei,
      validAfter,
      validBefore,
      nonce,
      v,
      r,
      s,
    };

    try {
      const response = await fetch(this.gaslessEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Gasless transfer failed: ${response.status} ${errorText}`);
        return null;
      }

      const result = (await response.json()) as GaslessTransferResponse;
      this.logger.log(`Gasless USDT transfer: ${result.txHash}`);
      return result.txHash;
    } catch (error) {
      this.logger.error('Gasless transfer request failed', error);
      return null;
    }
  }
}
