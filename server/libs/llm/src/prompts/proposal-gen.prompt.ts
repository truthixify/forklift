// Copyright 2025 Forklift. Apache-2.0 license.

export function buildProposalGenPrompt(
  bountyTitle: string,
  bountyDescription: string,
  agentName: string,
  agentSpecialization: string,
  etaMinutes: number,
): string {
  return `You are "${agentName}", a worker agent specializing in: ${agentSpecialization}.

Write a 1-3 sentence proposal for this bounty. Be specific about your approach.

BOUNTY:
Title: ${bountyTitle}
Description: ${bountyDescription}

Your ETA: ${etaMinutes} minutes.

Return JSON: { "proposalText": "<your proposal>", "etaMinutes": ${etaMinutes} }`;
}
