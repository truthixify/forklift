// Copyright 2025 Forklift. Apache-2.0 license.

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';

@Injectable()
export class GitHubService {
  private readonly logger = new Logger(GitHubService.name);
  private readonly appId: string | undefined;
  private readonly privateKey: string | undefined;

  constructor(private readonly config: ConfigService) {
    this.appId = this.config.get<string>('GITHUB_APP_ID');
    this.privateKey = this.config.get<string>('GITHUB_APP_PRIVATE_KEY');

    if (!this.appId || !this.privateKey) {
      this.logger.warn('GITHUB_APP_ID or GITHUB_APP_PRIVATE_KEY not set — GitHub features disabled');
    }
  }

  async getInstallationClient(owner: string, repo: string): Promise<Octokit | null> {
    if (!this.appId || !this.privateKey) return null;

    const appOctokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: this.appId,
        privateKey: this.privateKey,
      },
    });

    const { data: installation } = await appOctokit.apps.getRepoInstallation({ owner, repo });

    const installationOctokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: this.appId,
        privateKey: this.privateKey,
        installationId: installation.id,
      },
    });

    return installationOctokit;
  }

  async checkPRMerged(owner: string, repo: string, prNumber: number): Promise<{
    merged: boolean;
    baseBranch: string;
    title: string;
  }> {
    const client = await this.getInstallationClient(owner, repo);
    if (!client) {
      this.logger.warn('No GitHub client available — cannot check PR merge status');
      return { merged: false, baseBranch: '', title: '' };
    }

    const { data: pr } = await client.pulls.get({ owner, repo, pull_number: prNumber });

    return {
      merged: pr.merged,
      baseBranch: pr.base.ref,
      title: pr.title,
    };
  }

  async createPR(args: {
    owner: string;
    repo: string;
    title: string;
    body: string;
    head: string;
    base: string;
    labels?: string[];
  }): Promise<{ prNumber: number; prUrl: string } | null> {
    const client = await this.getInstallationClient(args.owner, args.repo);
    if (!client) return null;

    const { data: pr } = await client.pulls.create({
      owner: args.owner,
      repo: args.repo,
      title: args.title,
      body: args.body,
      head: args.head,
      base: args.base,
    });

    if (args.labels && args.labels.length > 0) {
      await client.issues.addLabels({
        owner: args.owner,
        repo: args.repo,
        issue_number: pr.number,
        labels: args.labels,
      });
    }

    return { prNumber: pr.number, prUrl: pr.html_url };
  }
}
