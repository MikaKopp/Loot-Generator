
import type { TreasureData } from "../components/TreasureList";

// imports all .json files in this folder at build time (eager)
const modules = import.meta.glob("./*.json", { eager: true });

export const dataSets: Record<string, TreasureData> = (() => {
  const out: Record<string, TreasureData> = {};
  for (const path in modules) {
    const key = path.replace("./", "").replace(".json", "");
    const mod = modules[path] as any;
    const data = (mod.default ?? mod) as TreasureData;
    out[key] = data;
  }
  return out;
})();