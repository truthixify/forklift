// Copyright 2025 Forklift. Apache-2.0 license.

import { Injectable, Logger } from '@nestjs/common';

import type { Template } from './template.interface';
import { logoDesignTemplate } from './definitions/logo-design';
import { socialGraphicTemplate } from './definitions/social-graphic';
import { infographicTemplate } from './definitions/infographic';
import { leadGenTemplate } from './definitions/lead-gen';
import { dataExtractionTemplate } from './definitions/data-extraction';
import { datasetLabelingTemplate } from './definitions/dataset-labeling';
import { researchBriefTemplate } from './definitions/research-brief';
import { blogPostTemplate } from './definitions/blog-post';
import { copywritingTemplate } from './definitions/copywriting';
import { ossPyBugTemplate } from './definitions/oss-py-bug';
import { ossPyDocsTemplate } from './definitions/oss-py-docs';
import { ossTsTestsTemplate } from './definitions/oss-ts-tests';
import { ossGenericTemplate } from './definitions/oss-generic';
import { transcriptionTemplate } from './definitions/transcription';
import { voiceOverTemplate } from './definitions/voice-over';

@Injectable()
export class TemplateRegistry {
  private readonly logger = new Logger(TemplateRegistry.name);
  private readonly templates = new Map<string, Template>();

  constructor() {
    [
      logoDesignTemplate, socialGraphicTemplate, infographicTemplate,
      leadGenTemplate, dataExtractionTemplate, datasetLabelingTemplate,
      researchBriefTemplate, blogPostTemplate, copywritingTemplate,
      ossPyBugTemplate, ossPyDocsTemplate, ossTsTestsTemplate, ossGenericTemplate,
      transcriptionTemplate, voiceOverTemplate,
    ].forEach((t) => this.register(t));
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
      { id: 'social-graphic', terms: ['social', 'banner', 'instagram', 'twitter', 'post graphic'] },
      { id: 'infographic', terms: ['infographic', 'data viz', 'chart', 'statistics'] },
      { id: 'lead-gen', terms: ['lead', 'contact', 'prospect', 'sales', 'b2b', 'outreach'] },
      { id: 'data-extraction', terms: ['extract', 'scrape', 'parse', 'structured data'] },
      { id: 'dataset-labeling', terms: ['label', 'classify', 'annotate', 'tag', 'categorize'] },
      { id: 'research-brief', terms: ['research', 'brief', 'report', 'analysis', 'deep dive'] },
      { id: 'blog-post', terms: ['blog', 'article', 'post', 'write', 'content'] },
      { id: 'copywriting', terms: ['copy', 'tagline', 'ad', 'marketing text', 'slogan'] },
      { id: 'oss-py-bug', terms: ['bug', 'fix', 'python', 'github', 'pull request'] },
      { id: 'oss-py-docs', terms: ['documentation', 'docs', 'python', 'readme', 'docstring'] },
      { id: 'oss-ts-tests', terms: ['test', 'typescript', 'jest', 'vitest', 'coverage'] },
      { id: 'oss-generic', terms: ['open source', 'pr', 'contribution', 'code'] },
      { id: 'transcription', terms: ['transcribe', 'transcript', 'audio', 'speech'] },
      { id: 'voice-over', terms: ['voice over', 'narration', 'tts', 'voice'] },
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
