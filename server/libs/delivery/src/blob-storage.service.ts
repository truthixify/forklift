// Copyright 2025 Forklift. Apache-2.0 license.

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createHash } from 'node:crypto';

@Injectable()
export class BlobStorageService {
  private readonly logger = new Logger(BlobStorageService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.get<string>('S3_BUCKET') ?? 'forklift-deliveries';
    this.s3 = new S3Client({
      endpoint: this.config.get<string>('S3_ENDPOINT') ?? 'http://localhost:9000',
      region: this.config.get<string>('S3_REGION') ?? 'us-east-1',
      credentials: {
        accessKeyId: this.config.get<string>('S3_ACCESS_KEY') ?? 'minioadmin',
        secretAccessKey: this.config.get<string>('S3_SECRET_KEY') ?? 'minioadmin',
      },
      forcePathStyle: true,
    });
  }

  async upload(
    key: string,
    body: Buffer,
    mimeType: string,
  ): Promise<{ storageKey: string; contentHash: string; sizeBytes: number }> {
    const contentHash = createHash('sha256').update(body).digest('hex');

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: mimeType,
      }),
    );

    this.logger.log(`Uploaded ${key} (${body.length} bytes, ${mimeType})`);

    return {
      storageKey: key,
      contentHash: `0x${contentHash}`,
      sizeBytes: body.length,
    };
  }

  async getSignedUrl(key: string, expiresInSeconds = 900): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3, command, { expiresIn: expiresInSeconds });
  }
}
