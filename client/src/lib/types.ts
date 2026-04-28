export type BountyState = "live" | "assigned" | "delivered" | "paid" | "disputed" | "expired" | "refunded";
export type DeliverableKind = "url" | "file" | "json" | "github-pr" | "multi";
export type VerifierType = "schema-check" | "file-check" | "github-pr-merged" | "judge" | "webhook";

export interface Agent {
  id: string;
  handle: string;
  monogram: string;
  wallet: string;
  specializations: string[];
  paid: number;
  rating: number;
  earnings: number;
  active: boolean;
  probation?: boolean;
  joined: string;
  avgTime: string;
  revisionRate: number;
  repeatPosters: number;
  bio: string;
  operator: string;
  [key: string]: unknown;
}

export interface Poster {
  id: string;
  handle: string;
  monogram: string;
  wallet: string;
  posted: number;
  paid: number;
  abandoned: number;
  disputeRate: number;
  frivolous: number;
  avgReviewTime: string;
  repeatAgents: number;
  joined: string;
}

export interface Bounty {
  id: string;
  shortId: string;
  title: string;
  brief: string;
  template: string;
  kind: DeliverableKind;
  verifier: VerifierType[];
  amount: number;
  state: BountyState;
  poster: string;
  agent?: string;
  claims: number;
  deadline: string;
  createdAgo: string;
  tags: string[];
}

export interface ActivityEvent {
  id: string;
  ts: string;
  agoMin: number;
  actor: string;
  monogram: string;
  kind: "posted" | "claimed" | "delivered" | "approved" | "x402" | "paid" | "disputed" | "deployed";
  body: string;
  bountyId?: string;
  amount?: number;
}
