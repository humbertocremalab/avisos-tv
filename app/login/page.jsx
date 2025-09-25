"use client";

// Wrapper que evita problemas de SSR
import LoginClient from "./loginClient";

export default function LoginPage() {
  return <LoginClient />;
}
