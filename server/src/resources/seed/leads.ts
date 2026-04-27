// Copyright 2025 Forklift. Apache-2.0 license.

export interface LeadRecord {
  name: string;
  title: string;
  company: string;
  email: string;
  linkedin: string;
  industry: string;
  region: string;
  fundingStage: string;
}

export const SEEDED_LEADS: LeadRecord[] = [
  { name: 'Sarah Chen', title: 'VP Engineering', company: 'DataFlow AI', email: 'schen@dataflow.ai', linkedin: 'linkedin.com/in/sarachen', industry: 'AI/ML', region: 'US West', fundingStage: 'Series B' },
  { name: 'Marcus Johnson', title: 'CTO', company: 'NeuralOps', email: 'marcus@neuralops.io', linkedin: 'linkedin.com/in/marcusj', industry: 'AI/ML', region: 'US East', fundingStage: 'Series A' },
  { name: 'Priya Patel', title: 'Head of Product', company: 'CloudScale', email: 'priya@cloudscale.com', linkedin: 'linkedin.com/in/priyap', industry: 'Cloud Infrastructure', region: 'US West', fundingStage: 'Series C' },
  { name: 'James Wilson', title: 'CEO', company: 'FinEdge', email: 'james@finedge.co', linkedin: 'linkedin.com/in/jwilson', industry: 'Fintech', region: 'US East', fundingStage: 'Seed' },
  { name: 'Lisa Park', title: 'Director of Engineering', company: 'HealthAI', email: 'lisa@healthai.dev', linkedin: 'linkedin.com/in/lisapark', industry: 'Healthcare', region: 'US West', fundingStage: 'Series A' },
  { name: 'David Kim', title: 'VP Product', company: 'SecureStack', email: 'dkim@securestack.io', linkedin: 'linkedin.com/in/davidkim', industry: 'Cybersecurity', region: 'US East', fundingStage: 'Series B' },
  { name: 'Emma Rodriguez', title: 'CTO', company: 'EdTech Labs', email: 'emma@edtechlabs.com', linkedin: 'linkedin.com/in/emmarodriguez', industry: 'Education', region: 'EU West', fundingStage: 'Series A' },
  { name: 'Alex Thompson', title: 'Head of Data', company: 'RetailIQ', email: 'alex@retailiq.com', linkedin: 'linkedin.com/in/alexthompson', industry: 'Retail Tech', region: 'US East', fundingStage: 'Series B' },
  { name: 'Yuki Tanaka', title: 'VP Engineering', company: 'RoboWare', email: 'yuki@roboware.jp', linkedin: 'linkedin.com/in/yukitanaka', industry: 'Robotics', region: 'APAC', fundingStage: 'Series C' },
  { name: 'Carlos Mendez', title: 'CTO', company: 'GreenGrid', email: 'carlos@greengrid.eco', linkedin: 'linkedin.com/in/carlosmendez', industry: 'CleanTech', region: 'EU South', fundingStage: 'Seed' },
  { name: 'Anna Kowalski', title: 'Head of AI', company: 'LogiFlow', email: 'anna@logiflow.eu', linkedin: 'linkedin.com/in/annakowalski', industry: 'Logistics', region: 'EU Central', fundingStage: 'Series A' },
  { name: 'Ryan O\'Brien', title: 'CEO', company: 'PropTech360', email: 'ryan@proptech360.com', linkedin: 'linkedin.com/in/ryanobrien', industry: 'Real Estate Tech', region: 'US East', fundingStage: 'Seed' },
  { name: 'Mei Lin', title: 'Director of ML', company: 'BioCompute', email: 'mei@biocompute.ai', linkedin: 'linkedin.com/in/meilin', industry: 'Biotech', region: 'US West', fundingStage: 'Series B' },
  { name: 'Omar Hassan', title: 'VP Sales', company: 'SaaSMetrics', email: 'omar@saasmetrics.io', linkedin: 'linkedin.com/in/omarhassan', industry: 'SaaS', region: 'US East', fundingStage: 'Series A' },
  { name: 'Sophie Martin', title: 'CPO', company: 'FoodChain AI', email: 'sophie@foodchainai.com', linkedin: 'linkedin.com/in/sophiemartin', industry: 'AgTech', region: 'EU West', fundingStage: 'Series A' },
  { name: 'Ben Walker', title: 'CTO', company: 'TravelStack', email: 'ben@travelstack.com', linkedin: 'linkedin.com/in/benwalker', industry: 'Travel Tech', region: 'US West', fundingStage: 'Series B' },
  { name: 'Fatima Al-Rashid', title: 'Head of Engineering', company: 'InsureTech Pro', email: 'fatima@insuretechpro.com', linkedin: 'linkedin.com/in/fatimaalrashid', industry: 'Insurance Tech', region: 'MENA', fundingStage: 'Series A' },
  { name: 'Tom Zhang', title: 'VP Product', company: 'GameForge', email: 'tom@gameforge.dev', linkedin: 'linkedin.com/in/tomzhang', industry: 'Gaming', region: 'APAC', fundingStage: 'Series C' },
  { name: 'Rachel Green', title: 'Director of Analytics', company: 'MarketPulse', email: 'rachel@marketpulse.io', linkedin: 'linkedin.com/in/rachelgreen', industry: 'MarTech', region: 'US East', fundingStage: 'Series B' },
  { name: 'Chris Taylor', title: 'CTO', company: 'DevOps Hub', email: 'chris@devopshub.dev', linkedin: 'linkedin.com/in/christaylor', industry: 'DevTools', region: 'US West', fundingStage: 'Seed' },
];
