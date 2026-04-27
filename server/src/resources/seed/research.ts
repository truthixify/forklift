// Copyright 2025 Forklift. Apache-2.0 license.

export interface ResearchEntry {
  topic: string;
  snippets: Array<{ text: string; source: string }>;
}

export const SEEDED_RESEARCH: ResearchEntry[] = [
  {
    topic: 'AI Agent Marketplaces',
    snippets: [
      { text: 'Autonomous AI agents represent a shift from tool-based to outcome-based computing. Users pay for results rather than access to capabilities.', source: 'Stanford HAI Report 2025' },
      { text: 'The agent marketplace model reduces subscription fatigue by enabling per-task pricing. Early movers in this space are seeing 40% higher retention than subscription-based alternatives.', source: 'a16z AI Market Analysis' },
      { text: 'Key challenges include verification of agent work quality, reputation bootstrapping for new agents, and spend cap management for autonomous operations.', source: 'MIT CSAIL Working Paper' },
      { text: 'x402 payment protocol enables machine-to-machine micropayments, forming the economic backbone of agent commerce ecosystems.', source: 'Coinbase Research' },
      { text: 'On-chain settlement provides transparency and auditability that centralized escrow systems cannot match, particularly for cross-border agent transactions.', source: 'Messari Q1 2025 Report' },
    ],
  },
  {
    topic: 'DeFi Protocol Design',
    snippets: [
      { text: 'Escrow-based settlement remains the gold standard for trustless two-party transactions, with EIP-712 typed signatures reducing gas costs by 60% compared to on-chain state machines.', source: 'Ethereum Foundation Research' },
      { text: 'Fee structures in decentralized marketplaces must balance platform sustainability with competitive pricing. The 5-15% range has emerged as the sweet spot across successful protocols.', source: 'Delphi Digital' },
      { text: 'Reputation systems in DeFi benefit from append-only records with deterministic aggregation, enabling portable trust across protocol forks.', source: 'Paradigm Research' },
      { text: 'Account abstraction enables server-managed agent wallets with gasless operations, critical for autonomous agent systems where gas management would be prohibitive.', source: 'ERC-4337 Working Group' },
      { text: 'Dispute resolution in decentralized systems works best as a multi-layer model: automated first, human-reviewed second, with economic penalties discouraging frivolous disputes.', source: 'Kleros Protocol Analysis' },
    ],
  },
  {
    topic: 'LLM-Based Verification',
    snippets: [
      { text: 'LLM-as-judge systems achieve 85-92% agreement with human evaluators on rubric-based assessments, making them viable for automated delivery verification.', source: 'Google DeepMind 2025' },
      { text: 'Composite verification combining structural checks (schema, file type) with LLM-based quality assessment reduces false positive rates by 3x compared to either approach alone.', source: 'Anthropic Safety Research' },
      { text: 'Rubric decomposition into weighted criteria enables consistent scoring across diverse deliverable types, from code quality to creative design.', source: 'OpenAI Evals Framework' },
      { text: 'Provider-agnostic LLM abstraction layers allow runtime model switching based on cost, latency, and quality tradeoffs without code changes.', source: 'LangChain Architecture Guide' },
      { text: 'Verification audit trails (model used, prompt, score breakdown) are essential for dispute resolution and system improvement over time.', source: 'AI Safety Institute' },
    ],
  },
  {
    topic: 'B2B Lead Generation',
    snippets: [
      { text: 'AI-powered lead generation achieves 3x higher qualification rates than manual prospecting, with per-lead costs dropping below $0.10 for targeted B2B contacts.', source: 'HubSpot State of Marketing 2025' },
      { text: 'The shift from subscription-based lead databases to per-record pricing aligns costs with actual usage, reducing waste by 60% for occasional users.', source: 'Gartner MarTech Survey' },
      { text: 'Multi-dimensional filtering (industry, role, region, funding stage) combined with LLM-based relevance scoring produces higher-quality lead lists.', source: 'Salesforce Research' },
      { text: 'Lead freshness degrades at approximately 2% per week, making real-time or near-real-time sourcing critical for outbound campaigns.', source: 'ZoomInfo Data Quality Report' },
      { text: 'Privacy-compliant lead generation requires explicit opt-in data sources and transparent provenance tracking, which on-chain attestation uniquely enables.', source: 'GDPR Compliance Guide 2025' },
    ],
  },
  {
    topic: 'Open Source Contribution Automation',
    snippets: [
      { text: 'AI-assisted code contributions account for 15% of merged PRs in top-1000 GitHub repositories, up from 3% in 2024.', source: 'GitHub Octoverse 2025' },
      { text: 'Automated PR verification using merge status and CI checks provides objective, trustless verification for bounty-based OSS contributions.', source: 'Open Source Security Foundation' },
      { text: 'Agent-authored commits should clearly attribute the operating entity while using bot committer identities, maintaining both transparency and automation capability.', source: 'Linux Foundation Guidelines' },
      { text: 'Bounty-based OSS funding models increase contributor diversity by 4x compared to maintainer-funded programs, attracting talent from outside traditional contributor pools.', source: 'Gitcoin Grants Analysis' },
      { text: 'The key challenge in automated OSS contributions is context understanding — agents need access to issue context, codebase patterns, and maintainer preferences.', source: 'ACM SIGSOFT 2025' },
    ],
  },
];
