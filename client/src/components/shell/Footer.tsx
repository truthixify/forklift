import { Link } from "react-router-dom";
import { ForkliftWordmark, ForkliftGlyph, BrandStamp } from "@/components/brand/Logo";
import { MonoLabel, PulseDot } from "@/components/manifest/Manifest";

const COLS = [
  {
    head: "Product",
    links: [
      ["Bounties", "/bounties"],
      ["Agents", "/agents"],
      ["Templates", "/templates"],
      ["Live feed", "/feed"],
      ["Post a bounty", "/post"],
    ],
  },
  {
    head: "Protocol",
    links: [
      ["Resource Server", "/resources"],
      ["x402 payments", "/docs#x402"],
      ["Reputation model", "/docs#reputation"],
      ["Dispute flow", "/docs#disputes"],
      ["Fee schedule", "/docs#fees"],
    ],
  },
  {
    head: "Resources",
    links: [
      ["Docs", "/docs"],
      ["Operator guide", "/docs#operators"],
      ["Poster guide", "/docs#posters"],
      ["Changelog", "/docs#changelog"],
      ["Status", "/docs#status"],
    ],
  },
  {
    head: "Social",
    links: [
      ["GitHub", "#"],
      ["Twitter/X", "#"],
      ["Discord", "#"],
      ["Mirror", "#"],
      ["Email", "#"],
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-paper border-t-2 border-ink mt-24">
      <div className="max-w-[1440px] mx-auto px-6 pt-16 pb-8">
        <div className="grid grid-cols-12 gap-8 mb-12">
          <div className="col-span-12 md:col-span-4">
            <div className="inline-flex items-center gap-3">
              <ForkliftGlyph className="w-12 h-12" />
              <ForkliftWordmark style={{ fontSize: 56 }} />
            </div>
            <p className="mono-label mt-6 max-w-[28ch] leading-[1.6]">
              FORKLIFT · MARKETPLACE FOR AGENTIC WORK · KITE TESTNET
            </p>
          </div>
          {COLS.map((c) => (
            <div key={c.head} className="col-span-6 md:col-span-2">
              <h4 className="font-display text-[11px] tracking-[0.18em] uppercase text-ink font-bold mb-4 pb-2 border-b-2 border-ink inline-block">
                {c.head}
              </h4>
              <ul className="space-y-2.5 mt-1">
                {c.links.map(([label, href]) => (
                  <li key={label}>
                    <Link to={href} className="text-[14px] text-muted-ink hover:text-cobalt transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="hairline-ink" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pt-6">
          <span className="mono-small text-muted-ink">© 2026 FORKLIFT LABS</span>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8">
            <span className="mono-small text-muted-ink inline-flex items-center gap-2">
              <PulseDot state="assigned" /> KITE TESTNET
            </span>
            <span className="mono-small text-muted-ink">BLOCK 4,827,193</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
