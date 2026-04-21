"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { AuthActionState } from "@/app/auth/shared";
import { createClient } from "@/lib/supabase/server";

function getStringField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function getBaseUrl() {
  const headerStore = await headers();
  const forwardedProto = headerStore.get("x-forwarded-proto");
  const forwardedHost = headerStore.get("x-forwarded-host");
  const host = forwardedHost || headerStore.get("host");
  const envBaseUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const productionHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;

  if (host && !host.includes("localhost")) {
    return `${forwardedProto || "https"}://${host}`;
  }

  if (productionHost) {
    return `https://${productionHost}`;
  }

  if (envBaseUrl && !envBaseUrl.includes("localhost")) {
    return envBaseUrl;
  }

  if (host) {
    return `${forwardedProto || "http"}://${host}`;
  }

  return envBaseUrl || "http://localhost:3000";
}

export async function sendMagicLinkAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = getStringField(formData, "email").toLowerCase();

  if (!email) {
    return {
      error: "Email requis.",
      message: null,
    };
  }

  const supabase = await createClient();
  const baseUrl = await getBaseUrl();
  const redirectTo = new URL("/auth/callback", baseUrl);
  redirectTo.searchParams.set("next", "/compte");

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo.toString(),
      shouldCreateUser: true,
    },
  });

  if (error) {
    return {
      error: "Envoi du lien impossible. Réessayez dans un instant.",
      message: null,
    };
  }

  return {
    error: null,
    message: "Lien envoyé. Ouvrez votre email pour vous connecter.",
  };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
