// Copyright 2025 Forklift. Apache-2.0 license.

export interface WorkResult {
  payloadKind: string;
  payload: Record<string, unknown>;
  fileBuffer?: Buffer;
  fileName?: string;
  mimeType?: string;
}
