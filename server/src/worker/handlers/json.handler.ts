// Copyright 2025 Forklift. Apache-2.0 license.

import { Logger } from '@nestjs/common';
import { z } from 'zod';
import type { LLMClient } from '@forklift/llm';
import type { BountyWorkContext } from './dispatch';
import type { WorkResult } from './work-result';

const logger = new Logger('WorkHandler:json');

const TEMPLATE_PROMPTS: Record<string, (ctx: BountyWorkContext) => { prompt: string; schema: z.ZodSchema }> = {
  'lead-gen': (ctx) => ({
    prompt: `You are a lead generation specialist. Based on the following bounty, research and generate a list of qualified leads.

BOUNTY: ${ctx.title}
BRIEF: ${ctx.description}

Generate 10-15 realistic, high-quality leads that match the criteria described. Each lead must have real-sounding details appropriate to the industry and role specified.

Return a JSON object with a "leads" array. Each lead object must have:
- name: full name
- title: job title
- company: company name
- email: professional email (realistic format)
- linkedin: LinkedIn profile URL
- relevance: one sentence explaining why this lead matches the criteria`,
    schema: z.object({
      leads: z.array(z.object({
        name: z.string(),
        title: z.string(),
        company: z.string(),
        email: z.string(),
        linkedin: z.string(),
        relevance: z.string(),
      })).min(5),
    }),
  }),

  'data-extraction': (ctx) => ({
    prompt: `You are a data extraction specialist. Based on the following bounty, extract and structure the requested data.

BOUNTY: ${ctx.title}
BRIEF: ${ctx.description}

Extract the data described in the brief. Structure it as a clean JSON array of objects with consistent fields. Include as many records as the brief requests (default 20 if not specified).

Return a JSON object with a "records" array and a "metadata" object describing the extraction.`,
    schema: z.object({
      records: z.array(z.record(z.unknown())).min(3),
      metadata: z.object({
        source: z.string(),
        recordCount: z.number(),
        extractedFields: z.array(z.string()),
      }),
    }),
  }),

  'dataset-labeling': (ctx) => ({
    prompt: `You are a data labeling specialist. Based on the following bounty, generate labeled data.

BOUNTY: ${ctx.title}
BRIEF: ${ctx.description}

Generate labeled data entries as described. Each entry must have an "id" and a "label" field, plus any additional fields relevant to the task.

Return a JSON object with a "labeled" array.`,
    schema: z.object({
      labeled: z.array(z.object({
        id: z.string(),
        label: z.string(),
      }).passthrough()).min(5),
    }),
  }),

  'research-brief': (ctx) => ({
    prompt: `You are a research analyst. Write a comprehensive research brief for the following bounty.

BOUNTY: ${ctx.title}
BRIEF: ${ctx.description}

Write a thorough, well-structured research brief. Include real insights, data points, and actionable findings. The brief should be professional quality, suitable for a business audience.

Return a JSON object with:
- title: the research brief title
- summary: 2-3 paragraph executive summary
- sections: array of objects with "heading" and "content" (each section 200-400 words)
- keyFindings: array of 5-8 bullet-point findings
- sources: array of source descriptions`,
    schema: z.object({
      title: z.string(),
      summary: z.string().min(100),
      sections: z.array(z.object({
        heading: z.string(),
        content: z.string().min(100),
      })).min(3),
      keyFindings: z.array(z.string()).min(3),
      sources: z.array(z.string()).min(2),
    }),
  }),

  'blog-post': (ctx) => ({
    prompt: `You are a professional content writer. Write a compelling blog post for the following bounty.

BOUNTY: ${ctx.title}
BRIEF: ${ctx.description}

Write an engaging, well-structured blog post. Use clear headings, compelling opening, practical insights, and a strong conclusion. Target 800-1500 words.

Return a JSON object with:
- title: the blog post title (catchy, SEO-friendly)
- content: full blog post in markdown format
- metaDescription: 150-character SEO meta description
- tags: array of 3-5 relevant tags`,
    schema: z.object({
      title: z.string(),
      content: z.string().min(500),
      metaDescription: z.string(),
      tags: z.array(z.string()).min(2),
    }),
  }),

  'copywriting': (ctx) => ({
    prompt: `You are an expert copywriter. Write persuasive copy for the following bounty.

BOUNTY: ${ctx.title}
BRIEF: ${ctx.description}

Write compelling, conversion-focused copy. Include headlines, body copy, and clear calls to action. Match the tone and audience described in the brief.

Return a JSON object with:
- headline: the main headline
- subheadline: supporting headline
- copy: the main body copy
- cta: call to action text
- variants: array of 2-3 alternative headline/CTA pairs`,
    schema: z.object({
      headline: z.string(),
      subheadline: z.string(),
      copy: z.string().min(100),
      cta: z.string(),
      variants: z.array(z.object({
        headline: z.string(),
        cta: z.string(),
      })).min(1),
    }),
  }),

  'transcription': (ctx) => ({
    prompt: `You are a transcription specialist. Based on the following bounty, generate a sample transcription.

BOUNTY: ${ctx.title}
BRIEF: ${ctx.description}

Generate a realistic transcription with timestamps. The content should match what's described in the brief.

Return a JSON object with a "segments" array. Each segment has:
- start: start time in seconds (number)
- end: end time in seconds (number)
- text: the transcribed text for that segment
- speaker: speaker identifier (e.g. "Speaker 1")`,
    schema: z.object({
      segments: z.array(z.object({
        start: z.number(),
        end: z.number(),
        text: z.string(),
        speaker: z.string(),
      })).min(5),
    }),
  }),
};

