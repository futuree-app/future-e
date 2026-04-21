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

function getAuthErrorMessage(error: { message?: string; code?: string } | null) {
  if (!error) {
    return "Action impossible. Réessayez dans un instant.";
  }

  if (error.code === "email_provider_disabled") {
    return "L'authentification email n'est pas active dans Supabase Auth.";
  }

  if (error.code === "invalid_credentials") {
    return "Email ou mot de passe incorrect.";
  }

  if (error.code === "email_exists" || error.code === "user_already_exists") {
    return "Un compte existe deja avec cet email. Connectez-vous.";
  }

  if (error.code === "weak_password") {
    return "Choisissez un mot de passe plus robuste, au moins 8 caracteres.";
  }

  if (error.code === "email_not_confirmed") {
    return "Confirmez d'abord votre email avant de vous connecter.";
  }

  return "Action impossible. Réessayez dans un instant.";
}

export async function signInWithPasswordAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = getStringField(formData, "email").toLowerCase();
  const password = getStringField(formData, "password");

  if (!email || !password) {
    return {
      error: "Email et mot de passe requis.",
      message: null,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      error: getAuthErrorMessage(error),
      message: null,
    };
  }

  redirect("/compte");
}

export async function signUpWithPasswordAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = getStringField(formData, "email").toLowerCase();
  const password = getStringField(formData, "password");

  if (!email || !password) {
    return {
      error: "Email et mot de passe requis.",
      message: null,
    };
  }

  if (password.length < 8) {
    return {
      error: "Mot de passe trop court. Utilisez au moins 8 caracteres.",
      message: null,
    };
  }

  const supabase = await createClient();
  const baseUrl = await getBaseUrl();
  const redirectTo = new URL("/auth/callback", baseUrl);
  redirectTo.searchParams.set("next", "/compte");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectTo.toString(),
    },
  });

  if (error) {
    return {
      error: getAuthErrorMessage(error),
      message: null,
    };
  }

  if (data.session) {
    redirect("/compte");
  }

  return {
    error: null,
    message:
      "Compte cree. Verifiez votre email pour confirmer votre adresse puis connectez-vous.",
  };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
