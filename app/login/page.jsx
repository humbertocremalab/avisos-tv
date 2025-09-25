"use client";

// Wrapper que evita problemas de SSR
import LoginClient from "./LoginClient";

export default function LoginPage() {
  return <LoginClient />;
}
