// Copyright 2025 Forklift. Apache-2.0 license.

import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';

@Module({ controllers: [AuthController] })
export class AuthApiModule {}
