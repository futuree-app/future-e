"use client";

import { useEffect, useRef } from "react";
import posthog from "posthog-js";
import { buildGeoProps, buildModuleProps, type GeoContext } from "@/lib/posthog-props";

const SCROLL_THRESHOLDS = [25, 50, 75, 90] as const;

type UseModuleTrackingOptions = GeoContext & {
  moduleId: string;
  source?: "page" | "hub";
};

export function useModuleTracking({ moduleId, source = "page", commune, inseeCode, reportId }: UseModuleTrackingOptions) {
  const startRef = useRef(Date.now());
  const firedRef = useRef(new Set<number>());
  const maxScrollRef = useRef(0);

  useEffect(() => {
    const geo = buildGeoProps({ commune, inseeCode, reportId });
    const mod = buildModuleProps(moduleId);

    posthog.capture("report_module_opened", {
      module_id: moduleId,
      source,
      ...mod,
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
            scroll_depth: threshold,
            scroll_percent: threshold,
            scroll_percentage: threshold,
            time_spent_seconds: Math.round((Date.now() - startRef.current) / 1000),
            ...mod,
            report_id: geo.report_id,
            commune: geo.commune,
            insee_code: geo.insee_code,
            department: geo.department,
            region: geo.region,
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
        scroll_depth: maxScrollRef.current,
        scroll_depth_pct: maxScrollRef.current,
        scroll_percent: maxScrollRef.current,
        scroll_percentage: maxScrollRef.current,
        time_spent_seconds: Math.round((Date.now() - startRef.current) / 1000),
        time_spent_sec: Math.round((Date.now() - startRef.current) / 1000),
        ...mod,
        report_id: geo.report_id,
        commune: geo.commune,
        insee_code: geo.insee_code,
        department: geo.department,
        region: geo.region,
      });
    };
    // Geo props are snapshotted once at mount — intentional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId, source]);
}
