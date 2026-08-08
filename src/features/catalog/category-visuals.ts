import type { ComponentType, CSSProperties } from "react";
import { FaFire, FaGamepad } from "react-icons/fa6";
import { GiBroadsword, GiCastle, GiCrossedSwords, GiMagicSwirl } from "react-icons/gi";
import { MdSportsEsports } from "react-icons/md";
import {
  SiEpicgames,
  SiRoblox,
  SiSteam,
  SiValorant,
} from "react-icons/si";

/** Fallback visual when a category has no `imageUrl` (CDN cover). */
export type CategoryVisual = {
  gradient: string;
  accent: string;
  Icon: ComponentType<{ className?: string; style?: CSSProperties }>;
};

const DEFAULT: CategoryVisual = {
  gradient:
    "linear-gradient(160deg, hsl(222 40% 18%) 0%, hsl(217 50% 28%) 45%, hsl(222 35% 10%) 100%)",
  accent: "hsl(217 91% 65%)",
  Icon: FaGamepad,
};

const BY_SLUG: Record<string, CategoryVisual> = {
  "free-fire": {
    gradient:
      "linear-gradient(155deg, #1a0a00 0%, #c2410c 42%, #7c2d12 78%, #0c0a09 100%)",
    accent: "#fb923c",
    Icon: FaFire,
  },
  roblox: {
    gradient:
      "linear-gradient(155deg, #0b1220 0%, #1d4ed8 40%, #312e81 75%, #020617 100%)",
    accent: "#60a5fa",
    Icon: SiRoblox,
  },
  valorant: {
    gradient:
      "linear-gradient(155deg, #14080c 0%, #be123c 38%, #7f1d1d 72%, #0a0608 100%)",
    accent: "#fb7185",
    Icon: SiValorant,
  },
  "league-of-legends": {
    gradient:
      "linear-gradient(155deg, #0c1220 0%, #1e3a8a 35%, #0ea5e9 70%, #020617 100%)",
    accent: "#38bdf8",
    Icon: GiBroadsword,
  },
  fortnite: {
    gradient:
      "linear-gradient(155deg, #0b1020 0%, #4338ca 40%, #7c3aed 75%, #020617 100%)",
    accent: "#a78bfa",
    Icon: SiEpicgames,
  },
  cs2: {
    gradient:
      "linear-gradient(155deg, #0f172a 0%, #334155 40%, #f59e0b 85%, #0f172a 100%)",
    accent: "#fbbf24",
    Icon: GiCrossedSwords,
  },
  steam: {
    gradient:
      "linear-gradient(155deg, #0b1a2b 0%, #1b2838 45%, #66c0f4 90%, #0b1a2b 100%)",
    accent: "#66c0f4",
    Icon: SiSteam,
  },
  minecraft: {
    gradient:
      "linear-gradient(155deg, #052e16 0%, #166534 40%, #4ade80 80%, #052e16 100%)",
    accent: "#86efac",
    Icon: MdSportsEsports,
  },
  "clash-royale": {
    gradient:
      "linear-gradient(155deg, #1e1b4b 0%, #3730a3 40%, #f59e0b 85%, #1e1b4b 100%)",
    accent: "#fcd34d",
    Icon: GiCastle,
  },
  "genshin-impact": {
    gradient:
      "linear-gradient(155deg, #0c4a6e 0%, #0369a1 40%, #e0f2fe 85%, #082f49 100%)",
    accent: "#7dd3fc",
    Icon: GiMagicSwirl,
  },
};

export function getCategoryVisual(slug: string): CategoryVisual {
  return BY_SLUG[slug] ?? DEFAULT;
}
