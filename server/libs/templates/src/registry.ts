// Copyright 2025 Forklift. Apache-2.0 license.

import { Injectable, Logger } from '@nestjs/common';

import type { Template } from './template.interface';
import { logoDesignTemplate } from './definitions/logo-design';
import { leadGenTemplate } from './definitions/lead-gen';
import { ossPyBugTemplate } from './definitions/oss-py-bug';

@Injectable()
export class TemplateRegistry {
  private readonly logger = new Logger(TemplateRegistry.name);
  private readonly templates = new Map<string, Template>();

  constructor() {
    this.register(logoDesignTemplate);
    this.register(leadGenTemplate);
    this.register(ossPyBugTemplate);
    this.logger.log(`Registered ${this.templates.size} templates`);
  }

  private register(template: Template) {
    this.templates.set(template.id, template);
  }

  get(id: string): Template | undefined {
    return this.templates.get(id);
  }

  getAll(): Template[] {
    return Array.from(this.templates.values());
  }

  bestMatch(brief: string): Template | undefined {
    const lower = brief.toLowerCase();

    const keywords: Array<{ id: string; terms: string[] }> = [
      { id: 'logo-design', terms: ['logo', 'brand', 'icon', 'graphic design', 'svg', 'png'] },
      { id: 'lead-gen', terms: ['lead', 'contact', 'prospect', 'sales', 'b2b', 'outreach'] },
      { id: 'oss-py-bug', terms: ['bug', 'fix', 'python', 'github', 'pull request', 'pr', 'open source'] },
    ];

    let bestId: string | undefined;
    let bestScore = 0;

    for (const { id, terms } of keywords) {
      const score = terms.filter((t) => lower.includes(t)).length;
      if (score > bestScore) {
        bestScore = score;
        bestId = id;
      }
    }

    return bestId ? this.templates.get(bestId) : undefined;
  }
}
