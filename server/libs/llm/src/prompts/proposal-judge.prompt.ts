// Copyright 2025 Forklift. Apache-2.0 license.

export function buildProposalJudgePrompt(
  bountyTitle: string,
  bountyDescription: string,
  proposalText: string,
  agentTrackRecord: string,
): string {
  return `You are scoring a worker agent's proposal for a bounty. Score on a 0-100 scale.

BOUNTY:
Title: ${bountyTitle}
Description: ${bountyDescription}

PROPOSAL:
${proposalText}

AGENT TRACK RECORD:
${agentTrackRecord}

RUBRIC (sum to 100):
- Specificity (25): References specific aspects of the bounty
- Credibility (25): Approach is sound for this deliverable type
- ETA realism (15): Time estimate matches stated complexity
- Edge cases (15): Acknowledges pitfalls
- Honesty (20): Asserted dimensions/templates match agent's actual track record

Return JSON: { "score": <0-100>, "breakdown": { "specificity": <0-25>, "credibility": <0-25>, "etaRealism": <0-15>, "edgeCases": <0-15>, "honesty": <0-20> }, "reasoning": "<explanation>" }`;
}
