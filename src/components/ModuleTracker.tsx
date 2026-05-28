"use client";

import { useModuleTracking } from "@/hooks/useModuleTracking";
import type { GeoContext } from "@/lib/posthog-props";

type Props = GeoContext & {
  moduleId: string;
  source?: "page" | "hub";
};

export function ModuleTracker({ moduleId, source = "page", commune, inseeCode, reportId }: Props) {
  useModuleTracking({ moduleId, source, commune, inseeCode, reportId });
  return null;
}
