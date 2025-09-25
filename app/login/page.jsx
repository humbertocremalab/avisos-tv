"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const ALLOWED_USERS = ["usuario1@example.com", "usuario2@example.com", "usuario3@example.com"];

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!ALLOWED_USERS.includes(email)) {
      setErrorMsg("❌ Usuario no autorizado");
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) setErrorMsg(error.message);
    else router.push("/dashboard");
  };

  // Si ya hay sesión, redirige automáticamente
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session && ALLOWED_USERS.includes(data.session.user.email)) {
        router.push("/dashboard");
      }
    });
  }, []);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "Poppins, sans-serif" }}>
      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "10px", width: "300px" }}>
        <h1>🔑 Login Dashboard</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: "10px", fontSize: "1rem" }}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: "10px", fontSize: "1rem" }}
        />
        <button type="submit" style={{ padding: "10px", background: "#4DA6FF", color: "white", fontSize: "1rem", cursor: "pointer", borderRadius: "6px" }}>
          Ingresar
        </button>
        {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}
      </form>
    </div>
  );
}
