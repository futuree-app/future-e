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

async function requestMagicLink(
  email: string,
  shouldCreateUser: boolean,
) {
  const supabase = await createClient();
  const baseUrl = await getBaseUrl();
  const redirectTo = new URL("/auth/callback", baseUrl);
  redirectTo.searchParams.set("next", "/compte");

  return supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo.toString(),
      shouldCreateUser,
    },
  });
}

function getAuthErrorMessage(error: { message?: string; code?: string } | null) {
  if (!error) {
    return "Envoi du lien impossible. Réessayez dans un instant.";
  }

  if (error.code === "otp_disabled" || error.code === "email_provider_disabled") {
    return "Le magic link n'est pas active dans Supabase Auth.";
  }

  if (error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit") {
    return "Trop de tentatives. Attendez un instant avant de redemander un lien.";
  }

  if (error.code === "user_not_found" || error.code === "email_not_confirmed") {
    return "Aucun compte actif pour cet email. Creez d'abord votre compte.";
  }

  if (error.message?.toLowerCase().includes("user not found")) {
    return "Aucun compte actif pour cet email. Creez d'abord votre compte.";
  }

  return "Envoi du lien impossible. Réessayez dans un instant.";
}

export async function continueWithEmailAction(
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

  const { error } = await requestMagicLink(email, true);

  if (error) {
    return {
      error: getAuthErrorMessage(error),
      message: null,
    };
  }

  return {
    error: null,
    message:
      "Lien envoye. Ouvrez votre email pour entrer dans futur•e. Si c'est votre premiere visite, votre acces sera cree automatiquement.",
  };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
