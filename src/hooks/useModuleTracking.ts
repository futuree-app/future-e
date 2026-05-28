"use client";

import { useEffect, useRef } from "react";
import posthog from "posthog-js";
import { buildGeoProps, type GeoContext } from "@/lib/posthog-props";

const SCROLL_THRESHOLDS = [25, 50, 75, 90] as const;

type UseModuleTrackingOptions = GeoContext & {
  moduleId: string;
};

export function useModuleTracking({ moduleId, commune, inseeCode, reportId }: UseModuleTrackingOptions) {
  const startRef = useRef(Date.now());
  const firedRef = useRef(new Set<number>());
  const maxScrollRef = useRef(0);

  useEffect(() => {
    const geo = buildGeoProps({ commune, inseeCode, reportId });

    posthog.capture("report_module_opened", {
      module_id: moduleId,
      ...geo,
    });

    startRef.current = Date.now();
    firedRef.current = new Set();
    maxScrollRef.current = 0;

    function handleScroll() {
      const scrollTop = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;
      const pct = Math.min(100, Math.round((scrollTop / maxScroll) * 100));
      if (pct > maxScrollRef.current) maxScrollRef.current = pct;

      for (const threshold of SCROLL_THRESHOLDS) {
        if (pct >= threshold && !firedRef.current.has(threshold)) {
          firedRef.current.add(threshold);
          posthog.capture("report_module_scroll", {
            module_id: moduleId,
            scroll_percentage: threshold,
            time_spent_seconds: Math.round((Date.now() - startRef.current) / 1000),
            report_id: geo.report_id,
          });
        }
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      posthog.capture("report_module_closed", {
        module_id: moduleId,
        read_percentage: maxScrollRef.current,
        time_spent_seconds: Math.round((Date.now() - startRef.current) / 1000),
        report_id: geo.report_id,
      });
    };
    // Geo props are captured once at mount — intentional snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId]);
}
