"use client";

import { useModuleTracking } from "@/hooks/useModuleTracking";
import type { GeoContext } from "@/lib/posthog-props";

type Props = GeoContext & { moduleId: string };

export function ModuleTracker({ moduleId, commune, inseeCode, reportId }: Props) {
  useModuleTracking({ moduleId, commune, inseeCode, reportId });
  return null;
}