function buildGenericJsonPrompt(ctx: BountyWorkContext): { prompt: string; schema: z.ZodSchema } {
  const schemaHint = ctx.deliverableSchema
    ? `\n\nThe delivery should conform to this schema:\n${JSON.stringify(ctx.deliverableSchema, null, 2)}`
    : '';

  return {
    prompt: `You are an expert AI agent completing a task. Produce high-quality, structured output for this bounty.

BOUNTY: ${ctx.title}
BRIEF: ${ctx.description}${schemaHint}

Analyze the requirements carefully. Produce a complete, professional-quality deliverable. Structure your output as clean JSON with meaningful field names.

Return a JSON object with your deliverable. Include a "summary" field describing what you produced.`,
    schema: z.object({
      summary: z.string(),
    }).passthrough(),
  };
}

export async function handleJsonWork(ctx: BountyWorkContext, llm: LLMClient): Promise<WorkResult> {
  logger.log(`Generating ${ctx.templateId ?? 'generic'} JSON delivery for: ${ctx.title.slice(0, 60)}`);

  const templatePrompt = ctx.templateId ? TEMPLATE_PROMPTS[ctx.templateId] : undefined;
  const { prompt, schema } = templatePrompt ? templatePrompt(ctx) : buildGenericJsonPrompt(ctx);

  try {
    const result = await llm.generateStructured({ prompt, schema, timeout: 120_000 });
    return {
      payloadKind: 'json',
      payload: { ...result, generatedBy: `${llm.provider}/${llm.model}`, templateId: ctx.templateId },
    };
  } catch (error) {
    logger.warn(`Structured generation failed, falling back to text`, error instanceof Error ? error.message : '');
    const text = await llm.generateText({ prompt, timeout: 120_000 });

    let parsed: Record<string, unknown> = { rawText: text };
    try {
      parsed = JSON.parse(text) as Record<string, unknown>;
    } catch { /* use rawText fallback */ }

    return {
      payloadKind: 'json',
      payload: { ...parsed, generatedBy: `${llm.provider}/${llm.model}`, templateId: ctx.templateId },
    };
  }
}
