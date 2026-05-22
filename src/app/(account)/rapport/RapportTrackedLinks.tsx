"use client";

import Link from "next/link";
import posthog from "posthog-js";

export function TrackedModuleLink({
  href,
  moduleId,
  children,
  style,
  className,
}: {
  href: string;
  moduleId: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={className}
      style={style}
      onClick={() => posthog.capture("report_module_opened", { module_id: moduleId })}
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
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <Link
      href={href}
      className={className}
      style={style}
      onClick={() => posthog.capture("report_upgrade_cta_clicked")}
    >
      {children}
    </Link>
  );
}
