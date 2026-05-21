import posthog from "posthog-js";

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
  api_host: "/ingest",
  ui_host: "https://eu.posthog.com",
  defaults: "2026-01-30",
  capture_exceptions: true,
  capture_pageleave: true,
  capture_performance: { web_vitals: true },
  autocapture: {
    capture_copied_text: false,
    element_allowlist: ["a", "button"],
  },
  debug: process.env.NODE_ENV === "development",
});
