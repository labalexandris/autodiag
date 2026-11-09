import { Activity, BatteryCharging, KeyRound, Lightbulb, Snowflake, Wrench, Zap, PanelTop } from "lucide-react";
import type { ServiceCategory } from "@/lib/types";

const icons = {
  diagnostics: Activity,
  ac: Snowflake,
  starter: Zap,
  battery: BatteryCharging,
  lighting: Lightbulb,
  comfort: PanelTop,
  service: Wrench,
} satisfies Record<ServiceCategory, unknown>;

export function ServiceIcon({ category, id, size = 20 }: { category: ServiceCategory; id?: string; size?: number }) {
  const Icon = id === "immo" ? KeyRound : icons[category];
  return <Icon size={size} strokeWidth={1.7} />;
}
