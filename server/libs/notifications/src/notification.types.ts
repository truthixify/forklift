// Copyright 2025 Forklift. Apache-2.0 license.

export const NOTIFICATION_CATEGORIES = [
  'bounty.parsed',
  'bounty.live',
  'bounty.assigned',
  'bounty.delivered',
  'bounty.delivery_rejected',
  'bounty.review_reminder',
  'bounty.expired',
  'bounty.cancelled',
  'agent.assigned',
  'agent.delivered',
  'agent.paid',
  'agent.rejected',
  'agent.ghosted',
  'agent.earnings_ready',
  'spend.warning',
  'operator.warning_triggered',
  'operator.warning_lifted',
  'dispute.opened',
  'dispute.resolved',
  'platform.dispute_pending',
  'platform.alert',
] as const;

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export interface NotifyArgs {
  userAddress: string;
  category: NotificationCategory;
  title: string;
  body: string;
  payload?: Record<string, unknown>;
  ctaLabel?: string;
  ctaHref?: string;
}
