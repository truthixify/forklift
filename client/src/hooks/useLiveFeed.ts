import { useEffect, useState, useRef } from "react";
import { ACTIVITY, type ActivityEvent } from "@/data/mock";

const ACTORS: Array<Pick<ActivityEvent, "actor" | "monogram">> = [
  { actor: "Pixel", monogram: "P" },
  { actor: "Scout", monogram: "S" },
  { actor: "Wrench", monogram: "W" },
  { actor: "Cargo", monogram: "C" },
  { actor: "Route", monogram: "R" },
  { actor: "Press", monogram: "P" },
  { actor: "Archive", monogram: "A" },
  { actor: "Frame", monogram: "F" },
];

const TEMPLATES: Array<(actor: string) => Omit<ActivityEvent, "id" | "ts" | "agoMin" | "actor" | "monogram">> = [
  () => ({ kind: "x402", body: "paid 0.25 USDT for premium-image-gen via x402", amount: 0.25 }),
  () => ({ kind: "x402", body: "paid 0.04 USDT for curated-leads via x402", amount: 0.04 }),
  () => ({ kind: "x402", body: "paid 0.08 USDT for paper-search via x402", amount: 0.08 }),
  () => ({ kind: "claimed", body: `claimed bounty FL-00${40 + Math.floor(Math.random() * 8)}` }),
  () => ({ kind: "delivered", body: `delivered FL-00${40 + Math.floor(Math.random() * 8)}` }),
  () => ({ kind: "paid", body: `earned ${(Math.random() * 22 + 4).toFixed(2)} USDT`, amount: +(Math.random() * 22 + 4).toFixed(2) }),
  () => ({ kind: "approved", body: `approved delivery for FL-00${37 + Math.floor(Math.random() * 6)}` }),
  () => ({ kind: "posted", body: `posted bounty FL-00${42 + Math.floor(Math.random() * 5)} · ${[12, 18, 25, 40, 55][Math.floor(Math.random() * 5)]} USDT` }),
];

const fmtUtc = (d: Date) =>
  `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")} UTC`;

let counter = 200;

export function useLiveFeed(intervalMs = 3500) {
  const [events, setEvents] = useState<ActivityEvent[]>(ACTIVITY);
  const seq = useRef(counter);

  useEffect(() => {
    const id = setInterval(() => {
      const actor = ACTORS[Math.floor(Math.random() * ACTORS.length)];
      const tmpl = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
      const body = tmpl(actor.actor);
      seq.current += 1;
      const next: ActivityEvent = {
        id: `ev-live-${seq.current}`,
        ts: fmtUtc(new Date()),
        agoMin: 0,
        actor: actor.actor,
        monogram: actor.monogram,
        ...body,
      } as ActivityEvent;
      setEvents((prev) => [next, ...prev].slice(0, 60));
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return events;
}

/** Smoothly increments a number toward a moving target. */
export function useTickingCounter(initial: number, perTickMin = 0, perTickMax = 1, intervalMs = 4200) {
  const [value, setValue] = useState(initial);
  useEffect(() => {
    const id = setInterval(() => {
      setValue((v) => v + Math.floor(perTickMin + Math.random() * (perTickMax - perTickMin + 1)));
    }, intervalMs);
    return () => clearInterval(id);
  }, [perTickMin, perTickMax, intervalMs]);
  return value;
}

/** Increments a Kite-testnet block height every ~2s. */
export function useBlockHeight(start = 4827193) {
  const [n, setN] = useState(start);
  useEffect(() => {
    const id = setInterval(() => setN((v) => v + 1), 2000);
    return () => clearInterval(id);
  }, []);
  return n;
}
