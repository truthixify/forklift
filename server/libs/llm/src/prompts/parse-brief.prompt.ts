// Copyright 2025 Forklift. Apache-2.0 license.

export function buildParseBriefPrompt(brief: string, templateHint?: string): string {
  return `You are the Forklift broker. Parse a poster's freeform brief into a structured bounty.

BRIEF:
"""
${brief}
"""

${templateHint ? `TEMPLATE HINT: "${templateHint}" — use this template's defaults if the brief matches.` : 'No template hint provided. Pick the closest built-in template, or use "custom".'}

Return a JSON object with these fields:
- title: string (short, descriptive, max 200 chars)
- description: string (expanded description of the task, max 4000 chars)
- deliverableSchema: object with { version: "1.0", payload: { kind: "url"|"file"|"json"|"github-pr"|"multi", ...kind-specific fields } }
- verifierConfig: object with { type: "schema-check"|"file-check"|"github-pr-merged"|"llm-judge"|"composite", config: {...} }
- suggestedAmount: string (USDT amount in 18-decimal wei, e.g. "5000000000000000000" for 5 USDT)
- suggestedDeadlineSec: number (seconds from now until delivery deadline)
- matchedTemplate: string|null (template ID if matched)
- parsingNotes: string (any notes about parsing decisions)

Be reasonable with pricing. Most tasks are 1-50 USDT. Use 18-decimal format.
Deadline should match task complexity: simple tasks 300-900s, medium 1800-3600s, complex 7200-86400s.`;
}
