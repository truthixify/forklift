// Copyright 2025 Forklift. Apache-2.0 license.

import { Logger } from '@nestjs/common';
import { z } from 'zod';
import type { LLMClient } from '@forklift/llm';
import type { BountyWorkContext } from './dispatch';
import type { WorkResult } from './work-result';

const logger = new Logger('WorkHandler:file');

const DesignSchema = z.object({
  svgCode: z.string(),
  designNotes: z.string(),
  colorPalette: z.array(z.string()),
  conceptDescription: z.string(),
});

function buildDesignPrompt(ctx: BountyWorkContext, type: string): string {
  return `You are a professional graphic designer. Create a ${type} as SVG code.

BOUNTY: ${ctx.title}
BRIEF: ${ctx.description}

Design requirements:
- Create a complete, valid SVG that looks professional
- Use a cohesive color palette (3-5 colors)
- The SVG should be 512x512 viewBox for logos, 1200x630 for social graphics, 800x1200 for infographics
- Use modern, clean design with geometric shapes, gradients, and typography
- Include the brand name or text mentioned in the brief
- Make it visually striking and professional

Return a JSON object with:
- svgCode: the complete SVG markup (must be valid XML, starting with <svg)
- designNotes: explanation of design choices
- colorPalette: array of hex colors used
- conceptDescription: one paragraph describing the design concept`;
}

function buildVoiceOverPrompt(ctx: BountyWorkContext): string {
  return `You are a professional voice-over script writer. Write a voice-over script for the following bounty.

BOUNTY: ${ctx.title}
BRIEF: ${ctx.description}

Write a natural, engaging script with timing annotations. The script should be ready to record.

Return a JSON object with:
- script: the full voice-over script text
- duration: estimated duration in seconds
- tone: description of the vocal tone
- directions: array of performance directions`;
}

export async function handleFileWork(ctx: BountyWorkContext, llm: LLMClient): Promise<WorkResult> {
  const isDesign = ['logo-design', 'social-graphic', 'infographic'].includes(ctx.templateId ?? '');
  const isVoiceOver = ctx.templateId === 'voice-over';

  if (isDesign) {
    const type = ctx.templateId === 'logo-design' ? 'logo' : ctx.templateId === 'social-graphic' ? 'social media graphic' : 'infographic';
    logger.log(`Generating ${type} SVG for: ${ctx.title.slice(0, 60)}`);

    const result = await llm.generateStructured({
      prompt: buildDesignPrompt(ctx, type),
      schema: DesignSchema,
      timeout: 120_000,
    });

    let svg = result.svgCode;
    if (!svg.startsWith('<svg')) {
      const match = svg.match(/<svg[\s\S]*<\/svg>/);
      if (match) svg = match[0];
    }

    const svgBuffer = Buffer.from(svg, 'utf-8');
    const fileName = `${(ctx.templateId ?? 'design').replace(/[^a-z0-9-]/g, '-')}-${ctx.bountyId.slice(2, 10)}.svg`;

    return {
      payloadKind: 'file',
      payload: {
        designNotes: result.designNotes,
        colorPalette: result.colorPalette,
        conceptDescription: result.conceptDescription,
        generatedBy: `${llm.provider}/${llm.model}`,
        templateId: ctx.templateId,
      },
      fileBuffer: svgBuffer,
      fileName,
      mimeType: 'image/svg+xml',
    };
  }

  if (isVoiceOver) {
    logger.log(`Generating voice-over script for: ${ctx.title.slice(0, 60)}`);
    const VoiceOverSchema = z.object({
      script: z.string(),
      duration: z.number(),
      tone: z.string(),
      directions: z.array(z.string()),
    });

    const result = await llm.generateStructured({
      prompt: buildVoiceOverPrompt(ctx),
      schema: VoiceOverSchema,
      timeout: 120_000,
    });

    const scriptBuffer = Buffer.from(result.script, 'utf-8');
    return {
      payloadKind: 'file',
      payload: { ...result, generatedBy: `${llm.provider}/${llm.model}`, templateId: ctx.templateId },
      fileBuffer: scriptBuffer,
      fileName: `voice-over-${ctx.bountyId.slice(2, 10)}.txt`,
      mimeType: 'text/plain',
    };
  }

  // Unknown file template — fail, agent shouldn't have claimed this
  throw new Error(`No file handler for template "${ctx.templateId ?? 'unknown'}"`);
}
