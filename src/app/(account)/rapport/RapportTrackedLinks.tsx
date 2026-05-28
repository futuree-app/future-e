"use client";

import Link from "next/link";
import posthog from "posthog-js";
import { buildGeoProps, buildModuleProps } from "@/lib/posthog-props";

export function TrackedModuleLink({
  href,
  moduleId,
  children,
  style,
  className,
  commune,
  inseeCode,
}: {
  href: string;
  moduleId: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  commune?: string | null;
  inseeCode?: string | null;
}) {
  return (
    <Link
      href={href}
      className={className}
      style={style}
      onClick={() =>
        posthog.capture("report_module_opened", {
          module_id: moduleId,
          source: "hub",
          ...buildModuleProps(moduleId),
          ...buildGeoProps({ commune, inseeCode }),
        })
      }
    >
      {children}
    </Link>
  );
}

export function TrackedUpgradeLink({
  href,
  children,
  className,
  style,
  source = "autre",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  source?: string;
}) {
  return (
    <Link
      href={href}
      className={className}
      style={style}
      onClick={() =>
        posthog.capture("report_upgrade_cta_clicked", { source })
      }
    >
      {children}
    </Link>
  );
}
