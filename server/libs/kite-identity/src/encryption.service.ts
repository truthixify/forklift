// Copyright 2025 Forklift. Apache-2.0 license.

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;

@Injectable()
export class EncryptionService {
  private readonly masterKey: string;

  constructor(config: ConfigService) {
    this.masterKey = config.get<string>('JWT_SECRET') ?? 'default-master-key-change-me';
  }

  encrypt(plaintext: string, context: string): string {
    const salt = randomBytes(SALT_LENGTH);
    const key = scryptSync(this.masterKey + context, salt, KEY_LENGTH);
    const iv = randomBytes(IV_LENGTH);

    const cipher = createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    // Format: base64(salt + iv + tag + ciphertext)
    return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
  }

  decrypt(encoded: string, context: string): string {
    const buf = Buffer.from(encoded, 'base64');

    const salt = buf.subarray(0, SALT_LENGTH);
    const iv = buf.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = buf.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const ciphertext = buf.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

    const key = scryptSync(this.masterKey + context, salt, KEY_LENGTH);
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  }
}
