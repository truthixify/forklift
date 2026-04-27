// Copyright 2025 Forklift. Apache-2.0 license.

import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.ts', '!**/*.spec.ts', '!**/main.ts', '!**/index.ts'],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@forklift/chain(.*)$': '<rootDir>/libs/chain/src$1',
    '^@forklift/database(.*)$': '<rootDir>/libs/database/src$1',
    '^@forklift/events(.*)$': '<rootDir>/libs/events/src$1',
    '^@forklift/shared-types(.*)$': '<rootDir>/libs/shared-types/src$1',
    '^@forklift/scoring(.*)$': '<rootDir>/libs/scoring/src$1',
    '^@forklift/llm(.*)$': '<rootDir>/libs/llm/src$1',
    '^@forklift/templates(.*)$': '<rootDir>/libs/templates/src$1',
    '^@forklift/x402(.*)$': '<rootDir>/libs/x402/src$1',
    '^@forklift/verifiers(.*)$': '<rootDir>/libs/verifiers/src$1',
    '^@forklift/delivery(.*)$': '<rootDir>/libs/delivery/src$1',
  },
};

export default config;
